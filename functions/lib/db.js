/* ============================================================
   NIVORA BACKEND - lib/db.js
   Helpers de acesso ao banco D1. Sempre usa prepared statements
   com parâmetros (nunca concatena SQL).
   ============================================================ */

// Executa um SELECT e devolve a primeira linha (ou null).
export async function primeira(env, sql, ...params) {
  try {
    return await env.DB.prepare(sql).bind(...params).first();
  } catch (e) {
    console.error('[db] primeira falhou:', e.message, sql);
    throw e;
  }
}

// Executa um SELECT e devolve todas as linhas (array).
export async function todas(env, sql, ...params) {
  try {
    const r = await env.DB.prepare(sql).bind(...params).all();
    return r.results || [];
  } catch (e) {
    console.error('[db] todas falhou:', e.message, sql);
    throw e;
  }
}

// Executa INSERT/UPDATE/DELETE.
export async function executar(env, sql, ...params) {
  try {
    return await env.DB.prepare(sql).bind(...params).run();
  } catch (e) {
    console.error('[db] executar falhou:', e.message, sql);
    throw e;
  }
}

// Executa um batch (vários statements) dentro de uma transação lógica.
export async function batch(env, stmts) {
  try {
    return await env.DB.batch(stmts.map(function (s) {
      return env.DB.prepare(s.sql).bind(...s.params);
    }));
  } catch (e) {
    console.error('[db] batch falhou:', e.message);
    throw e;
  }
}

// Retorna um id aleatório legível.
export function novoId(pre) {
  const n = Math.floor(Math.random() * 1e9).toString(36);
  const suf = Date.now().toString(36);
  return (pre || '') + n + suf;
}

// Converte "YYYY-MM-DD" em ISO para ordenação lexicográfica.
export function dataISO() {
  return new Date().toISOString();
}

export default { primeira, todas, executar, batch, novoId, dataISO };