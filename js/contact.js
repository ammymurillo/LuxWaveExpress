// ─── CONTACT PAGE JS ───

document.addEventListener('DOMContentLoaded', () => {
  // Pre-fill product if coming from products page
  const params = new URLSearchParams(window.location.search);
  const producto = params.get('producto');
  if (producto) {
    const productInput = document.getElementById('q_product');
    if (productInput) {
      productInput.value = decodeURIComponent(producto);
    }
    // Scroll to form
    setTimeout(() => {
      document.getElementById('cotizar')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }
});

function submitQuote(e) {
  e.preventDefault();

  const name = document.getElementById('q_name').value.trim();
  const phone = document.getElementById('q_phone').value.trim();
  const email = document.getElementById('q_email').value.trim();
  const category = document.getElementById('q_category').value;
  const budget = document.getElementById('q_budget').value;
  const product = document.getElementById('q_product').value.trim();
  const use = document.getElementById('q_use').value;
  const notes = document.getElementById('q_notes').value.trim();
  const contactPref = document.querySelector('input[name="contact_pref"]:checked')?.value || 'whatsapp';

  if (!name || !phone || !category || !use) {
    showToast('Por favor completa los campos obligatorios', 'error');
    return;
  }

  const quote = {
    id: Date.now(),
    date: new Date().toLocaleString('es-PA'),
    name,
    phone,
    email,
    category,
    budget,
    product,
    use,
    notes,
    contactPref,
    status: 'pendiente'
  };

  // Build WhatsApp message
  const msg = `Nueva Cotización – Luxwave Express*\n\n` +
    `*Nombre:* ${name}\n` +
    `*Teléfono:* ${phone}\n` +
    `${email ? `*Email:* ${email}\n` : ''}` +
    `*Categoría:* ${category}\n` +
    `${product ? `*Equipo:* ${product}\n` : ''}` +
    `*Presupuesto:* ${budget || 'No especificado'}\n` +
    `*Uso:* ${use}\n` +
    `${notes ? `*Notas:* ${notes}\n` : ''}` +
    `*Contactar por:* ${contactPref}\n\n` +
    `_Enviado desde luxwaveexpress.pa_`;

  showToast('Cotización enviada correctamente. ¡Te contactaremos pronto!');

  // Reset form
  document.getElementById('quoteForm').reset();

  // Open WhatsApp after small delay
  setTimeout(() => {
    openWhatsApp('50769775333', msg);
  }, 1000);
}
