// ===== Avisos en la esquina — Maria Teresa Modas =====
// Cada tanto aparece un cartelito con un producto en oferta o con pocas
// unidades. Se arma solo con los datos reales de productos.json.

const AVISOS = {
  activos: true,
  primeroALosSegundos: 12,
  cadaSegundos: 25,
  duracionSegundos: 7,
  maximoPorVisita: 6,
  pocasUnidades: 2,   // "Quedan pocas unidades" si el stock total cargado es este número o menos
};

function iniciarAvisos() {
  if (!AVISOS.activos || typeof productos === 'undefined') return;
  try { if (sessionStorage.getItem('avisos-cerrados')) return; } catch (e) { /* nada */ }

  const stockTotal = (p) => Array.isArray(p.stock)
    ? p.stock.reduce((a, b) => a + (Number(b) || 0), 0)
    : null;

  const candidatos = productos.map(p => {
    const total = stockTotal(p);
    if (typeof enOferta === 'function' && enOferta(p)) return { p, tipo: 'oferta' };
    if (total !== null && total > 0 && total <= AVISOS.pocasUnidades) return { p, tipo: 'pocas' };
    return null;
  }).filter(Boolean);
  if (!candidatos.length) return;

  // Mezcla al azar para que no salgan siempre los mismos
  for (let i = candidatos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidatos[i], candidatos[j]] = [candidatos[j], candidatos[i]];
  }

  const aviso = document.createElement('div');
  aviso.className = 'aviso';
  aviso.setAttribute('role', 'status');
  document.body.appendChild(aviso);

  let mostrados = 0;
  let timerOcultar = null;
  let timerSiguiente = null;

  function hayAlgoAbierto() {
    const detalle = document.getElementById('detalleOverlay');
    return document.hidden || document.querySelector('.promo-overlay') || (detalle && !detalle.hidden);
  }

  function ocultar() {
    aviso.classList.remove('visible');
  }

  function mostrarSiguiente() {
    if (mostrados >= AVISOS.maximoPorVisita) return;
    if (hayAlgoAbierto()) {
      timerSiguiente = setTimeout(mostrarSiguiente, 5000);
      return;
    }

    const { p, tipo } = candidatos[mostrados % candidatos.length];
    const foto = (p.imagenes && p.imagenes[0]) || 'img/placeholder.png';
    const anterior = Number(p.precioAnterior) > p.precio
      ? `<s>$ ${Number(p.precioAnterior).toLocaleString('es-AR')}</s> `
      : '';

    aviso.innerHTML = `
      <button class="aviso-cuerpo" type="button">
        <img src="${foto}" alt="" onerror="this.src='img/placeholder.png'">
        <span class="aviso-texto">
          <span class="aviso-tipo">${tipo === 'oferta' ? '🔥 En oferta' : '⏳ Quedan pocas unidades'}</span>
          <strong>${p.nombre}</strong>
          <span class="aviso-precio">${anterior}$ ${p.precio.toLocaleString('es-AR')}</span>
        </span>
      </button>
      <button class="aviso-cerrar" type="button" aria-label="No mostrar más avisos">×</button>
    `;
    aviso.querySelector('.aviso-cuerpo').addEventListener('click', () => {
      ocultar();
      location.hash = `producto-${p.id}`;
    });
    aviso.querySelector('.aviso-cerrar').addEventListener('click', () => {
      ocultar();
      clearTimeout(timerSiguiente);
      clearTimeout(timerOcultar);
      try { sessionStorage.setItem('avisos-cerrados', '1'); } catch (e) { /* nada */ }
    });

    mostrados++;
    requestAnimationFrame(() => aviso.classList.add('visible'));
    clearTimeout(timerOcultar);
    timerOcultar = setTimeout(ocultar, AVISOS.duracionSegundos * 1000);
    timerSiguiente = setTimeout(mostrarSiguiente, AVISOS.cadaSegundos * 1000);
  }

  timerSiguiente = setTimeout(mostrarSiguiente, AVISOS.primeroALosSegundos * 1000);
}

if (typeof productos !== 'undefined' && productos.length) {
  iniciarAvisos();
} else {
  document.addEventListener('productos-listos', iniciarAvisos, { once: true });
}
