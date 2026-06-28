// ─── LUXWAVE EXPRESS - GOOGLE SHEETS CONNECTOR ───

const LuxwaveSheets = {

  // 👉 Reemplaza esta URL si alguna vez vuelves a publicar el Sheet
  CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRy4OKrnjX9uvx_iNOgFkxPfTISfTNlPYL0TcuvXbU4u0_g5oFV-OlyhjAhCNsS_ht0nb8IEuIb8q2M/pubhtml",

  // 👉 URL del Apps Script Web App que escribe en el Sheet (agregar/editar/borrar).
  // Sigue las instrucciones del archivo LuxWaveBackend.gs para crearlo, y
  // pega aquí la URL que termina en /exec. Mientras esté vacío (""), el
  // catálogo funciona en modo "solo lectura desde Sheets" + edición local
  // de respaldo (los cambios del admin no se guardan en el Sheet real).
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwChDKnjOed34vpm11R6eB-xaVF5JUCX1kty-v1yjckUf150sW8TBnjcJ6UGEuWrYapgQ/exec",

  CACHE_KEY: "lux_products_cache",
  //emoji: this.emojiForCategory(category),

  // Mapea categoría -> emoji, así el admin ya no elige emoji a mano
  CATEGORY_EMOJI: {
    celulares: "📱",
    laptops: "💻",
    tablets: "📲",
    monitores: "🖥️",
    accesorios: "🎧"
  },

  emojiForCategory(cat) {
    return this.CATEGORY_EMOJI[cat] || "📦";
  },

  // ── Convierte un link de Google Drive ("compartir") a una URL de imagen
  // directa que sí se puede mostrar en <img>. Si ya es una URL normal
  // (Imgur, etc.) la deja igual.
  toImageUrl(url) {
    if (!url) return "";
    url = url.trim();
    if (!url) return "";

    // Link típico: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    let match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;

    // Link de tipo: https://drive.google.com/open?id=FILE_ID
    match = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;

    // Cualquier otra URL (Imgur, etc.) se usa tal cual
    return url;
  },

  // ── Genera el HTML de la "cara visual" del producto: imagen si hay,
  // con respaldo automático al emoji si no hay imagen o si falla la carga.
  // extraStyle: estilos CSS adicionales para el <img> (opcional).
  productVisualHTML(product, extraStyle = '') {
    const emojiHtml = `<span class='product-visual-emoji'>${product.emoji}</span>`;
    if (!product.image) return emojiHtml;
    return `<img src="${product.image}" alt="${(product.name || '').replace(/"/g, '')}" style="width:100%;height:100%;object-fit:cover;${extraStyle}" onerror="this.outerHTML=&quot;${emojiHtml.replace(/"/g, '&quot;')}&quot;">`;
  },

  // ── Parser de CSV sencillo (soporta comillas y comas dentro de campos) ──
  parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (char === '"' && next === '"') { field += '"'; i++; }
        else if (char === '"') { inQuotes = false; }
        else { field += char; }
      } else {
        if (char === '"') inQuotes = true;
        else if (char === ',') { row.push(field); field = ""; }
        else if (char === '\r') { /* ignore */ }
        else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
        else { field += char; }
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim() !== ""));
  },

  // ── Convierte filas crudas del CSV en objetos producto ──
  rowsToProducts(rows) {
    if (!rows.length) return [];
    const headers = rows[0].map(h => h.trim());
    const idx = (name) => headers.indexOf(name);

    const iId = idx("id"), iName = idx("name"), iCategory = idx("category"),
      iPrice = idx("price"), iOriginalPrice = idx("originalPrice"), iStatus = idx("status"),
      iCondition = idx("condition"), iStock = idx("stock"), iShortDesc = idx("shortDesc"),
      iDescription = idx("description"), iSpecs = idx("specs"),
      iFeatured = idx("featured"), iNew = idx("new"),iImage = idx("image");

    const toBool = (v) => /^true$/i.test((v || "").trim());

    return rows.slice(1).map(r => {
      const category = (r[iCategory] || "").trim();
      return {
        id: parseInt(r[iId], 10) || 0,
        name: (r[iName] || "").trim(),
        category,
        image: iImage !== -1 ? this.toImageUrl(r[iImage]) : "",
        price: parseFloat(r[iPrice]) || 0,
        originalPrice: r[iOriginalPrice] && r[iOriginalPrice].trim() !== "" ? parseFloat(r[iOriginalPrice]) : null,
        status: (r[iStatus] || "disponible").trim(),
        condition: (r[iCondition] || "Nuevo").trim(),
        stock: parseInt(r[iStock], 10) || 0,
        shortDesc: (r[iShortDesc] || "").trim(),
        description: (r[iDescription] || "").trim(),
        specs: (r[iSpecs] || "").split(";;").map(s => s.trim()).filter(Boolean),
        featured: toBool(r[iFeatured]),
        new: toBool(r[iNew])
      };
    }).filter(p => p.id && p.name);
  },

  // ── Descarga productos desde el Sheet publicado ──
  async fetchProducts() {
    try {
      const res = await fetch(this.CSV_URL + "&t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const text = await res.text();
      const rows = this.parseCSV(text);
      const products = this.rowsToProducts(rows);

      if (products.length === 0) throw new Error("Sheet vacío o columnas incorrectas");

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(products));
      return products;
    } catch (err) {
      console.warn("No se pudo leer el Google Sheet, usando caché/local:", err);
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    }
  },

  // ── Si tienes un Apps Script desplegado, esto envía cambios al Sheet ──
  async pushToScript(action, payload) {
    if (!this.SCRIPT_URL) return { ok: false, reason: "no-script-url" };
    try {
      const res = await fetch(this.SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, payload })
      });
      return await res.json();
    } catch (err) {
      console.warn("No se pudo sincronizar con el Apps Script:", err);
      return { ok: false, reason: "fetch-failed" };
    }
  }
};
