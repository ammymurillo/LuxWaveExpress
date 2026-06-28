// ─── ADMIN PANEL JS ───

let editingProductId = null;

// ── AUTH ──
function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');

  if (user === LuxwaveData.admin.user && pass === LuxwaveData.admin.password) {
    sessionStorage.setItem('lux_auth', '1');
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'block';
    LuxwaveData.onProductsReady(initDashboard);
  } else {
    errEl.style.display = 'block';
    document.getElementById('loginPass').value = '';
    setTimeout(() => errEl.style.display = 'none', 3000);
  }
}

function doLogout() {
  sessionStorage.removeItem('lux_auth');
  document.getElementById('dashboardPage').style.display = 'none';
  document.getElementById('loginPage').style.display = 'block';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
}

function togglePass() {
  const inp = document.getElementById('loginPass');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// Check auth on load
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('lux_auth')) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'block';
    LuxwaveData.onProductsReady(initDashboard);
  }
});

// ── DASHBOARD INIT ──
function initDashboard() {
  // Set date
  const d = new Date();
  document.getElementById('adminDate').textContent =
    d.toLocaleDateString('es-PA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  renderStats();
  renderInventorySummary();
  renderProductsList();
}

// ── SECTION NAV ──
function showSection(name) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));

  document.getElementById(`section-${name}`)?.classList.add('active');
  document.querySelector(`[data-section="${name}"]`)?.classList.add('active');

  if (name === 'products') renderProductsList();
}

// ── STATS ──
function renderStats() {
  const products = LuxwaveData.products;

  const stats = [
    { icon: '📦', label: 'Productos en catálogo', value: products.length, change: '+2 este mes', dir: 'up' },
    { icon: '✅', label: 'Disponibles', value: products.filter(p => p.status === 'disponible').length, change: 'En stock', dir: 'up' },
    { icon: '⚡', label: 'Bajo stock', value: products.filter(p => p.status === 'bajo-stock').length, change: 'Requieren reposición', dir: 'down' },
  ];

  document.getElementById('statsGrid').innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
      <div class="stat-change ${s.dir}">${s.dir === 'up' ? '↑' : '↓'} ${s.change}</div>
    </div>
  `).join('');
}

// ── INVENTORY SUMMARY ──
function renderInventorySummary() {
  const cats = ['celulares', 'laptops', 'tablets', 'monitores', 'accesorios'];
  const el = document.getElementById('inventorySummary');

  el.innerHTML = cats.map(cat => {
    const count = LuxwaveData.products.filter(p => p.category === cat).length;
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.04)">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:1.25rem">${LuxwaveSheets.emojiForCategory(cat)}</span>
          <span style="font-size:0.875rem;text-transform:capitalize;font-weight:500">${cat}</span>
        </div>
        <span class="badge badge-blue">${count} productos</span>
      </div>
    `;
  }).join('');
}

// ── PRODUCTS ──
function renderProductsList() {
  const products = LuxwaveData.products;
  const el = document.getElementById('productsList');
  const countEl = document.getElementById('productsCount');
  if (countEl) countEl.textContent = `${products.length} productos en catálogo`;

  el.innerHTML = products.map(p => `
    <div class="product-list-item">
      ${p.image
        ? `<img src="${p.image}" alt="${p.name}" class="product-list-emoji" style="object-fit:cover" onerror="this.outerHTML='<div class=&quot;product-list-emoji&quot;>${p.emoji}</div>'">`
        : `<div class="product-list-emoji">${p.emoji}</div>`
      }
      <div class="product-list-info">
        <div class="product-list-name">${p.name}</div>
        <div class="product-list-meta" style="text-transform:capitalize">${p.category} • ${p.condition} • Stock: ${p.stock}</div>
      </div>
      ${getStatusBadge(p.status)}
      <div class="product-list-price">${formatPrice(p.price)}</div>
      <div class="product-list-actions">
        <button class="btn btn-ghost btn-sm" onclick="editProduct(${p.id})" title="Editar">✏️</button>
        <button class="btn btn-sm" style="background:rgba(239,68,68,0.1);color:var(--danger)" onclick="deleteProduct(${p.id})" title="Eliminar">🗑️</button>
      </div>
    </div>
  `).join('');
}

// ── PRODUCT FORM ──
// El ícono ya no se elige a mano: se asigna automáticamente según la
// categoría seleccionada (ver LuxwaveSheets.CATEGORY_EMOJI en sheets.js)

