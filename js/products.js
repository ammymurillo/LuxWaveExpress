// ─── PRODUCTS PAGE JS ───

let currentFilter = 'all';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  // Check URL params for category
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  if (cat) {
    currentFilter = cat;
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === cat);
    });
  }
  LuxwaveData.onProductsReady(() => {
    updateCounts();
    renderProducts();
  });
});

function updateCounts() {
  const products = LuxwaveData.products;
  document.getElementById('count-all').textContent = products.length;
  ['celulares', 'laptops', 'tablets', 'monitores', 'accesorios'].forEach(cat => {
    const el = document.getElementById(`count-${cat}`);
    if (el) el.textContent = products.filter(p => p.category === cat).length;
  });
}

function filterProducts(cat, btn) {
  currentFilter = cat;
  currentSearch = '';
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else {
    document.querySelectorAll('.filter-btn').forEach(b => {
      if (b.dataset.cat === cat) b.classList.add('active');
    });
  }
  renderProducts();
}

function searchProducts(query) {
  currentSearch = query.toLowerCase();
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let products = [...LuxwaveData.products];

  if (currentFilter !== 'all') {
    products = products.filter(p => p.category === currentFilter);
  }

  if (currentSearch) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(currentSearch) ||
      p.shortDesc.toLowerCase().includes(currentSearch) ||
      p.category.toLowerCase().includes(currentSearch)
    );
  }

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="icon">🔍</div>
        <h3>No encontramos productos</h3>
        <p style="margin-top:8px;font-size:0.875rem">Intenta cambiar los filtros o busca algo diferente</p>
        <button class="btn btn-primary" style="margin-top:20px" onclick="filterProducts('all', null)">Ver todos</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map((p, i) => {
    const discount = p.originalPrice
      ? Math.round((1 - p.price / p.originalPrice) * 100)
      : null;

    return `
      <div class="product-card animate-fadeInUp" style="animation-delay:${i * 0.06}s" onclick="openProductModal(${p.id})">
        <div class="product-emoji">
          ${LuxwaveSheets.productVisualHTML(p)}
          <div class="product-badge-overlay">
            ${getStatusBadge(p.status)}
            ${p.new ? '<span class="badge badge-blue">Nuevo</span>' : ''}
            ${discount ? `<span class="badge badge-warning">-${discount}%</span>` : ''}
          </div>
        </div>
        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-short-desc">${p.shortDesc}</div>
          <div class="product-footer">
            <div class="product-price">
              <span class="currency">$</span>${p.price.toLocaleString()}
              ${p.originalPrice ? `<span style="font-size:0.7rem;color:var(--gray);text-decoration:line-through;margin-left:6px;font-family:'Sora'">$${p.originalPrice.toLocaleString()}</span>` : ''}
            </div>
            <div class="product-cta">→</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ── PRODUCT MODAL ──
function openProductModal(id) {
  const product = LuxwaveData.products.find(p => p.id === id);
  if (!product) return;

  const content = document.getElementById('modalContent');
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  content.innerHTML = `
    <div style="width:100%;height:260px;display:flex;align-items:center;justify-content:center;font-size:8rem;background:linear-gradient(135deg,rgba(45,106,191,0.15),rgba(13,26,51,0.8));border-radius:20px 20px 0 0;overflow:hidden">
      ${LuxwaveSheets.productVisualHTML(product, 'border-radius:20px 20px 0 0')}
    </div>
    <div class="product-modal-body">
      <div class="product-modal-header">
        <div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
            ${getStatusBadge(product.status)}
            ${product.new ? '<span class="badge badge-blue">Nuevo</span>' : ''}
            ${discount ? `<span class="badge badge-warning">-${discount}% OFF</span>` : ''}
          </div>
          <h2 class="product-modal-title">${product.name}</h2>
          <p style="color:var(--blue-light);font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-top:6px">${product.category}</p>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div class="product-modal-price">${formatPrice(product.price)}</div>
          ${product.originalPrice ? `
            <div style="font-size:0.8rem;color:var(--gray);text-decoration:line-through">${formatPrice(product.originalPrice)}</div>
            <div style="font-size:0.75rem;color:var(--success);font-weight:700;margin-top:2px">Ahorra ${discount}%</div>
          ` : ''}
        </div>
      </div>

      <div class="product-meta-grid">
        <div class="meta-item">
          <div class="meta-label">Condición</div>
          <div class="meta-value">✅ ${product.condition}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Disponibilidad</div>
          <div class="meta-value">${product.stock > 5 ? 'En stock' : product.stock > 0 ? `⚡ Solo ${product.stock} disponibles` : 'Agotado'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Garantía</div>
          <div class="meta-value">Incluida</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Envío</div>
          <div class="meta-value">Todo Panamá</div>
        </div>
      </div>

      <p class="product-modal-desc">${product.description}</p>

      <div class="product-specs">
        <h4>Especificaciones Técnicas</h4>
        <ul class="spec-list">
          ${product.specs.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>

      <div class="product-modal-actions">
        <button class="btn btn-primary btn-lg" onclick="goToCotizar('${product.name}')" style="flex:1">
          Solicitar Cotización
        </button>
        <button class="btn btn-sand" onclick="openWhatsApp('50766123456', '¡Hola! Vi el ${product.name} en su página ($ ${product.price}). ¿Está disponible?')">
          WhatsApp
        </button>
      </div>
    </div>
  `;

  document.getElementById('productModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('productModal').classList.remove('active');
  document.body.style.overflow = '';
}

function goToCotizar(name) {
  closeModal();
  window.location.href = `contacto.html?producto=${encodeURIComponent(name)}#cotizar`;
}

// Close on overlay click / Escape
document.getElementById('productModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
