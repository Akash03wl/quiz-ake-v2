/* ============================================================
   TEST HELPERS - Mock de D1 baseado em node:sqlite
   Permite rodar as migrations reais e testar o backend com
   semântica SQL fiel (sem emular por regex).
   ============================================================ */
'use strict';
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const DIR_MIGRACOES = path.join(__dirname, '..', '..', 'migrations');

class Preparada {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.parametros = [];
  }
  bind(...args) {
    this.parametros = args;
    return this;
  }
  // first() -> objeto; first('col') -> valor
  first(col) {
    const linha = this.db.prepare(this.sql).get(...this.parametros);
    if (col === undefined) return linha === undefined ? null : linha;
    if (linha === undefined) return null;
    return linha[col] ?? null;
  }
  all() {
    return { results: this.db.prepare(this.sql).all(...this.parametros) || [] };
  }
  run() {
    const r = this.db.prepare(this.sql).run(...this.parametros);
    return { meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
  }
  raw() {
    return this.db.prepare(this.sql).raw(...this.parametros) || [];
  }
}

function criarDb(sqlite) {
  const dbSqlite = sqlite || new DatabaseSync(':memory:');
  return {
    // mantém acesso bruto p/ asserts internos
    __sqlite: dbSqlite,
    prepare(sql) { return new Preparada(dbSqlite, sql); },
    exec(sql) { dbSqlite.exec(sql); return { success: true }; },
    batch(lista) {
      return lista.map(function (s) {
        return s.run ? s.run() : { meta: { changes: 0 } };
      });
    }
  };
}

// Divide um SQL em statements, ignorando comentários de linha (--) e
// respeitando literais entre aspas simples/double.
function dividirStatements(sql) {
  const stmts = [];
  let atual = '';
  let entre = null;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    const prox = sql[i + 1];
    if (entre === "'" || entre === '"') {
      atual += c;
      if (c === entre && sql[i - 1] !== '\\') entre = null;
      continue;
    }
    if (c === '-' && prox === '-') {
      while (i < sql.length && sql[i] !== '\n') i++;
      continue;
    }
    if (c === "'" || c === '"') { entre = c; atual += c; continue; }
    if (c === ';') {
      if (atual.trim()) stmts.push(atual.trim());
      atual = '';
      continue;
    }
    atual += c;
  }
  if (atual.trim()) stmts.push(atual.trim());
  return stmts;
}

function aplicarMigrations(db) {
  const arquivos = fs.readdirSync(DIR_MIGRACOES).filter(f => f.endsWith('.sql')).sort();
  for (const f of arquivos) {
    const stmts = dividirStatements(fs.readFileSync(path.join(DIR_MIGRACOES, f), 'utf8'));
    for (const s of stmts) db.exec(s);
  }
  return db;
}

module.exports = { criarDb, aplicarMigrations, dividirStatements, Preparada, DIR_MIGRACOES };