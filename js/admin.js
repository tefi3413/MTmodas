// ===== Panel de administración — Maria Teresa Modas =====

let productos = [];
let idEnEdicion = null; // null = estamos creando uno nuevo

const listaEl = document.getElementById('listaProductos');
const contadorEl = document.getElementById('contadorProductos');
const formEl = document.getElementById('formProducto');
const formTituloEl = document.getElementById('formTitulo');

const campoNombre = document.getElementById('campoNombre');
const campoPrecio = document.getElementById('campoPrecio');
const campoCategoria = document.getElementById('campoCategoria');
const campoTalles = document.getElementById('campoTalles');
const campoStock = document.getElementById('campoStock');
const campoDescripcion = document.getElementById('campoDescripcion');
const campoImagenes = document.getElementById('campoImagenes');

const btnGuardar = document.getElementById('btnGuardar');
const btnEliminar = document.getElementById('btnEliminar');
const btnCancelar = document.getElementById('btnCancelar');
const btnNuevo = document.getElementById('btnNuevo');
const btnDescargar = document.getElementById('btnDescargar');

async function cargarProductos() {
  try {
    const res = await fetch('data/productos.json');
    productos = res.ok ? await res.json() : [];
  } catch (err) {
    console.warn('No se pudo leer productos.json existente, arrancamos vacío.', err);
    productos = [];
  }
  renderLista();
}

function renderLista() {
  contadorEl.textContent = `(${productos.length})`;

  if (!productos.length) {
    listaEl.innerHTML = '<p class="ayuda">Todavía no hay productos. Cargá el primero con el formulario.</p>';
    return;
  }

  listaEl.innerHTML = productos.map(p => {
    const sinStockTotal = Array.isArray(p.stock) && p.stock.every(s => Number(s) <= 0);
    return `
      <li class="item-producto ${p.id === idEnEdicion ? 'activo' : ''}" data-id="${p.id}">
        <div>
          <div class="item-producto-nombre">${p.nombre}</div>
          <div class="item-producto-meta">${p.categoria} · $${p.precio.toLocaleString('es-AR')}</div>
        </div>
        ${sinStockTotal ? '<span class="item-producto-sinstock">Sin stock</span>' : ''}
      </li>
    `;
  }).join('');

  listaEl.querySelectorAll('.item-producto').forEach(li => {
    li.addEventListener('click', () => cargarEnFormulario(Number(li.dataset.id)));
  });
}

function proximoId() {
  return productos.length ? Math.max(...productos.map(p => p.id)) + 1 : 1;
}

function cargarEnFormulario(id) {
  const p = productos.find(prod => prod.id === id);
  if (!p) return;

  idEnEdicion = id;
  formTituloEl.textContent = `Editando: ${p.nombre}`;
  campoNombre.value = p.nombre;
  campoPrecio.value = p.precio;
  campoCategoria.value = p.categoria;
  campoTalles.value = (p.talles || []).join(', ');
  campoStock.value = Array.isArray(p.stock) ? p.stock.join(', ') : '';
  campoDescripcion.value = p.descripcion || '';
  campoImagenes.value = (p.imagenes || []).join('\n');

  btnGuardar.textContent = 'Guardar cambios';
  btnEliminar.classList.remove('oculto');
  renderLista();
}

function limpiarFormulario() {
  idEnEdicion = null;
  formEl.reset();
  formTituloEl.textContent = 'Nuevo producto';
  btnGuardar.textContent = 'Agregar producto';
  btnEliminar.classList.add('oculto');
  renderLista();
}

formEl.addEventListener('submit', (e) => {
  e.preventDefault();

  const talles = campoTalles.value.split(',').map(t => t.trim()).filter(Boolean);
  const stockTexto = campoStock.value.trim();
  const stock = stockTexto
    ? stockTexto.split(',').map(s => Number(s.trim()) || 0)
    : null; // sin dato de stock = se asume disponible

  const imagenes = campoImagenes.value.split('\n').map(i => i.trim()).filter(Boolean);

  const productoData = {
    id: idEnEdicion ?? proximoId(),
    nombre: campoNombre.value.trim(),
    precio: Number(campoPrecio.value),
    talles,
    categoria: campoCategoria.value.trim(),
    imagenes: imagenes.length ? imagenes : ['img/placeholder.png'],
    descripcion: campoDescripcion.value.trim()
  };
  if (stock) productoData.stock = stock;

  if (idEnEdicion) {
    const index = productos.findIndex(p => p.id === idEnEdicion);
    productos[index] = productoData;
  } else {
    productos.push(productoData);
  }

  limpiarFormulario();
});

btnEliminar.addEventListener('click', () => {
  if (!idEnEdicion) return;
  if (!confirm('¿Eliminar este producto del catálogo?')) return;
  productos = productos.filter(p => p.id !== idEnEdicion);
  limpiarFormulario();
});

btnCancelar.addEventListener('click', limpiarFormulario);
btnNuevo.addEventListener('click', limpiarFormulario);



btnDescargar.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(productos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'productos.json';
  a.click();
  URL.revokeObjectURL(url);
});

cargarProductos();
