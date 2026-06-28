// ─── LUXWAVE EXPRESS - DATA STORE ───
// All data managed here since no database yet

const LuxwaveData = {

  // ── PRODUCTS ──
  // Ya no van escritos a mano aquí: se cargan desde el Google Sheet
  // (ver js/sheets.js). Este arreglo arranca vacío y se llena con
  // LuxwaveData.loadProducts(), que es async.
  products: [],
  productsReady: false,
  _readyCallbacks: [],

  // Se resuelve cuando los productos ya están cargados (desde Sheet o caché)
  onProductsReady(cb) {
    if (this.productsReady) cb();
    else this._readyCallbacks.push(cb);
  },

  // ── STATS ──
  stats: {
    totalVisits: 1247,
    pendingOrders: 0,
    completedOrders: 0,
    monthlyRevenue: 0
  },

  // ── ADMIN CREDENTIALS ──
  admin: {
    user: "admin",
    password: "luxwave2024"
  },

  // ── CONTACT INFO ──
  contact: {
    whatsapp: "50769775333",
    phone: "+507 6977-5333",
    email: "luxwaveexpress@gmail.com",
    address: "Tienda Virtual, Panama Oeste",
    hours: "Todos los dias disponible"
  },

  // ── SAVE PRODUCTS (caché local, respaldo si el Sheet no responde) ──
  saveProducts() {
    localStorage.setItem('lux_products', JSON.stringify(this.products));
    localStorage.setItem(LuxwaveSheets.CACHE_KEY, JSON.stringify(this.products));
  },

  // ── LOAD PRODUCTS (desde Google Sheets, con caché de respaldo) ──
  async loadProducts() {
    const fromSheet = await LuxwaveSheets.fetchProducts();
    if (fromSheet && fromSheet.length) {
      this.products = fromSheet;
    } else {
      const saved = localStorage.getItem('lux_products');
      if (saved) this.products = JSON.parse(saved);
    }
    this.productsReady = true;
    this._readyCallbacks.forEach(cb => cb());
    this._readyCallbacks = [];
  },

  // ── ADD PRODUCT ──
  // Se agrega localmente al instante (UI responsiva) y, si hay un Apps Script
  // configurado en sheets.js, se intenta escribir también en el Google Sheet.
  async addProduct(product) {
    const id = Math.max(...this.products.map(p => p.id), 0) + 1;
    const fullProduct = { ...product, id };
    this.products.push(fullProduct);
    this.saveProducts();
    const sync = await LuxwaveSheets.pushToScript('add', fullProduct);
    return { id, synced: !!(sync && sync.ok) };
  },

  // ── UPDATE PRODUCT ──
  async updateProduct(id, updates) {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) return { synced: false };
    this.products[idx] = { ...this.products[idx], ...updates };
    this.saveProducts();
    const sync = await LuxwaveSheets.pushToScript('update', this.products[idx]);
    return { synced: !!(sync && sync.ok) };
  },

  // ── DELETE PRODUCT ──
  async deleteProduct(id) {
    this.products = this.products.filter(p => p.id !== id);
    this.saveProducts();
    const sync = await LuxwaveSheets.pushToScript('delete', { id });
    return { synced: !!(sync && sync.ok) };
  }
};

// Cargar productos desde Google Sheets al iniciar (async)
LuxwaveData.loadProducts();

// ─── UTILITIES ───

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container') ||
    (() => {
      const el = document.createElement('div');
      el.id = 'toast-container';
      el.className = 'toast-container';
      document.body.appendChild(el);
      return el;
    })();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : '❌'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function getStatusBadge(status) {
  const map = {
    'disponible': '<span class="badge badge-success">Disponible</span>',
    'bajo-stock': '<span class="badge badge-warning">Bajo Stock</span>',
    'agotado': '<span class="badge badge-danger">Agotado</span>',
  };
  return map[status] || '';
}

function openWhatsApp(phone, message = '') {
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
}

// Scroll reveal animation
function initScrollReveal() {
  const els = document.querySelectorAll('.hidden');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(el => {
      if (el.isIntersecting) {
        el.target.classList.add('animate-fadeInUp');
        el.target.classList.remove('hidden');
        observer.unobserve(el.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => observer.observe(el));
}

// Navbar scroll effect
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  setTimeout(initScrollReveal, 100);
});
