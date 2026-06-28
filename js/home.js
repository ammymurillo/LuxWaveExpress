// ─── HOME PAGE JS ───

document.addEventListener('DOMContentLoaded', () => {
  LuxwaveData.onProductsReady(buildCarousel);
});

// ── CAROUSEL ──
let carouselIndex = 0;
let carouselItems = [];

function buildCarousel() {
  const featured = LuxwaveData.products.filter(p => p.featured);
  carouselItems = featured;
  const track = document.getElementById('carouselTrack');
  const dots = document.getElementById('carouselDots');
  if (!track) return;

  track.innerHTML = featured.map(p => `
    <div class="carousel-card" onclick="openProductModal(${p.id})">
      <div class="carousel-card-emoji">
        ${LuxwaveSheets.productVisualHTML(p)}
        <div class="carousel-card-badge">${getStatusBadge(p.status)}</div>
      </div>
      <div class="carousel-card-body">
        <div class="carousel-card-cat">${p.category}</div>
        <div class="carousel-card-name">${p.name}</div>
        <div class="carousel-card-footer">
          <span class="carousel-card-price">${formatPrice(p.price)}</span>
          ${p.new ? '<span class="badge badge-blue">Nuevo</span>' : ''}
        </div>
      </div>
    </div>
  `).join('');

  dots.innerHTML = featured.map((_, i) =>
    `<button class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></button>`
  ).join('');

  document.getElementById('carouselPrev').addEventListener('click', () => {
    carouselIndex = (carouselIndex - 1 + featured.length) % featured.length;
    updateCarousel();
  });

  document.getElementById('carouselNext').addEventListener('click', () => {
    carouselIndex = (carouselIndex + 1) % featured.length;
    updateCarousel();
  });

  // Auto-advance
  setInterval(() => {
    carouselIndex = (carouselIndex + 1) % featured.length;
    updateCarousel();
  }, 5000);
}

function goToSlide(idx) {
  carouselIndex = idx;
  updateCarousel();
}

function updateCarousel() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  // Determine items per view
  const itemWidth = track.children[0]?.offsetWidth + 24 || 300;
  track.style.transform = `translateX(-${carouselIndex * itemWidth}px)`;

  document.querySelectorAll('.carousel-dot').forEach((d, i) => {
    d.classList.toggle('active', i === carouselIndex);
  });
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
    <div class="product-modal-img">${LuxwaveSheets.productVisualHTML(product)}</div>
    <div class="product-modal-body">
      <div class="product-modal-header">
        <div>
          ${getStatusBadge(product.status)}
          ${product.new ? '<span class="badge badge-blue" style="margin-left:6px">Nuevo</span>' : ''}
          <h2 class="product-modal-title" style="margin-top:10px">${product.name}</h2>
          <p style="color:var(--gray);font-size:0.82rem;margin-top:4px;text-transform:capitalize">${product.category}</p>
        </div>
        <div style="text-align:right">
          <div class="product-modal-price">${formatPrice(product.price)}</div>
          ${product.originalPrice ? `
            <div style="font-size:0.8rem;color:var(--gray);text-decoration:line-through">${formatPrice(product.originalPrice)}</div>
            <div style="font-size:0.75rem;color:var(--success);font-weight:700">Ahorra ${discount}%</div>
          ` : ''}
        </div>
      </div>

      <div class="product-meta-grid">
        <div class="meta-item">
          <div class="meta-label">Condición</div>
          <div class="meta-value">✅ ${product.condition}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Stock</div>
          <div class="meta-value">${product.stock > 5 ? 'Disponible' : product.stock > 0 ? `⚡ ${product.stock} unidades` : '❌ Agotado'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Garantía</div>
          <div class="meta-value">Incluida</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Entrega</div>
          <div class="meta-value">24–48h Panamá</div>
        </div>
      </div>

      <p class="product-modal-desc">${product.description}</p>

      <div class="product-specs">
        <h4>Especificaciones</h4>
        <ul class="spec-list">
          ${product.specs.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>

      <div class="product-modal-actions">
        <button class="btn btn-primary btn-lg" onclick="cotizarProducto('${product.name}')" style="flex:1">
          Cotizar este producto
        </button>
        <button class="btn btn-sand" onclick="openWhatsApp('50766123456', '¡Hola! Me interesa el ${product.name} ($ ${product.price}). ¿Está disponible?')">
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

function cotizarProducto(name) {
  closeModal();
  window.location.href = `pages/contacto.html?producto=${encodeURIComponent(name)}#cotizar`;
}

// Close on overlay click
document.getElementById('productModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// Keyboard close
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
