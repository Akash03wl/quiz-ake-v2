/* ============================================================
   NIVORA BACKEND - lib/respostas.js
   Helpers de Response JSON com CORS básico (mesmo domínio) e
   cabeçalhos de segurança.
   ============================================================ */

const CABEC = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

export function json(objeto, status) {
  return new Response(JSON.stringify(objeto), { status: status || 200, headers: CABEC });
}

export function ok(corpo, extras) {
  const cab = { ...CABEC };
  if (extras) Object.assign(cab, extras);
  return new Response(JSON.stringify(corpo), { status: 200, headers: cab });
}

export function criado(corpo, extras) {
  const cab = { ...CABEC };
  if (extras) Object.assign(cab, extras);
  return new Response(JSON.stringify(corpo), { status: 201, headers: cab });
}

export function erro(status, mensagem, extra) {
  const corpo = { erro: mensagem };
  if (extra) Object.assign(corpo, extra);
  return json(corpo, status);
}

// Alias usado por lib/auth.js: responder(status, corpo).
export function responder(status, corpo, extrasCab) {
  const cab = { ...CABEC };
  if (extrasCab) Object.assign(cab, extrasCab);
  return new Response(JSON.stringify(corpo), { status: status, headers: cab });
}

export function naoEncontrado(msg) {
  return erro(404, msg || 'Não encontrado.');
}

export function metodoNaoPermitido() {
  return erro(405, 'Método não suportado.');
}

export default { json, ok, criado, erro, naoEncontrado, metodoNaoPermitido, responder };