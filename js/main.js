// ===== Maria Teresa Modas — catálogo =====

const catalogoEl = document.getElementById('catalogo');
const categoriasEl = document.getElementById('categorias');
const statusEl = document.getElementById('status');

let productos = [];
let categoriaActiva = 'todas';
let busqueda = '';
const WHATSAPP = '542995185092';

async function cargarProductos() {
  try {
    const res = await fetch('data/productos.json');
    if (!res.ok) throw new Error('No se pudo leer productos.json');
    const cargados = await res.json();

    if (!cargados.length) {
      statusEl.textContent = 'Todavía no hay productos cargados en data/productos.json';
      return;
    }

    // Los últimos que se subieron aparecen primero. El panel le da a cada
    // producto nuevo un id más alto, así que se ordena de mayor a menor id
    // (y si dos tuvieran el mismo, va primero el que está más abajo en el archivo).
    productos = cargados
      .map((p, i) => ({ p, i }))
      .sort((a, b) => (Number(b.p.id) || 0) - (Number(a.p.id) || 0) || b.i - a.i)
      .map(x => x.p);

    statusEl.classList.add('hidden');
    armarCategorias(cargados);  // los círculos de categorías mantienen su orden de siempre
    renderProductos(productos);
    revisarHashInicial();
    document.dispatchEvent(new CustomEvent('productos-listos'));
  } catch (err) {
    document.dispatchEvent(new CustomEvent('productos-error'));
    statusEl.textContent = 'No se pudo cargar el catálogo. Revisá que estés sirviendo el sitio con un servidor local (no abriendo el HTML directo).';
    console.error(err);
  }
}

// Un producto está en oferta si tiene precio anterior mayor o la etiqueta "Oferta"
function enOferta(p) {
  return Number(p.precioAnterior) > p.precio || /oferta/i.test(p.etiqueta || '');
}

function filtrarPor(cat) {
  if (cat === 'todas') return productos;
  if (cat === 'ofertas') return productos.filter(enOferta);
  return productos.filter(p => p.categoria === cat);
}

function armarCategorias(lista) {
  const hayOfertas = lista.some(enOferta);
  const categorias = ['todas', ...(hayOfertas ? ['ofertas'] : []), ...new Set(lista.map(p => p.categoria))];

  // Cada categoría muestra en el círculo la foto de su primer producto
  const fotoDe = (cat) => {
    const prod = cat === 'ofertas' ? lista.find(enOferta) : lista.find(p => p.categoria === cat);
    return prod ? getImagenes(prod)[0] : null;
  };

  categoriasEl.innerHTML = categorias.map(cat => {
    const foto = cat === 'todas' ? null : fotoDe(cat);
    return `
      <button class="tag-btn ${cat === 'ofertas' ? 'tag-ofertas' : ''} ${cat === categoriaActiva ? 'active' : ''}" data-categoria="${cat}">
        <span class="tag-circulo">
          ${foto ? `<img src="${foto}" alt="" loading="lazy" onerror="this.src='img/placeholder.png'">` : '<span>✿</span>'}
        </span>
        ${cat === 'ofertas' ? 'Ofertas 🔥' : cat}
      </button>
    `;
  }).join('');

  categoriasEl.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Si se llegó por un link de sección (#ofertas, #categoria-...) y se elige otra, se limpia el link
      if (hashDeSeccion() && hashDeSeccion() !== btn.dataset.categoria) {
        history.replaceState(null, '', location.pathname + location.search);
      }
      seleccionarCategoria(btn.dataset.categoria);
    });
  });
}

function seleccionarCategoria(cat) {
  if (!categoriasEl.querySelector(`[data-categoria="${cat}"]`)) cat = 'todas';
  categoriaActiva = cat;
  categoriasEl.querySelectorAll('.tag-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.categoria === cat);
  });
  renderActual();
}

