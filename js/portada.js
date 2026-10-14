// ===== Portada que va cambiando + barra de avisos — Maria Teresa Modas =====
// Para cambiar textos, fotos o el orden, editá solo PORTADAS y AVISOS_BARRA.
//
// En cada portada:
// - foto:   ruta de la imagen
// - ajuste: 'completa' muestra la foto entera (ideal para fotos de cuerpo entero
//           con fondo liso); 'recortada' la agranda hasta llenar el espacio
// - link:   '#ofertas' muestra las ofertas, '#categoria-NOMBRE' una categoría,
//           '#catalogo-titulo' todo el catálogo, o cualquier link (WhatsApp, etc.)
// - soloConOfertas: true = se muestra solo si hay productos en oferta
// En el título, {descuentoMax} se reemplaza solo por el mayor % de descuento.

const PORTADAS = [
  {
    soloConOfertas: true,
    foto: 'img/conjuntos/lila_crep.jpg',
    ajuste: 'completa',
    chip: '🔥 Ofertas',
    titulo: 'Hasta <em>{descuentoMax}% OFF</em>',
    texto: 'Pantalones y conjuntos de modal y crep a precios de liquidación.',
    boton: 'Ver ofertas',
    link: '#ofertas',
  },
  {
    foto: 'img/remeras/floral-corazon.jpg',
    ajuste: 'recortada',
    chip: '✿ Nueva temporada',
    titulo: 'Ropa linda,<br><em>precios de amiga</em>',
    texto: 'Jeans, buzos, remeras y camperas para vos y toda la familia. Envíos en Cipolletti y zonas cercanas.',
    boton: 'Ver catálogo',
    link: '#catalogo-titulo',
  },
  {
    foto: 'img/conjuntos/pantalon_rosa_modal.jpg',
    ajuste: 'completa',
    chip: '✿ Conjuntos',
    titulo: 'Conjuntos de<br><em>modal y crep</em>',
    texto: 'Cómodos, frescos y en un montón de colores.',
    boton: 'Ver conjuntos',
    link: '#categoria-conjuntos',
  },
  {
    foto: 'img/pantalones/azul-clasico-frente.jpg',
    ajuste: 'recortada',
    chip: '✿ Jeans',
    titulo: 'Jeans que<br><em>te quedan bien</em>',
    texto: 'Palazzo, wide leg, oxford y más. Consultanos por tu talle.',
    boton: 'Ver pantalones',
    link: '#categoria-pantalones',
  },
];

const SEGUNDOS_POR_PORTADA = 6;

// Mensajes que pasan en la barra de arriba. Si hay una promo activa,
// el texto "barra" de js/promo.js se agrega primero.
const AVISOS_BARRA = [
  '🚚 Envíos a domicilio en Cipolletti y zonas cercanas',
  '💳 Transferencia, Mercado Pago y efectivo',
  '💬 Te asesoramos por WhatsApp',
];

const WHATSAPP_PORTADA = 'https://wa.me/542995185092';
const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Barra de avisos en movimiento =====
(function armarBarra() {
  const barra = document.getElementById('barraAnuncio');
  if (!barra) return;

  const promo = window.PROMO_VIGENTE;
  const avisos = [...(promo && promo.barra ? [promo.barra] : []), ...AVISOS_BARRA];
  if (!avisos.length) return;

  if (sinMovimiento) {
    barra.innerHTML = `<p>${avisos[0]}</p>`;
    return;
  }

  // Se repite la tira dos veces para que el movimiento no tenga cortes
  const tira = avisos.map(a => `<span>${a}</span>`).join('<span class="barra-sep">✿</span>');
  barra.innerHTML = `
    <div class="barra-cinta" aria-hidden="true">
      <div class="barra-tira">${tira}<span class="barra-sep">✿</span></div>
      <div class="barra-tira">${tira}<span class="barra-sep">✿</span></div>
    </div>
    <p class="solo-lectores">${avisos.join('. ')}</p>
  `;
  const largo = avisos.join('').length;
  barra.querySelector('.barra-cinta').style.animationDuration = `${Math.max(18, largo * 0.32)}s`;
})();

