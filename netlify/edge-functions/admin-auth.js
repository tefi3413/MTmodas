// ===== Contraseña del panel de administración — Maria Teresa Modas =====
// Netlify ejecuta esto antes de mostrar /admin.html. Si el usuario y la
// contraseña no coinciden con los que cargaste en Netlify, no se muestra.
//
// Se configuran en Netlify → Project configuration → Environment variables:
//   ADMIN_USUARIO   (opcional, por defecto "admin")
//   ADMIN_PASSWORD  (obligatoria; sin ella el panel queda bloqueado)

function compararSeguro(a, b) {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

function leerCredenciales(request) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Basic ')) return null;
  try {
    const bytes = Uint8Array.from(atob(header.slice(6)), c => c.charCodeAt(0));
    const texto = new TextDecoder().decode(bytes);
    const separador = texto.indexOf(':');
    if (separador === -1) return null;
    return { usuario: texto.slice(0, separador), clave: texto.slice(separador + 1) };
  } catch (e) {
    return null;
  }
}

export default async (request, context) => {
  const usuarioOk = Netlify.env.get('ADMIN_USUARIO') || 'admin';
  const claveOk = Netlify.env.get('ADMIN_PASSWORD');

  if (!claveOk) {
    return new Response('Panel bloqueado: falta configurar ADMIN_PASSWORD en Netlify.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  const cred = leerCredenciales(request);
  // Se comparan ambos siempre (&), para no dar pistas por el tiempo de respuesta
  const ok = cred !== null && (compararSeguro(cred.usuario, usuarioOk) & compararSeguro(cred.clave, claveOk)) === 1;
  if (ok) {
    const respuesta = await context.next();
    respuesta.headers.set('Cache-Control', 'no-store');
    respuesta.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return respuesta;
  }

  return new Response('Necesitás usuario y contraseña para entrar al panel.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Panel MT Modas", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};

export const config = {
  path: ['/admin', '/admin/', '/admin.html'],
};
