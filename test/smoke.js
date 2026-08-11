/* ============================================================
   TESTE DE FUMO - js/smoke.js
   Integração offline: roda o router onRequest() contra um banco
   D1 em memória sQLite real (node:sqlite) e valida os fluxos
   críticos (auth, segurança do token de recuperação, rate limit).
   ============================================================ */
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/[[path]].js';
import d1 from './helpers/d1.cjs';

async function requisicao(db, url, metodo, corpo, extras) {
  const headerExtra = extras && extras.headers ? extras.headers : {};
  const req = new Request(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...headerExtra },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  const resp = await onRequest({ request: req, env: { DB: db, ENVIRONMENT: 'production' } });
  return { resp, dados: resp.status !== 204 ? await resp.json() : null };
}

const db = d1.aplicarMigrations(d1.criarDb());
const BASE = 'https://quiz.test/api/';
let erros = 0;

function exigir(condicao, rotulo) {
  if (condicao) { console.log('  ok - ' + rotulo); return; }
  erros++;
  console.log('  FALHOU - ' + rotulo);
}

// ---------- health ----------
console.log('> health');
{
  const { resp } = await requisicao(db, BASE + 'health', 'GET');
  exigir(resp.status === 200, 'health responde 200');
}

// ---------- registro ----------
console.log('> registrar (https)');
let cookie = '';
{
  let r = await requisicao(db, BASE + 'auth/registrar', 'POST', { nome: 'Ana Teste', email: 'ana@teste.com', senha: 'senha-forte-1' });
  exigir(r.resp.status === 201, 'registra usuário (201)');
  exigir(r.dados && r.dados.usuario && r.dados.usuario.papel === 'usuario', 'resposta contém usuário');
  const setCookie = (r.resp.headers.getSetCookie && r.resp.headers.getSetCookie()[0]) || r.resp.headers.get('Set-Cookie') || '';
  if (!setCookie.includes('Secure')) { erros++; console.log('  FALHOU - cookie deveria ter Secure em https'); }
  else console.log('  ok - cookie Secure em https');
  cookie = setCookie.split(';')[0];
}
{
  let r = await requisicao(db, BASE + 'auth/registrar', 'POST', { nome: 'Ana Teste', email: 'ana@teste.com', senha: 'senha-forte-1' });
  exigir(r.resp.status === 409, 'e-mail duplicado retorna 409');
}

// ---------- login ----------
console.log('> login');
{
  let r = await requisicao(db, BASE + 'auth/login', 'POST', { email: 'ana@teste.com', senha: 'senha-errada' });
  exigir(r.resp.status === 401, 'senha errada retorna 401');
}
{
  let r = await requisicao(db, BASE + 'auth/login', 'POST', { email: 'ana@teste.com', senha: 'senha-forte-1' });
  exigir(r.resp.status === 200, 'login correto retorna 200');
  cookie = r.resp.headers.get('Set-Cookie') || '';
}

// ---------- desafio do dia (global) ----------
console.log('> desafio do dia');
let seedDesafio = null;
{
  let r = await requisicao(db, BASE + 'desafio', 'GET');
  exigir(r.resp.status === 200, 'GET /api/desafio responde 200');
  exigir(/^\d{4}-\d{2}-\d{2}$/.test(r.dados.data), 'desafio devolve data ISO de hoje');
  exigir(r.dados.perguntas === 6, 'desafio devolve 6 perguntas');
  exigir(typeof r.dados.seed === 'number', 'desafio devolve seed numérica');
  seedDesafio = r.dados.seed;
  exigir(r.dados.resumo && r.dados.resumo.jogadores === 0, 'antes de jogar: 0 jogadores');
  exigir(r.dados.minha === null, 'sem sessão: minha é null');
}
{
  let r2 = await requisicao(db, BASE + 'desafio', 'GET');
  exigir(r2.dados.seed === seedDesafio, 'seed é determinística no mesmo dia');
}
{
  let r = await requisicao(db, BASE + 'desafio/resultado', 'POST', { pontos: 120, acertos: 5, erros: 1, combo: 5 }, { headers: { Cookie: cookie } });
  exigir(r.resp.status === 200, 'POST /api/desafio/resultado responde 200');
  exigir(r.dados.resumo && r.dados.resumo.jogadores === 1, 'após resultado: 1 jogador hoje');
  exigir(r.dados.minha && r.dados.minha.jogou && r.dados.minha.melhor === 120, 'minha: melhor 120 pts');
  exigir(r.dados.minha.posicao === 1, 'minha posição é #1');
  exigir(r.dados.top && r.dados.top.length === 1, 'top do dia tem 1 registro');
}
{
  let r = await requisicao(db, BASE + 'desafio/resultado', 'POST', { pontos: 90, acertos: 4, erros: 2, combo: 2 }, { headers: { Cookie: cookie } });
  exigir(r.dados.minha && r.dados.minha.melhor === 120, 'vale o melhor do dia (120, não 90)');
}
{
  let r = await requisicao(db, BASE + 'desafio/resultado', 'POST', { pontos: 50, acertos: 2, erros: 4, combo: 1 });
  exigir(r.resp.status === 401, 'sem sessão, enviar resultado retorna 401');
}

// ---------- logout ----------
console.log('> logout');
{
  let r = await requisicao(db, BASE + 'auth/logout', 'POST', {});
  exigir(r.resp.status === 200, 'logout retorna 200');
}

// ---------- recuperação de senha: token NUNCA em https ----------
console.log('> recuperar senha');
{
  let r = await requisicao(db, BASE + 'auth/recuperar', 'POST', { email: 'ana@teste.com' });
  exigir(r.resp.status === 200, 'recuperar responde 200 (https)');
  exigir(r.dados.tokenTeste === undefined, 'https NÃO expõe tokenTeste');
}
{
  // Simula dev local via http:// (wrangler dev): aqui o token pode aparecer.
  let req = new Request('http://localhost:8787/api/auth/recuperar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ana@teste.com' })
  });
  let resp = await onRequest({ request: req, env: { DB: db, ENVIRONMENT: 'development' } });
  let dados = await resp.json();
  exigir(dados.tokenTeste !== undefined, 'dev local (http) expõe tokenTeste para testes');
}

// ---------- rate limit no registro ----------
console.log('> rate limit em registrar (5/min por IP)');
{
  let resultados = [];
  for (let i = 0; i < 6; i++) {
    let r = await requisicao(db, BASE + 'auth/registrar', 'POST', { nome: 'Cliente ' + i, email: 'cli' + i + '@teste.com', senha: 'senha-forte-1' });
    resultados.push(r.resp.status);
  }
  exigir(resultados[0] === 201, '1ª requisição registra');
  exigir(resultados.includes(201), 'algum registro é aceito antes do limite');
  exigir(resultados.includes(429), 'após o limite, alguma requisição é bloqueada (429)');
}

console.log(erros ? '\nSMOKE: ' + erros + ' falha(s).' : '\nSMOKE: tudo passou.');
process.exit(erros ? 1 : 0);