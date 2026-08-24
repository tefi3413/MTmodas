// ===== Maria Teresa Modas — catálogo =====
// Este archivo lee data/productos.json, dibuja las tarjetas, arma los
// filtros por categoría, y abre un panel de detalle al hacer click en
// un producto (fotos grandes + descripción, estilo Mercado Libre).

const catalogoEl = document.getElementById('catalogo');
const categoriasEl = document.getElementById('categorias');
const statusEl = document.getElementById('status');

let productos = [];
let categoriaActiva = 'todas';

async function cargarProductos() {
  try {
    const res = await fetch('data/productos.json');
    if (!res.ok) throw new Error('No se pudo leer productos.json');
    productos = await res.json();

    if (!productos.length) {
      statusEl.textContent = 'Todavía no hay productos cargados en data/productos.json';
      return;
    }

    statusEl.classList.add('hidden');
    armarCategorias(productos);
    renderProductos(productos);
    revisarHashInicial();
  } catch (err) {
    statusEl.textContent = 'No se pudo cargar el catálogo. Revisá que estés sirviendo el sitio con un servidor local (no abriendo el HTML directo).';
    console.error(err);
  }
}

function armarCategorias(lista) {
  const categorias = ['todas', ...new Set(lista.map(p => p.categoria))];

  categoriasEl.innerHTML = categorias.map(cat => `
    <button class="tag-btn ${cat === categoriaActiva ? 'active' : ''}" data-categoria="${cat}">
      ${cat}
    </button>
  `).join('');

  categoriasEl.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      categoriaActiva = btn.dataset.categoria;
      categoriasEl.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filtrados = categoriaActiva === 'todas'
        ? productos
        : productos.filter(p => p.categoria === categoriaActiva);

      renderProductos(filtrados);
    });
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

function renderProductos(lista) {
  if (!lista.length) {
    catalogoEl.innerHTML = '<p class="status">No hay productos en esta sección todavía.</p>';
    return;
  }

  catalogoEl.innerHTML = lista.map(p => `
    <article class="producto" data-id="${p.id}">
      <div class="producto-img">${galeriaHTML(getImagenes(p), p.nombre)}</div>
      <div class="producto-info">
        <h3 class="producto-nombre">${p.nombre}</h3>
        <span class="producto-precio">$ ${p.precio.toLocaleString('es-AR')}</span>
        <div class="producto-talles">
          ${p.talles.map(t => `<span class="talle">${t}</span>`).join('')}
        </div>
      </div>
    </article>
  `).join('');

  catalogoEl.querySelectorAll('.producto').forEach(card => {
    const id = card.dataset.id;
    const producto = lista.find(p => String(p.id) === id);
    const imgContainer = card.querySelector('.producto-img');
    activarGaleria(imgContainer, getImagenes(producto));

    // Click en cualquier parte de la tarjeta (menos flechas/puntos) abre el detalle
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

function abrirDetalle(producto) {
  detalleNombre.textContent = producto.nombre;
  detallePrecio.textContent = `$ ${producto.precio.toLocaleString('es-AR')}`;
  detalleTalles.innerHTML = producto.talles.map(t => `<span class="talle">${t}</span>`).join('');
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

function aplicarHash() {
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