function updateCategoryPreview() {
  const category = document.getElementById('p_category').value;
  const preview = document.getElementById('categoryPreview');
  if (!preview) return;

  if (!category) {
    preview.textContent = 'El ícono del producto se asigna automáticamente según la categoría';
    return;
  }
  const emoji = LuxwaveSheets.emojiForCategory(category);
  preview.innerHTML = `Ícono asignado: <span style="font-size:1.1rem">${emoji}</span>`;
}

// Muestra una vista previa de la imagen pegada, convirtiendo links de
// Google Drive automáticamente (igual que en Ajiminis)
function previewProductImage() {
  const raw = document.getElementById('p_image').value.trim();
  const wrap = document.getElementById('imagePreviewWrap');
  const img = document.getElementById('imagePreview');

  if (!raw) { wrap.style.display = 'none'; return; }

  const url = LuxwaveSheets.toImageUrl(raw);
  img.src = url;
  wrap.style.display = 'block';
  img.onerror = () => { wrap.style.display = 'none'; };
}

async function saveProduct(e) {
  e.preventDefault();

  const specsRaw = document.getElementById('p_specs').value;
  const specs = specsRaw.split('\n').map(s => s.trim()).filter(Boolean);
  const category = document.getElementById('p_category').value;

  const productData = {
    name: document.getElementById('p_name').value.trim(),
    category,
    image: LuxwaveSheets.toImageUrl(document.getElementById('p_image').value.trim()),
    price: parseFloat(document.getElementById('p_price').value),
    originalPrice: parseFloat(document.getElementById('p_original_price').value) || null,
    status: document.getElementById('p_status').value,
    condition: document.getElementById('p_condition').value,
    stock: parseInt(document.getElementById('p_stock').value) || 0,
    emoji: LuxwaveSheets.emojiForCategory(category),
    shortDesc: document.getElementById('p_short_desc').value.trim(),
    description: document.getElementById('p_description').value.trim(),
    specs,
    featured: document.getElementById('p_featured').checked,
    new: document.getElementById('p_new').checked
  };

  const wasEditing = !!editingProductId;

  // Render local inmediato (no esperamos la sync para que la UI responda al toque)
  if (wasEditing) {
    LuxwaveData.updateProduct(editingProductId, productData).then(result => {
      showSyncToast('actualizado', result.synced);
    });
    editingProductId = null;
    document.getElementById('productFormTitle').textContent = 'Añadir Producto';
  } else {
    LuxwaveData.addProduct(productData).then(result => {
      showSyncToast('añadido al catálogo', result.synced);
    });
  }

  resetProductForm();
  showSection('products');
}

// Muestra un toast distinto según si el cambio quedó guardado en el
// Google Sheet o solo localmente (cuando no hay Apps Script configurado)
function showSyncToast(verb, synced) {
  if (synced) {
    showToast(`Producto ${verb} y guardado en el Sheet`);
  } else {
    showToast(`Producto ${verb} solo en este navegador (sin sincronizar con el Sheet)`, 'error');
  }
}

function editProduct(id) {
  const p = LuxwaveData.products.find(prod => prod.id === id);
  if (!p) return;

  editingProductId = id;
  showSection('add-product');
  document.getElementById('productFormTitle').textContent = 'Editar Producto';

  document.getElementById('p_name').value = p.name;
  document.getElementById('p_category').value = p.category;
  document.getElementById('p_image').value = p.image || '';
  document.getElementById('p_price').value = p.price;
  document.getElementById('p_original_price').value = p.originalPrice || '';
  document.getElementById('p_status').value = p.status;
  document.getElementById('p_condition').value = p.condition;
  document.getElementById('p_stock').value = p.stock;
  document.getElementById('p_short_desc').value = p.shortDesc;
  document.getElementById('p_description').value = p.description;
  document.getElementById('p_specs').value = p.specs.join('\n');
  document.getElementById('p_featured').checked = p.featured;
  document.getElementById('p_new').checked = p.new;
  updateCategoryPreview();
  previewProductImage();
}

function deleteProduct(id) {
  const p = LuxwaveData.products.find(prod => prod.id === id);
  if (!p) return;
  if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
  LuxwaveData.deleteProduct(id).then(result => {
    showSyncToast('eliminado', result.synced);
  });
  renderProductsList();
  renderStats();
  renderInventorySummary();
}

function resetProductForm() {
  editingProductId = null;
  document.getElementById('productFormTitle').textContent = 'Añadir Producto';
  document.getElementById('productForm').reset();
  document.getElementById('imagePreviewWrap').style.display = 'none';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }
});
