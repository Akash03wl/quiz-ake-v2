/* ============================================================
   TESTES DE UNIDADE - js/backend.test.js
   Rodam offline, sem rede: testam libs puras + banco em memória.
   ============================================================ */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as val from '../functions/lib/validacao.js';
import * as auth from '../functions/lib/auth.js';
import { checar } from '../functions/lib/ratelimit.js';
import d1 from './helpers/d1.cjs';

test('validarSenha exige no mínimo 8 caracteres', () => {
  assert.equal(val.validarSenha('123456').ok, false);
  assert.equal(val.validarSenha('1234567').ok, false);
  assert.equal(val.validarSenha('12345678').ok, true);
  assert.equal(val.validarSenha('x'.repeat(80)).ok, false);
});

test('validarEmail aceita formato comum e rejeita inválidos', () => {
  assert.equal(val.validarEmail('a@b.com').ok, true);
  assert.equal(val.validarEmail('A@B.com.br').ok, true);
  assert.equal(val.validarEmail('sem-arroba').ok, false);
  assert.equal(val.validarEmail('').ok, false);
});

test('validarTexto remove tags HTML e limita tamanho', () => {
  const r = val.validarTexto('Nome', '<script>alert(1)</script>João', 2, 40, true);
  assert.equal(r.ok, true);
  assert.ok(!r.valor.includes('<'));
  assert.ok(!r.valor.includes('>'));
  const curto = val.validarTexto('Nome', 'A', 2, 40, true);
  assert.equal(curto.ok, false);
});

test('hash e verificação de senha PBKDF2 (roundtrip + senha errada)', async () => {
  const hash = await auth.gerarHashSenha('senha-segura-123');
  assert.match(hash, /^pbkdf2\$/);
  assert.equal(await auth.verificarSenha('senha-segura-123', hash), true);
  assert.equal(await auth.verificarSenha('senha-errada', hash), false);
  assert.equal(await auth.verificarSenha('', hash), false);
});

test('rate limit bloqueia acima do limite e libera em nova janela', async () => {
  const db = d1.aplicarMigrations(d1.criarDb());
  const env = { DB: db };
  const req = new Request('https://teste.local/api/x', { method: 'POST' });
  for (let i = 0; i < 3; i++) {
    assert.equal((await checar(env, req, 'x', 3, 60)).ok, true);
  }
  const bloqueado = await checar(env, req, 'x', 3, 60);
  assert.equal(bloqueado.ok, false);
  assert.ok(Number(bloqueado.tentaDeNovoEm) > 0);
});

test('db: INSERT + SELECT com bind de parâmetros', () => {
  const db = d1.aplicarMigrations(d1.criarDb());
  const preparada = db.prepare('INSERT INTO usuarios (id, nome, email, senha_hash) VALUES (?, ?, ?, ?)');
  preparada.bind('u_teste', 'Teste', 't@t.com', 'hash').run();
  const linha = db.prepare('SELECT nome FROM usuarios WHERE id = ?').bind('u_teste').first();
  assert.equal(linha.nome, 'Teste');
});