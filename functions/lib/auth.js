/* ============================================================
   QUIZ AKE BACKEND - lib/auth.js
   Autenticação: hash de senha (PBKDF2 via WebCrypto), tokens,
   sessões em cookie e RBAC básico (usuario/moderador/admin).
   ============================================================ */

import { responder } from './respostas.js';

const CHAVE_COOKIE = 'qake_sessao';
const DURACAO_SESSAO_DIAS = 30;
const DURACAO_SESSAO_MS = 30 * 24 * 60 * 60 * 1000;

// Gera um hash PBKDF2 em formato "pbkdf2$salt$hash" (hex).
async function gerarHashSenha(senha) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivar(senha, salt, 100000);
  return 'pbkdf2$' + toHex(salt) + '$' + toHex(hash);
}

async function verificarSenha(senha, hashArmazenado) {
  if (!senha || !hashArmazenado) return false;
  const partes = String(hashArmazenado).split('$');
  if (partes.length !== 3 || partes[0] !== 'pbkdf2') return false;
  const salt = fromHex(partes[1]);
  const esperado = fromHex(partes[2]);
  const hash = await derivar(senha, salt, 100000);
  return tempoSeguro(hash, esperado);
}

async function derivar(senha, salt, iteracoes) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt.buffer, iterations: iteracoes, hash: 'SHA-256' },
    material,
    256
  ));
}

// Comparação em tempo constante.
function tempoSeguro(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// Token aleatório de N bytes em hex.
function gerarToken(bytes) {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes || 32)));
}

function toHex(uint8) {
  return Array.from(uint8).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function fromHex(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

// ---------- COOKIES ----------

function lerCookie(request, nome) {
  const cookies = request.headers.get('Cookie') || '';
  const partes = cookies.split(';');
  for (const p of partes) {
    const [k, ...resto] = p.trim().split('=');
    if (k === nome) return decodeURIComponent(resto.join('='));
  }
  return null;
}

function cookieDeSessao(valor, env) {
  const seguro = !env || env.ENVIRONMENT === 'production';
  return CHAVE_COOKIE + '=' + valor +
    '; Path=/; Max-Age=' + Math.floor(DURACAO_SESSAO_MS / 1000) +
    '; HttpOnly; SameSite=Lax' +
    (seguro ? '; Secure' : '');
}

function cookieExpirado() {
  return CHAVE_COOKIE + '=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax';
}

// ---------- SESSÕES (banco) ----------

async function criarSessao(env, usuarioId) {
  const token = gerarToken(32);
  const agora = Date.now();
  const expira = new Date(agora + DURACAO_SESSAO_MS).toISOString();
  await env.DB.prepare(
    'INSERT INTO sessoes (token, usuario_id, criada_em, expira_em) VALUES (?, ?, ?, ?)'
  ).bind(token, usuarioId, new Date(agora).toISOString(), expira).run();
  return token;
}

async function revogarSessao(env, token) {
  if (!token) return;
  await env.DB.prepare('DELETE FROM sessoes WHERE token = ?').bind(token).run();
}

// Resolve o usuário autenticado a partir do cookie da requisição.
async function usuarioDaSessao(env, request) {
  const token = lerCookie(request, CHAVE_COOKIE);
  if (!token) return null;
  try {
    const sessao = await env.DB.prepare(
      'SELECT usuario_id FROM sessoes WHERE token = ? AND expira_em > ?'
    ).bind(token, new Date().toISOString()).first();
    if (!sessao) return null;
    const usuario = await env.DB.prepare(
      'SELECT id, nome, email, avatar, papel, status, criado_em FROM usuarios WHERE id = ?'
    ).bind(sessao.usuario_id).first();
    if (!usuario || usuario.status === 'bloqueado') return null;
    return usuario;
  } catch (e) {
    console.error('[auth] usuarioDaSessao erro:', e.message);
    return null;
  }
}

// ---------- RBAC ----------

function ehAdmin(u) { return u && u.papel === 'admin'; }
function ehModerador(u) { return u && (u.papel === 'moderador' || u.papel === 'admin'); }

// Restringe: chama callback se autenticado; senão 401.
async function exigirAuth(env, request, fn) {
  const usuario = await usuarioDaSessao(env, request);
  if (!usuario) return responder(401, { erro: 'Não autenticado. Entre na sua conta.' });
  return fn(usuario);
}

// Restringe: exige admin.
async function exigirAdmin(env, request, fn) {
  const usuario = await usuarioDaSessao(env, request);
  if (!usuario) return responder(401, { erro: 'Não autenticado.' });
  if (!ehAdmin(usuario)) return responder(403, { erro: 'Acesso restrito a administradores.' });
  return fn(usuario);
}

// Restringe: admin ou moderador.
async function exigirModerador(env, request, fn) {
  const usuario = await usuarioDaSessao(env, request);
  if (!usuario) return responder(401, { erro: 'Não autenticado.' });
  if (!ehModerador(usuario)) return responder(403, { erro: 'Acesso restrito.' });
  return fn(usuario);
}

// Perfil público de um usuário.
function perfilPublico(u) {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email || null,
    avatar: u.avatar || '🧑‍🚀',
    papel: u.papel,
    criadoEm: u.criado_em
  };
}

export {
  CHAVE_COOKIE,
  DURACAO_SESSAO_DIAS,
  gerarHashSenha,
  verificarSenha,
  gerarToken,
  lerCookie,
  cookieDeSessao,
  cookieExpirado,
  criarSessao,
  revogarSessao,
  usuarioDaSessao,
  exigirAuth,
  exigirAdmin,
  exigirModerador,
  ehAdmin,
  ehModerador,
  perfilPublico
};

export default { CHAVE_COOKIE, DURACAO_SESSAO_DIAS };