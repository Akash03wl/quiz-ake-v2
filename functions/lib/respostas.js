/* ============================================================
   QUIZ AKE BACKEND - lib/respostas.js
   Helpers de Response JSON com CORS básico (mesmo domínio) e
   cabeçalhos de segurança.
   ============================================================ */

const CABEC = {
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store'
};

export function json(objeto, status) {
  return new Response(JSON.stringify(objeto), { status: status || 200, headers: CABEC });
}

export function ok(corpo, extras) {
  const cab = { ...CABEC };
  if (extras) Object.assign(cab, extras);
  return new Response(JSON.stringify(corpo), { status: 200, headers: cab });
}

export function criado(corpo) {
  return json(corpo, 201);
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