// ===== Buscador =====
const normalizar = (texto) => String(texto || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

function coincideBusqueda(p) {
  if (!busqueda) return true;
  const texto = normalizar(`${p.nombre} ${p.categoria} ${p.descripcion || ''} ${p.etiqueta || ''}`);
  return normalizar(busqueda).split(/\s+/).filter(Boolean).every(palabra => texto.includes(palabra));
}

function renderActual() {
  const lista = filtrarPor(categoriaActiva).filter(coincideBusqueda);
  if (!lista.length && busqueda) {
    const consulta = encodeURIComponent(`¡Hola! Estoy buscando "${busqueda}", ¿tienen?`);
    catalogoEl.innerHTML = `
      <p class="status sin-resultados">
        No encontramos "${busqueda.replace(/</g, '&lt;')}"${categoriaActiva !== 'todas' ? ' en esta sección' : ''}.
        <a href="https://wa.me/${WHATSAPP}?text=${consulta}" target="_blank" rel="noopener">Preguntanos por WhatsApp</a>
      </p>`;
    return;
  }
  renderProductos(lista);
}

const buscadorEl = document.getElementById('buscador');
if (buscadorEl) {
  buscadorEl.addEventListener('input', () => {
    busqueda = buscadorEl.value.trim();
    renderActual();
  });
}

function getImagenes(p) {
  return (p.imagenes && p.imagenes.length) ? p.imagenes : ['img/placeholder.png'];
}

// Arma el HTML de una mini-galería (foto + flechas + puntos si hay varias)
function galeriaHTML(imgs, alt) {
  const varias = imgs.length > 1;
  return `
    <img src="${imgs[0]}" alt="${alt}" loading="lazy" data-index="0"
         onerror="this.src='img/placeholder.png'">
    ${varias ? `
      <button class="galeria-flecha izq" aria-label="Foto anterior">‹</button>
      <button class="galeria-flecha der" aria-label="Foto siguiente">›</button>
      <div class="galeria-puntos">
        ${imgs.map((_, i) => `<span class="punto ${i === 0 ? 'activo' : ''}" data-index="${i}"></span>`).join('')}
      </div>
    ` : ''}
  `;
}

// Engancha los eventos de una mini-galería ya insertada en el DOM
function activarGaleria(container, imgs) {
  const imgEl = container.querySelector('img');
  const puntos = container.querySelectorAll('.punto');

  function mostrar(index) {
    const i = ((index % imgs.length) + imgs.length) % imgs.length;
    imgEl.src = imgs[i];
    imgEl.dataset.index = i;
    puntos.forEach(p => p.classList.toggle('activo', Number(p.dataset.index) === i));
  }

  const flechaIzq = container.querySelector('.galeria-flecha.izq');
  const flechaDer = container.querySelector('.galeria-flecha.der');
  if (flechaIzq) flechaIzq.addEventListener('click', (e) => { e.stopPropagation(); mostrar(Number(imgEl.dataset.index) - 1); });
  if (flechaDer) flechaDer.addEventListener('click', (e) => { e.stopPropagation(); mostrar(Number(imgEl.dataset.index) + 1); });
  puntos.forEach(p => p.addEventListener('click', (e) => { e.stopPropagation(); mostrar(Number(p.dataset.index)); }));

  return { mostrar };
}

// Talles: los que tienen stock 0 se muestran tachados
function tallesHTML(p) {
  return p.talles.map((t, i) => {
    const agotado = Array.isArray(p.stock) && Number(p.stock[i]) <= 0;
    return `<span class="talle ${agotado ? 'agotado' : ''}" ${agotado ? 'title="Sin stock"' : ''}>${t}</span>`;
  }).join('');
}

// Precio actual, con el anterior tachado si el producto está en oferta
function precioHTML(p) {
  const anterior = Number(p.precioAnterior) > p.precio
    ? `<s class="precio-anterior">$ ${Number(p.precioAnterior).toLocaleString('es-AR')}</s>`
    : '';
  return `${anterior}$ ${p.precio.toLocaleString('es-AR')}`;
}

// Etiqueta sobre la foto: la que se cargó en el panel, o "-X%" si tiene precio anterior
function etiquetaHTML(p) {
  if (p.etiqueta) return `<span class="badge">${p.etiqueta}</span>`;
  if (Number(p.precioAnterior) > p.precio) {
    const off = Math.round(100 - (p.precio / p.precioAnterior) * 100);
    return `<span class="badge oferta">-${off}%</span>`;
  }
  return '';
}

function linkWhatsapp(p) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `¡Hola! Quería consultar por "${p.nombre}" ($ ${p.precio.toLocaleString('es-AR')}) que vi en la web.`
  )}`;
}

function renderProductos(lista) {
  if (!lista.length) {
    catalogoEl.innerHTML = '<p class="status">No hay productos en esta sección todavía.</p>';
    return;
  }

  catalogoEl.innerHTML = lista.map(p => `
    <article class="producto" data-id="${p.id}">
      <div class="producto-img">
        ${etiquetaHTML(p)}
        ${galeriaHTML(getImagenes(p), p.nombre)}
      </div>
      <div class="producto-info">
        <h3 class="producto-nombre">${p.nombre}</h3>
        <span class="producto-precio">${precioHTML(p)}</span>
        <div class="producto-talles">${tallesHTML(p)}</div>
        <div class="producto-consultar">
          <a href="${linkWhatsapp(p)}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
        </div>
      </div>
    </article>
  `).join('');

  catalogoEl.querySelectorAll('.producto').forEach(card => {
    const id = card.dataset.id;
    const producto = lista.find(p => String(p.id) === id);
    const imgContainer = card.querySelector('.producto-img');
    activarGaleria(imgContainer, getImagenes(producto));

    card.querySelector('.producto-consultar a').addEventListener('click', (e) => e.stopPropagation());

    // Click en cualquier parte de la tarjeta (menos flechas/puntos/botón) abre el detalle
    card.addEventListener('click', () => {
      location.hash = `producto-${id}`;
    });
  });
}

// ===== Panel de detalle de producto =====
const detalleOverlay = document.getElementById('detalleOverlay');
const detalleGaleria = document.getElementById('detalleGaleria');
const detalleNombre = document.getElementById('detalleNombre');
const detallePrecio = document.getElementById('detallePrecio');
const detalleTalles = document.getElementById('detalleTalles');
const detalleDescripcion = document.getElementById('detalleDescripcion');
const detalleCerrar = document.getElementById('detalleCerrar');
const detalleWhatsapp = document.getElementById('detalleWhatsapp');

function abrirDetalle(producto) {
  detalleNombre.textContent = producto.nombre;
  detallePrecio.innerHTML = precioHTML(producto);
  detalleTalles.innerHTML = tallesHTML(producto);
  detalleWhatsapp.href = linkWhatsapp(producto);
  detalleDescripcion.textContent = producto.descripcion || '';

  detalleGaleria.innerHTML = galeriaHTML(getImagenes(producto), producto.nombre);
  activarGaleria(detalleGaleria, getImagenes(producto));

  detalleOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function cerrarDetalle() {
  detalleOverlay.hidden = true;
  document.body.style.overflow = '';
  if (location.hash.startsWith('#producto-')) {
    history.replaceState(null, '', location.pathname + location.search);
  }
}

function revisarHashInicial() {
  aplicarHash();
}

let hashAnterior = '';

function irAlCatalogo() {
  document.getElementById('catalogo-titulo').scrollIntoView({ behavior: 'smooth' });
}

// Si se toca un link a la sección en la que ya se está, el navegador no avisa
// (el link no cambia), así que se baja al catálogo a mano
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#ofertas"], a[href^="#categoria-"]');
  if (link && link.getAttribute('href') === location.hash) {
    e.preventDefault();
    if (categoriaActiva !== hashDeSeccion()) seleccionarCategoria(hashDeSeccion());
    irAlCatalogo();
  }
});

// Links de sección: #ofertas o #categoria-NOMBRE (ej: #categoria-conjuntos)
function hashDeSeccion() {
  if (location.hash === '#ofertas') return 'ofertas';
  const m = location.hash.match(/^#categoria-(.+)$/);
  return m ? decodeURIComponent(m[1]).toLowerCase() : null;
}

function aplicarHash() {
  // mtmodas.netlify.app/#ofertas (o #categoria-conjuntos) abre el catálogo filtrado.
  // Lo usan el pop-up y la portada, y se puede compartir en Instagram/WhatsApp.
  const vieneDeProducto = hashAnterior.startsWith('#producto-');
  hashAnterior = location.hash;

  const seccion = hashDeSeccion();
  if (seccion) {
    detalleOverlay.hidden = true;
    document.body.style.overflow = '';
    if (categoriaActiva !== seccion) seleccionarCategoria(seccion);
    // Al volver de ver un producto no se mueve la página, para no perder el lugar
    if (!vieneDeProducto) irAlCatalogo();
    return;
  }

  const match = location.hash.match(/^#producto-(.+)$/);
  if (!match) {
    detalleOverlay.hidden = true;
    document.body.style.overflow = '';
    return;
  }
  const producto = productos.find(p => String(p.id) === match[1]);
  if (producto) abrirDetalle(producto);
}

detalleCerrar.addEventListener('click', () => { history.back(); });
detalleOverlay.addEventListener('click', (e) => {
  if (e.target === detalleOverlay) history.back();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !detalleOverlay.hidden) history.back();
});
window.addEventListener('hashchange', aplicarHash);

cargarProductos();