// ===== Portada que cambia sola =====
function iniciarPortada() {
  const portadaEl = document.getElementById('portada');
  if (!portadaEl) return;

  const lista = typeof productos !== 'undefined' ? productos : [];
  const ofertas = typeof enOferta === 'function' ? lista.filter(enOferta) : [];
  const descuentoMax = ofertas.reduce((max, p) => {
    const anterior = Number(p.precioAnterior);
    return anterior > p.precio ? Math.max(max, Math.round(100 - (p.precio / anterior) * 100)) : max;
  }, 0);

  const portadas = PORTADAS.filter(s => !s.soloConOfertas || ofertas.length);
  if (!portadas.length) return;

  const promo = window.PROMO_VIGENTE;
  const esExterno = (link) => /^https?:/.test(link);

  portadaEl.innerHTML = `
    ${portadas.map((s, i) => `
      <div class="hero-slide ${i === 0 ? 'activa' : ''}" role="group" aria-roledescription="portada"
           aria-label="${i + 1} de ${portadas.length}" ${i === 0 ? '' : 'aria-hidden="true"'}>
        <div class="hero-txt">
          <span class="chip">${s.chip}</span>
          <h2>${s.titulo.replace('{descuentoMax}', descuentoMax)}</h2>
          <p>${s.texto}</p>
          ${s.soloConOfertas && promo && promo.cuentaRegresiva ? `<p class="hero-cuenta">⏰ ${promo.etiqueta || 'La promo'} termina en <strong data-cuenta-regresiva></strong></p>` : ''}
          <div class="hero-botones">
            <a href="${s.link}" class="btn-principal" ${esExterno(s.link) ? 'target="_blank" rel="noopener"' : ''}>${s.boton} →</a>
            <a href="${WHATSAPP_PORTADA}" target="_blank" rel="noopener" class="btn-secundario-hero">Escribinos</a>
          </div>
        </div>
        <div class="hero-img ${s.ajuste === 'completa' ? 'completa' : ''}" role="img" aria-label="${s.chip.replace(/[^\p{L}\s]/gu, '').trim()}"
             style="background-image: url('${s.foto}')"></div>
      </div>
    `).join('')}
    ${portadas.length > 1 ? `
      <button class="hero-flecha izq" aria-label="Portada anterior">‹</button>
      <button class="hero-flecha der" aria-label="Portada siguiente">›</button>
      <div class="hero-puntos">
        ${portadas.map((_, i) => `<button class="hero-punto ${i === 0 ? 'activo' : ''}" aria-label="Ver portada ${i + 1}"></button>`).join('')}
      </div>
    ` : ''}
  `;
  if (window.actualizarCuentaRegresiva) window.actualizarCuentaRegresiva();
  if (portadas.length < 2) return;

  const slides = portadaEl.querySelectorAll('.hero-slide');
  const puntos = portadaEl.querySelectorAll('.hero-punto');
  let actual = 0;
  let timer = null;
  let pausada = false;

  function mostrar(i) {
    actual = (i + slides.length) % slides.length;
    slides.forEach((s, j) => {
      s.classList.toggle('activa', j === actual);
      s.toggleAttribute('aria-hidden', j !== actual);
      s.querySelectorAll('a').forEach(a => { a.tabIndex = j === actual ? 0 : -1; });
    });
    puntos.forEach((p, j) => p.classList.toggle('activo', j === actual));
  }

  function programar() {
    clearInterval(timer);
    if (sinMovimiento || pausada) return;
    timer = setInterval(() => mostrar(actual + 1), SEGUNDOS_POR_PORTADA * 1000);
  }

  portadaEl.querySelector('.hero-flecha.izq').addEventListener('click', () => { mostrar(actual - 1); programar(); });
  portadaEl.querySelector('.hero-flecha.der').addEventListener('click', () => { mostrar(actual + 1); programar(); });
  puntos.forEach((p, j) => p.addEventListener('click', () => { mostrar(j); programar(); }));

  // Se frena mientras el mouse está encima (solo en compu: en el celular
  // tocar la pantalla no cuenta) o mientras se navega con el teclado
  if (window.matchMedia('(hover: hover)').matches) {
    portadaEl.addEventListener('mouseenter', () => { pausada = true; programar(); });
    portadaEl.addEventListener('mouseleave', () => { pausada = false; programar(); });
  }
  portadaEl.addEventListener('focusin', (e) => {
    if (e.target.matches(':focus-visible')) { pausada = true; programar(); }
  });
  portadaEl.addEventListener('focusout', () => { pausada = false; programar(); });

  // Deslizar con el dedo en el celular
  let inicioX = null;
  portadaEl.addEventListener('touchstart', (e) => { inicioX = e.touches[0].clientX; }, { passive: true });
  portadaEl.addEventListener('touchend', (e) => {
    if (inicioX === null) return;
    const dx = e.changedTouches[0].clientX - inicioX;
    if (Math.abs(dx) > 40) { mostrar(actual + (dx < 0 ? 1 : -1)); programar(); }
    inicioX = null;
  });

  mostrar(0);
  programar();
}

// La portada de ofertas necesita los productos, así que espera a que carguen
if (typeof productos !== 'undefined' && productos.length) {
  iniciarPortada();
} else {
  document.addEventListener('productos-listos', iniciarPortada, { once: true });
  document.addEventListener('productos-error', iniciarPortada, { once: true });
}
