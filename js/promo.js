// ===== Pop-up de promociones — Maria Teresa Modas =====

const PROMO = {
  activa: true,
  id: 'dia-madre-2026',           
  desde: '2026-10-01',
  hasta: '2026-10-18',            
  demoraMs: 1500,                  // espera antes de abrirse
  mostrarSiempre: true,            // true = aparece cada vez que se abre la página; false = una vez por día

  barra: '💐 Día de la Madre: 10% OFF en efectivo o transferencia',  // texto de la barra de arriba
  etiqueta: 'Día de la Madre',
  titulo: 'Regalale algo lindo a mamá',
  subtitulo: 'Promos válidas hasta el domingo 18 de octubre',
  beneficios: [
    { destacado: '10% OFF', texto: 'pagando en efectivo o transferencia' },
  ],
  codigo: '',              
  botonTexto: 'Quiero mi descuento',
  whatsapp: '542995185092',
  mensajeWhatsapp: '¡Hola! Vi la promo del Día de la Madre en la web y quiero consultar 💐',
  legal: 'No acumulable con otras promociones. Hasta agotar stock.',
};

(function iniciarPromo() {
  if (!PROMO.activa) return;

  const hoy = new Date();
  const desde = new Date(`${PROMO.desde}T00:00:00`);
  const hasta = new Date(`${PROMO.hasta}T23:59:59`);
  if (hoy < desde || hoy > hasta) return;

  const barra = document.getElementById('barraAnuncio');
  if (barra && PROMO.barra) barra.textContent = PROMO.barra;

  const claveCierre = `promo-cerrada-${PROMO.id}`;
  const hoyTexto = hoy.toISOString().slice(0, 10);
  try {
    if (!PROMO.mostrarSiempre && localStorage.getItem(claveCierre) === hoyTexto) return;
  } catch (e) { /* sin localStorage: se muestra igual */ }

  const linkWhatsapp = `https://wa.me/${PROMO.whatsapp}?text=${encodeURIComponent(
    PROMO.codigo ? `${PROMO.mensajeWhatsapp} (código ${PROMO.codigo})` : PROMO.mensajeWhatsapp
  )}`;

  const overlay = document.createElement('div');
  overlay.className = 'promo-overlay';
  overlay.innerHTML = `
    <div class="promo-panel" role="dialog" aria-modal="true" aria-labelledby="promoTitulo">
      <button class="promo-cerrar" aria-label="Cerrar promoción">×</button>
      <div class="promo-flores" aria-hidden="true">✿ ❀ ✿</div>
      <span class="promo-etiqueta">${PROMO.etiqueta}</span>
      <h2 id="promoTitulo">${PROMO.titulo}</h2>
      <p class="promo-subtitulo">${PROMO.subtitulo}</p>
      <ul class="promo-beneficios">
        ${PROMO.beneficios.map(b => `
          <li><strong>${b.destacado}</strong><span>${b.texto}</span></li>
        `).join('')}
      </ul>
      ${PROMO.codigo ? `
        <button class="promo-codigo" type="button" title="Copiar código">
          <span>Código</span><strong>${PROMO.codigo}</strong><em>copiar</em>
        </button>` : ''}
      <a class="promo-boton" href="${linkWhatsapp}" target="_blank" rel="noopener">${PROMO.botonTexto}</a>
      <button class="promo-seguir" type="button">Seguir mirando el catálogo</button>
      <p class="promo-legal">${PROMO.legal}</p>
    </div>
  `;

  function cerrar() {
    overlay.classList.remove('visible');
    document.removeEventListener('keydown', alPresionarTecla);
    setTimeout(() => overlay.remove(), 250);
    try { localStorage.setItem(claveCierre, hoyTexto); } catch (e) { /* nada */ }
  }
  function alPresionarTecla(e) { if (e.key === 'Escape') cerrar(); }

  overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(); });
  overlay.querySelector('.promo-cerrar').addEventListener('click', cerrar);
  overlay.querySelector('.promo-seguir').addEventListener('click', cerrar);
  overlay.querySelector('.promo-boton').addEventListener('click', cerrar);

  const botonCodigo = overlay.querySelector('.promo-codigo');
  if (botonCodigo) {
    botonCodigo.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(PROMO.codigo);
        botonCodigo.querySelector('em').textContent = '¡copiado!';
      } catch (e) {
        botonCodigo.querySelector('em').textContent = 'anotalo 😉';
      }
    });
  }

  setTimeout(() => {
    const detalle = document.getElementById('detalleOverlay');
    if (detalle && !detalle.hidden) return;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    document.addEventListener('keydown', alPresionarTecla);
    overlay.querySelector('.promo-boton').focus({ preventScroll: true });
  }, PROMO.demoraMs);
})();
