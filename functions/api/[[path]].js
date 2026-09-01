/* ============================================================
   QUIZ AKE BACKEND - functions/api/[[path]].js
   Router principal da API (Pages Functions catch-all em /api/*).
   Estratégia: um único ponto de entrada que despacha para os
   controllers por método + caminho. Retorna sempre JSON.
   ============================================================ */

import { json, ok, criado, erro, naoEncontrado, metodoNaoPermitido } from '../lib/respostas.js';
import * as db from '../lib/db.js';
import * as val from '../lib/validacao.js';
import * as auth from '../lib/auth.js';
import { checar } from '../lib/ratelimit.js';
import { gerarRascunho } from '../lib/ai.js';

const T_SEC = 1000;

// ---------- HELPERS ----------

async function lerCorpo(request) {
  try {
    return await request.json();
  } catch (e) {
    return null;
  }
}

function partesDaUrl(url) {
  return url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
}

// ---------- AUTH ----------

// POST /api/auth/registrar
async function registrar(env, request) {
  const limite = await checar(env, request, 'registrar', 5, 60);
  if (!limite.ok) return erro(429, 'Muitas contas criadas em pouco tempo. Aguarde um instante.', {
    tentaDeNovoEm: limite.tentaDeNovoEm
  });
  const corpo = (await lerCorpo(request)) || {};
  const nome = val.validarTexto('Nome', corpo.nome, 2, val.TAM_MAX.nome, true);
  if (!nome.ok) return erro(400, nome.erro);
  const email = val.validarEmail(corpo.email);
  if (!email.ok) return erro(400, email.erro);
  const senha = val.validarSenha(corpo.senha);
  if (!senha.ok) return erro(400, senha.erro);

  const existente = await db.primeira(env, 'SELECT id FROM usuarios WHERE email = ?', email.valor);
  if (existente) return erro(409, 'Já existe uma conta com este e-mail.');

  const id = 'u_' + db.novoId('');
  const hash = await auth.gerarHashSenha(senha.valor);
  await db.executar(env,
    'INSERT INTO usuarios (id, nome, email, senha_hash) VALUES (?, ?, ?, ?)',
    id, nome.valor, email.valor, hash);

  // Perfil inicial vazio
  await db.executar(env,
    'INSERT INTO perfis (usuario_id) VALUES (?)', id);

  const token = await auth.criarSessao(env, id);
  const usuario = await db.primeira(env, 'SELECT id, nome, email, avatar, papel FROM usuarios WHERE id = ?', id);
  return criado({
    usuario: auth.perfilPublico(usuario),
    sessao: token
  }, { 'Set-Cookie': auth.cookieDeSessao(token, env, request) });
}

// POST /api/auth/login
async function login(env, request) {
  const limite = await checar(env, request, 'login', 10, 60);
  if (!limite.ok) return erro(429, 'Muitas tentativas. Aguarde um instante.', {
    tentaDeNovoEm: limite.tentaDeNovoEm
  });
  const corpo = (await lerCorpo(request)) || {};
  const email = val.validarEmail(corpo.email);
  if (!email.ok) return erro(400, email.erro);

  const usuario = await db.primeira(env,
    'SELECT id, nome, email, senha_hash, avatar, papel, status FROM usuarios WHERE email = ?',
    email.valor);
  if (!usuario) return erro(401, 'E-mail ou senha incorretos.');
  if (usuario.status === 'bloqueado') return erro(403, 'Conta bloqueada. Fale com um administrador.');

  const okSenha = await auth.verificarSenha(corpo.senha || '', usuario.senha_hash);
  if (!okSenha) return erro(401, 'E-mail ou senha incorretos.');

  await db.executar(env, 'UPDATE usuarios SET ultimo_acesso = ? WHERE id = ?', new Date().toISOString(), usuario.id);
  const token = await auth.criarSessao(env, usuario.id);
  return ok({
    usuario: auth.perfilPublico(usuario),
    sessao: token
  }, { 'Set-Cookie': auth.cookieDeSessao(token, env, request) });
}

// POST /api/auth/logout
async function logout(env, request) {
  const token = auth.lerCookie(request, auth.CHAVE_COOKIE);
  await auth.revogarSessao(env, token);
  return ok({ ok: true }, { 'Set-Cookie': auth.cookieExpirado() });
}

// POST /api/auth/recuperar — gera token de recuperação (link devolvido
// apenas em desenvolvimento; em produção o fluxo real é substituído aqui).
async function recuperarSenha(env, request) {
  const limite = await checar(env, request, 'recuperar', 5, 60);
  if (!limite.ok) return erro(429, 'Muitos pedidos de recuperação. Aguarde um instante.', {
    tentaDeNovoEm: limite.tentaDeNovoEm
  });
  const corpo = (await lerCorpo(request)) || {};
  const email = val.validarEmail(corpo.email);
  if (!email.ok) return erro(400, email.erro);
  const usuario = await db.primeira(env, 'SELECT id FROM usuarios WHERE email = ?', email.valor);
  if (!usuario) return ok({ ok: true, mensagem: 'Se o e-mail existir, você receberá um link.' });

  const token = auth.gerarToken(32);
  const validoAte = new Date(Date.now() + 30 * 60 * T_SEC).toISOString();
  await db.executar(env,
    'INSERT INTO recuperacoes (token, usuario_id, criado_em, expira_em) VALUES (?, ?, ?, ?)',
    token, usuario.id, new Date().toISOString(), validoAte);

  // Sem SMTP configurado no Pages: o token só é exposto em dev LOCAL (http://),
  // nunca em HTTPS (produção ou preview), mesmo que ENVIRONMENT caia para "development".
  const dev = !env || env.ENVIRONMENT !== 'production';
  const ehHttp = new URL(request.url).protocol === 'http:';
  return ok({
    ok: true,
    mensagem: 'Se o e-mail existir, você receberá um link.',
    ...(dev && ehHttp ? { tokenTeste: token } : {})
  });
}

// POST /api/auth/recuperar/confirmar — redefine a senha com o token.
async function confirmarRecuperacao(env, request) {
  const corpo = (await lerCorpo(request)) || {};
  const token = String(corpo.token || '').trim();
  const novaSenha = val.validarSenha(corpo.senha);
  if (!token) return erro(400, 'Token inválido.');
  if (!novaSenha.ok) return erro(400, novaSenha.erro);

  const rec = await db.primeira(env,
    'SELECT usuario_id, usado FROM recuperacoes WHERE token = ? AND expira_em > ?',
    token, new Date().toISOString());
  if (!rec || rec.usado) return erro(400, 'Token expirado ou já usado.');

  const hash = await auth.gerarHashSenha(novaSenha.valor);
  await db.executar(env, 'UPDATE usuarios SET senha_hash = ? WHERE id = ?', hash, rec.usuario_id);
  await db.executar(env, 'UPDATE recuperacoes SET usado = 1 WHERE token = ?', token);
  await db.executar(env, 'DELETE FROM sessoes WHERE usuario_id = ?', rec.usuario_id);
  return ok({ ok: true, mensagem: 'Senha redefinida. Faça login.' });
}

// GET /api/auth/estado
async function estadoSessao(env, request) {
  const usuario = await auth.usuarioDaSessao(env, request);
  return json(usuario ? { usuario: auth.perfilPublico(usuario) } : { usuario: null });
}

// GET /api/me
async function meuPerfil(env, request) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const perfil = await db.primeira(env, 'SELECT * FROM perfis WHERE usuario_id = ?', usuario.id);
    const partidas = await db.todas(env,
      'SELECT * FROM resultados WHERE usuario_id = ? ORDER BY criado_em DESC, ponto_nulo DESC LIMIT 200', usuario.id);
    return ok({
      usuario: auth.perfilPublico(usuario),
      perfil: perfil ? {
        xp: perfil.xp, nivel: perfil.nivel, recorde: perfil.recorde,
        stats: JSON.parse(perfil.stats || '{}'),
        conquistas: JSON.parse(perfil.conquistas || '[]'),
        favoritos: JSON.parse(perfil.favoritos || '[]'),
        streak: JSON.parse(perfil.streak || '{"dias":[]}'),
        desafio: JSON.parse(perfil.desafio || '{}')
      } : null,
      partidas: partidas
    });
  });
}

// PATCH /api/me — atualizar nome/avatar
async function atualizarMe(env, request) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const corpo = (await lerCorpo(request)) || {};
    const atualizacoes = [];
    const params = [];
    if (corpo.nome !== undefined) {
      const nome = val.validarTexto('Nome', corpo.nome, 2, val.TAM_MAX.nome, true);
      if (!nome.ok) return erro(400, nome.erro);
      atualizacoes.push('nome = ?');
      params.push(nome.valor);
    }
    if (corpo.avatar !== undefined) {
      const avatar = val.limparTexto(corpo.avatar, 8) || '🧑‍🚀';
      atualizacoes.push('avatar = ?');
      params.push(avatar);
    }
    if (!atualizacoes.length) return erro(400, 'Nada para atualizar.');
    params.push(usuario.id);
    await db.executar(env, 'UPDATE usuarios SET ' + atualizacoes.join(', ') + ', ultimo_acesso = ? WHERE id = ?', ...params);
    const novo = await db.primeira(env, 'SELECT id, nome, email, avatar, papel FROM usuarios WHERE id = ?', usuario.id);
    return ok({ usuario: auth.perfilPublico(novo) });
  });
}

// ---------- MIGRAÇÃO / PROGRESSO (sync canônico) ----------

// calcularNivel espelhando o frontend (script.js)
const LIMIARES = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 4900, 5900, 7100, 8500, 10000];
function limiarDe(numero) {
  if (numero <= LIMIARES.length) return LIMIARES[numero - 1];
  return LIMIARES[LIMIARES.length - 1] + (numero - LIMIARES.length) * 600;
}
function nivelDeXp(xp) {
  let nivel = 1;
  while (xp >= limiarDe(nivel + 1)) nivel++;
  return nivel;
}

// POST /api/migrate — recebe o estado completo local e devolve o canônico.
async function migrar(env, request) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const corpo = (await lerCorpo(request)) || {};
    const perfil = val.sanearPerfil(corpo.perfil);
    const partidas = Array.isArray(corpo.partidas) ? corpo.partidas : [];

    // ---- merge de partidas (evita duplicar por ts+modo+pontos) ----
    let existentes = await db.todas(env,
      'SELECT ts, modo, pontos FROM resultados WHERE usuario_id = ?', usuario.id);
    const chavesExistentes = new Set(existentes.map(function (p) { return p.ts + '|' + p.modo + '|' + p.pontos; }));
    const novas = partidas.filter(function (p) {
      if (!p || typeof p !== 'object') return false;
      const chave = (p.ts || '') + '|' + (p.modo || '') + '|' + (p.pontos || 0);
      if (chavesExistentes.has(chave)) return false;
      chavesExistentes.add(chave);
      return true;
    });
    for (const p of novas) {
      await db.executar(env,
        'INSERT INTO resultados (id, usuario_id, quiz_id, quiz_titulo, modo, pontos, acertos, erros, tempo_medio, combo, percentual, xp_ganho, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        db.novoId('r_'), usuario.id, p.quiz || 'local', p.titulo || 'Quiz', p.modo || 'normal',
        Number(p.pontos) || 0, Number(p.acertos) || 0, Number(p.erros) || 0,
        Number(p.tempoMedio) || Number(p.tempo_medio) || 0, Number(p.maiorCombo) || Number(p.combo) || 0,
        Number(p.percentual) || Number(p.taxa) || 0, Number(p.xp) || 0,
        p.dataISO ? p.dataISO + ' 12:00:00' : new Date().toISOString());
    }

    // ---- merge do perfil (vale o maior/máximo) ----
    const atual = await db.primeira(env, 'SELECT * FROM perfis WHERE usuario_id = ?', usuario.id);
    const statsAntes = atual ? (JSON.parse(atual.stats || '{}')) : {};
    const statsDepois = fundirStats(statsAntes, perfil.stats);
    const xp = Math.max(atual ? atual.xp : 0, perfil.xp);
    const recorde = Math.max(atual ? atual.recorde : 0, perfil.recorde);
    const conquistas = unirListas(atual ? JSON.parse(atual.conquistas || '[]') : [], perfil.conquistas);
    const favoritos = unirListas(atual ? JSON.parse(atual.favoritos || '[]') : [], perfil.favoritos);
    const streak = fundirStreak(atual ? JSON.parse(atual.streak || '{"dias":[]}') : null, perfil.streak);
    const desafio = perfil.desafio || null;

    await db.executar(env,
      `INSERT INTO perfis (usuario_id, xp, nivel, recorde, stats, conquistas, favoritos, streak, desafio, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(usuario_id) DO UPDATE SET
         xp = excluded.xp, nivel = excluded.nivel, recorde = excluded.recorde,
         stats = excluded.stats, conquistas = excluded.conquistas,
         favoritos = excluded.favoritos, streak = excluded.streak,
         desafio = excluded.desafio, atualizado_em = excluded.atualizado_em`,
      usuario.id, xp, nivelDeXp(xp), recorde,
      JSON.stringify(statsDepois), JSON.stringify(conquistas),
      JSON.stringify(favoritos), JSON.stringify(streak), JSON.stringify(desafio || {}),
      new Date().toISOString());

    // ---- conquistas com progresso no catálogo ----
    await sincronizarConquistas(env, usuario.id, conquistas);

    // ---- resposta canônica ----
    const partidasFinais = await db.todas(env,
      'SELECT ts, quiz_id AS quiz, quiz_titulo AS titulo, modo, pontos, acertos, erros, tempo_medio AS tempoMedio, combo AS maiorCombo, percentual, xp_ganho AS xp, criado_em AS dataISO FROM resultados WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 120',
      usuario.id);

    return ok({
      ok: true,
      perfil: {
        xp: xp, nivel: nivelDeXp(xp), recorde: recorde,
        stats: statsDepois, conquistas: conquistas, favoritos: favoritos,
        streak: streak, desafio: desafio || {}
      },
      partidas: partidasFinais
    });
  });
}

// GET /api/me/progresso
async function meuProgresso(env, request) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const perfil = await db.primeira(env, 'SELECT * FROM perfis WHERE usuario_id = ?', usuario.id);
    if (!perfil) return ok({ perfil: null, partidas: [] });
    const partidas = await db.todas(env,
      'SELECT ts, quiz_id AS quiz, quiz_titulo AS titulo, modo, pontos, acertos, erros, combo AS maiorCombo, percentual, xp_ganho AS xp, criado_em AS dataISO FROM resultados WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 120',
      usuario.id);
    return ok({
      perfil: {
        xp: perfil.xp, nivel: perfil.nivel, recorde: perfil.recorde,
        stats: JSON.parse(perfil.stats || '{}'),
        conquistas: JSON.parse(perfil.conquistas || '[]'),
        favoritos: JSON.parse(perfil.favoritos || '[]'),
        streak: JSON.parse(perfil.streak || '{"dias":[]}'),
        desafio: JSON.parse(perfil.desafio || '{}')
      },
      partidas: partidas
    });
  });
}

function fundirStats(antes, novo) {
  const out = { ...antes };
  Object.keys(novo || {}).forEach(function (k) {
    const n = Number(novo[k]);
    if (Number.isFinite(n)) out[k] = Number.isFinite(Number(antes[k])) ? Math.max(Number(antes[k]) || 0, n) : n;
  });
  return out;
}
function unirListas(a, b) {
  const set = new Set(a.concat(b || []));
  return Array.from(set);
}
function fundirStreak(antes, novo) {
  const dias = new Set((antes && antes.dias) || []);
  if (novo && Array.isArray(novo.dias)) novo.dias.forEach(function (d) { dias.add(d); });
  const lista = Array.from(dias);
  const maior = Math.max(
    (antes && antes.maior) || 0,
    (novo && novo.maior) || 0,
    streakAtual(lista)
  );
  return { dias: lista.slice(-120), maior: maior };
}
function streakAtual(dias) {
  const hoje = isoHoje();
  let count = 0;
  let cursor = hoje;
  const set = new Set(dias);
  while (set.has(cursor)) {
    count++;
    cursor = dataComOffset(new Date(), -count);
  }
  return count;
}
function isoHoje() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function dataComOffset(dataBase, offset) {
  const d = new Date(dataBase);
  d.setDate(d.getDate() + offset);
  return isoDe(d);
}
function isoDe(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// ---------- CONQUISTAS (progresso espelhado no servidor) ----------
async function sincronizarConquistas(env, usuarioId, conquistasIds) {
  const set = new Set(conquistasIds);
  await db.executar(env, 'DELETE FROM conquistas_usuario WHERE usuario_id = ?', usuarioId);
  for (const id of set) {
    await db.executar(env,
      'INSERT OR IGNORE INTO conquistas_usuario (usuario_id, conquista_id, progresso, desbloqueada) VALUES (?, ?, ?, 1)',
      usuarioId, id, 100);
  }
}

// ---------- QUIZZES ----------

// GET /api/quizzes — lista de metadados (oficiais + criados)
async function listarQuizzes(env, request) {
  const url = new URL(request.url);
  const soAtivos = url.searchParams.get('todos') !== '1';
  const apenasCriados = url.searchParams.get('criados') === '1';
  const categoria = url.searchParams.get('categoria');

  let sql = 'SELECT id, titulo, descricao, categoria, dificuldade, emoji, cor, autor, tags, quantidade, duracao, status, destaque, origem FROM quizzes WHERE 1=1';
  const params = [];
  if (soAtivos) { sql += ' AND status = ?'; params.push('ativo'); }
  if (apenasCriados) { sql += ' AND origem != ?'; params.push('oficial'); }
  if (categoria) { sql += ' AND categoria = ?'; params.push(categoria); }
  sql += ' ORDER BY destaque DESC, titulo ASC';

  const linhas = await db.todas(env, sql, ...params);
  const lista = linhas.map(function (q) {
    return {
      id: q.id, titulo: q.titulo, descricao: q.descricao, categoria: q.categoria,
      dificuldade: q.dificuldade, emoji: q.emoji, cor: q.cor, autor: q.autor,
      tags: JSON.parse(q.tags || '[]'), quantidade: q.quantidade, duracao: q.duracao,
      destaque: q.destaque, origem: q.origem, status: q.status
    };
  });
  return ok({ quizzes: lista, total: lista.length });
}

// GET /api/quizzes/:id
async function detalheQuiz(env, request, params) {
  const id = val.validarId(params[0]);
  if (!id.ok) return erro(400, id.erro);
  const quiz = await db.primeira(env, 'SELECT * FROM quizzes WHERE id = ?', id.valor);
  if (!quiz) return naoEncontrado('Quiz não encontrado.');
  const perguntas = await db.todas(env,
    'SELECT id, pergunta, alternativas, correta, explicacao, dificuldade, tipo FROM perguntas WHERE quiz_id = ? ORDER BY ordem ASC',
    id.valor);
  return ok({
    quiz: {
      id: quiz.id, titulo: quiz.titulo, descricao: quiz.descricao, categoria: quiz.categoria,
      dificuldade: quiz.dificuldade, emoji: quiz.emoji, cor: quiz.cor, autor: quiz.autor,
      tags: JSON.parse(quiz.tags || '[]'), quantidade: quiz.quantidade, duracao: quiz.duracao,
      origem: quiz.origem, status: quiz.status, destaque: quiz.destaque
    },
    perguntas: perguntas.map(function (p) {
      return {
        id: p.id, pergunta: p.pergunta, tipo: p.tipo || 'multipla',
        alternativas: JSON.parse(p.alternativas || '[]'), correta: p.correta,
        explicacao: p.explicacao, dificuldade: p.dificuldade
      };
    }),
    temPerguntas: perguntas.length > 0
  });
}

// POST /api/quizzes — criar quiz (origem: criado). Exige auth.
async function criarQuiz(env, request) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const corpo = (await lerCorpo(request)) || {};
    const validado = val.validarQuizQuizz(corpo);
    if (!validado.ok) return erro(400, validado.erro);
    const q = validado.valor;

    const id = 'quiz_' + db.novoId('');
    await db.executar(env,
      'INSERT INTO quizzes (id, titulo, descricao, categoria, dificuldade, emoji, cor, autor, autor_id, tags, quantidade, duracao, status, destaque, origem, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)',
      id, q.titulo, q.descricao, q.categoria, q.dificuldade, q.emoji, q.cor,
      usuario.nome, usuario.id, JSON.stringify(q.tags), q.perguntas.length,
      Math.max(60, q.perguntas.length * 12), 'rascunho', 'criado',
      new Date().toISOString(), new Date().toISOString());

    for (let i = 0; i < q.perguntas.length; i++) {
      const p = q.perguntas[i];
      await db.executar(env,
        'INSERT INTO perguntas (id, quiz_id, pergunta, alternativas, correta, explicacao, dificuldade, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        db.novoId('p_'), id, p.pergunta, JSON.stringify(p.alternativas), p.correta,
        p.explicacao, p.dificuldade, p.tipo, i);
    }

    return criado({ id: id, status: 'rascunho', titulo: q.titulo });
  });
}

// PATCH /api/quizzes/:id — editar (dono ou admin)
async function editarQuiz(env, request, params) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const id = val.validarId(params[0]);
    if (!id.ok) return erro(400, id.erro);
    const quiz = await db.primeira(env, 'SELECT * FROM quizzes WHERE id = ?', id.valor);
    if (!quiz) return naoEncontrado('Quiz não encontrado.');
    if (quiz.autor_id !== usuario.id && !auth.ehAdmin(usuario)) {
      return erro(403, 'Você não tem permissão para editar este quiz.');
    }

    const corpo = (await lerCorpo(request)) || {};
    const campos = [];
    const paramsQ = [];
    if (corpo.titulo !== undefined) {
      const titulo = val.validarTexto('Título', corpo.titulo, 3, val.TAM_MAX.titulo, true);
      if (!titulo.ok) return erro(400, titulo.erro);
      campos.push('titulo = ?'); paramsQ.push(titulo.valor);
    }
    if (corpo.descricao !== undefined) { campos.push('descricao = ?'); paramsQ.push(val.limparTexto(corpo.descricao, val.TAM_MAX.descricao)); }
    if (corpo.emoji !== undefined) { campos.push('emoji = ?'); paramsQ.push(val.limparTexto(corpo.emoji, 8)); }
    if (corpo.cor !== undefined) { campos.push('cor = ?'); paramsQ.push(val.limparTexto(corpo.cor, val.TAM_MAX.quizCor)); }
    if (corpo.dificuldade !== undefined) {
      const dif = val.validarDificuldade(corpo.dificuldade);
      if (!dif.ok) return erro(400, 'Dificuldade inválida.');
      campos.push('dificuldade = ?'); paramsQ.push(dif.valor);
    }
    if (corpo.tags !== undefined && Array.isArray(corpo.tags)) {
      campos.push('tags = ?'); paramsQ.push(JSON.stringify(corpo.tags.map(function (t) { return val.limparTexto(t, 20); }).filter(Boolean).slice(0, val.TAM_MAX.tags)));
    }
    if (corpo.status !== undefined && ['rascunho', 'ativo', 'inativo'].includes(corpo.status)) {
      campos.push('status = ?'); paramsQ.push(corpo.status);
    }
    if (corpo.perguntas !== undefined && Array.isArray(corpo.perguntas) && auth.ehAdmin(usuario)) {
      const perg = (await lerCorpo(request)).perguntas;
      const validP = val.validarQuizQuizz({ ...corpo, perguntas: perg });
      if (!validP.ok) return erro(400, validP.erro);
      await db.executar(env, 'DELETE FROM perguntas WHERE quiz_id = ?', id.valor);
      for (let i = 0; i < validP.valor.perguntas.length; i++) {
        const p = validP.valor.perguntas[i];
        await db.executar(env,
          'INSERT INTO perguntas (id, quiz_id, pergunta, alternativas, correta, explicacao, dificuldade, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          db.novoId('p_'), id.valor, p.pergunta, JSON.stringify(p.alternativas), p.correta, p.explicacao, p.dificuldade, p.tipo, i);
      }
      campos.push('quantidade = ?'); paramsQ.push(validP.valor.perguntas.length);
    }
    if (!campos.length) return erro(400, 'Nada para atualizar.');
    campos.push('atualizado_em = ?');
    paramsQ.push(new Date().toISOString());
    paramsQ.push(id.valor);
    await db.executar(env, 'UPDATE quizzes SET ' + campos.join(', ') + ' WHERE id = ?', ...paramsQ);
    return ok({ ok: true });
  });
}

// DELETE /api/quizzes/:id — remover (dono ou admin)
async function removerQuiz(env, request, params) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const id = val.validarId(params[0]);
    if (!id.ok) return erro(400, id.erro);
    const quiz = await db.primeira(env, 'SELECT id, autor_id, origem FROM quizzes WHERE id = ?', id.valor);
    if (!quiz) return naoEncontrado('Quiz não encontrado.');
    if (quiz.origem === 'oficial') return erro(403, 'Quizzes oficiais não podem ser removidos.');
    if (quiz.autor_id !== usuario.id && !auth.ehAdmin(usuario)) {
      return erro(403, 'Você não tem permissão para remover este quiz.');
    }
    await db.executar(env, 'DELETE FROM quizzes WHERE id = ?', id.valor);
    return ok({ ok: true });
  });
}

// ---------- ADMIN ----------

// GET /api/admin/dashboard — estatísticas globais
async function adminDashboard(env) {
  const totalUsuarios = (await db.primeira(env, 'SELECT COUNT(*) AS c FROM usuarios'))?.c || 0;
  const totalPartidas = (await db.primeira(env, 'SELECT COUNT(*) AS c FROM resultados'))?.c || 0;
  const totalQuizzes = (await db.primeira(env, 'SELECT COUNT(*) AS c FROM quizzes'))?.c || 0;
  const criados = (await db.primeira(env, 'SELECT COUNT(*) AS c FROM quizzes WHERE origem != "oficial"'))?.c || 0;
  const usuariosHoje = (await db.primeira(env, 'SELECT COUNT(*) AS c FROM usuarios WHERE criado_em > ?', new Date(Date.now() - 24 * 3600 * T_SEC).toISOString()))?.c || 0;
  const taxaMedia = (await db.primeira(env, 'SELECT AVG(percentual) AS m FROM resultados'))?.m || 0;
  // Quizzes mais jogados (por quantidade de resultados)
  const maisJogados = await db.todas(env,
    'SELECT quiz_id AS id, quiz_titulo AS titulo, COUNT(*) AS vezes FROM resultados GROUP BY quiz_id, quiz_titulo ORDER BY vezes DESC LIMIT 5');
  // Categorias populares
  const categorias = await db.todas(env,
    'SELECT quiz_id, COUNT(*) AS vezes FROM resultados GROUP BY quiz_id ORDER BY vezes DESC LIMIT 10');
  // Crescimento de usuários nos últimos 14 dias
  const crescimento = [];
  for (let i = 13; i >= 0; i--) {
    const dia = isoDe(new Date(Date.now() - i * 86400 * T_SEC));
    const c = (await db.primeira(env,
      'SELECT COUNT(*) AS c FROM usuarios WHERE substr(criado_em, 1, 10) = ?', dia))?.c || 0;
    crescimento.push({ dia: dia, usuarios: c });
  }
  return ok({
    totalUsuarios, totalPartidas, totalQuizzes, criados, usuariosHoje,
    taxaMedia: Math.round(Number(taxaMedia) || 0),
    maisJogados, categorias, crescimento
  });
}

// GET /api/admin/usuarios
async function adminUsuarios(env, request) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const limite = Math.min(100, Number(url.searchParams.get('limite')) || 50);
  let linhas;
  if (q) {
    linhas = await db.todas(env,
      'SELECT id, nome, email, avatar, papel, status, criado_em, ultimo_acesso FROM usuarios WHERE nome LIKE ? OR email LIKE ? ORDER BY criado_em DESC LIMIT ?',
      '%' + q + '%', '%' + q + '%', limite);
  } else {
    linhas = await db.todas(env,
      'SELECT id, nome, email, avatar, papel, status, criado_em, ultimo_acesso FROM usuarios ORDER BY criado_em DESC LIMIT ?',
      limite);
  }
  return ok({ usuarios: linhas });
}

// PATCH /api/admin/usuarios/:id — papel/status
async function adminEditarUsuario(env, request, params) {
  const id = params[0];
  if (!id) return erro(400, 'Usuário inválido.');
  const corpo = (await lerCorpo(request)) || {};
  const usuario = await db.primeira(env, 'SELECT id, papel FROM usuarios WHERE id = ?', id);
  if (!usuario) return naoEncontrado('Usuário não encontrado.');

  const campos = [];
  const parametros = [];
  if (corpo.papel !== undefined) {
    if (!['usuario', 'moderador', 'admin'].includes(corpo.papel)) return erro(400, 'Papel inválido.');
    campos.push('papel = ?'); parametros.push(corpo.papel);
  }
  if (corpo.status !== undefined) {
    if (!['ativo', 'bloqueado'].includes(corpo.status)) return erro(400, 'Status inválido.');
    campos.push('status = ?'); parametros.push(corpo.status);
  }
  if (corpo.nome !== undefined) {
    const nome = val.validarTexto('Nome', corpo.nome, 2, val.TAM_MAX.nome, true);
    if (!nome.ok) return erro(400, nome.erro);
    campos.push('nome = ?'); parametros.push(nome.valor);
  }
  if (!campos.length) return erro(400, 'Nada para atualizar.');
  parametros.push(id);
  await db.executar(env, 'UPDATE usuarios SET ' + campos.join(', ') + ' WHERE id = ?', ...parametros);
  return ok({ ok: true });
}

// GET /api/admin/ranking-resumo — usada no dashboard (lista top usuários por XP)
async function adminRanking(env) {
  const linhas = await db.todas(env,
    'SELECT u.id, u.nome, u.avatar, p.xp FROM usuarios u LEFT JOIN perfis p ON p.usuario_id = u.id ORDER BY p.xp DESC, u.nome ASC LIMIT 10');
  return ok({ ranking: linhas });
}

// ---------- IA ----------

// POST /api/ia/gerar — gera rascunho de quiz (não salva).
async function gerarQuizComIA(env, request) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const limite = await checar(env, request, 'ia', 5, 60);
    if (!limite.ok) return erro(429, 'Muitas gerações em pouco tempo. Aguarde um instante.', {
      tentaDeNovoEm: limite.tentaDeNovoEm
    });

    const corpo = (await lerCorpo(request)) || {};
    const tema = String(corpo.tema || '').trim().slice(0, 60);
    const categoria = String(corpo.categoria || 'geral').trim();
    const dificuldade = String(corpo.dificuldade || 'medio').trim();
    const quantidade = corpo.quantidade || 5;

    const resultado = await gerarRascunho(env, { tema, categoria, dificuldade, quantidade });
    return ok({
      ok: true,
      rascunho: resultado.rascunho,
      provedor: resultado.provedor,
      aviso: resultado.provedor.startsWith('local')
        ? 'Sem créditos de IA no momento, usamos um banco garantido. Revise antes de salvar.'
        : 'Revise as perguntas antes de salvar.'
    });
  });
}

// POST /api/ia/gerar/salvar — salva um rascunho revisado (com ou sem override).
async function salvarRascunhoIA(env, request) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const corpo = (await lerCorpo(request)) || {};
    const rascunho = corpo.quiz || corpo.rascunho;
    if (!rascunho) return erro(400, 'Envie o quiz revisado.');
    const validado = val.validarQuizQuizz(rascunho);
    if (!validado.ok) return erro(400, validado.erro);
    const q = validado.valor;

    const id = 'quiz_' + db.novoId('');
    await db.executar(env,
      'INSERT INTO quizzes (id, titulo, descricao, categoria, dificuldade, emoji, cor, autor, autor_id, tags, quantidade, duracao, status, destaque, origem, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)',
      id, q.titulo, q.descricao, q.categoria, q.dificuldade, q.emoji || '🤖', q.cor || '#7c6cf0',
      usuario.nome, usuario.id, JSON.stringify(q.tags && q.tags.length ? q.tags : ['IA', q.categoria]),
      q.perguntas.length, Math.max(60, q.perguntas.length * 12), 'rascunho', 'ia',
      new Date().toISOString(), new Date().toISOString());

    for (let i = 0; i < q.perguntas.length; i++) {
      const p = q.perguntas[i];
      await db.executar(env,
        'INSERT INTO perguntas (id, quiz_id, pergunta, alternativas, correta, explicacao, dificuldade, tipo, ordem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        db.novoId('p_'), id, p.pergunta, JSON.stringify(p.alternativas), p.correta, p.explicacao, p.dificuldade, 'multipla', i);
    }
    return criado({ id: id, status: 'rascunho', titulo: q.titulo });
  });
}

// ---------- DESAFIO DO DIA (competitivo global) ----------

const DESAFIO_PERGUNTAS = 6;

// Mesmo algoritmo de semente que o frontend usa (js/script.js -> sementeDia).
function sementeDiaDesafio(texto) {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h;
}

// GET /api/desafio — seed, perguntas e ranking global de hoje (público).
async function desafioDia(env, request) {
  // Usa UTC para coincidir com criado_em armazenado via toISOString() (evita divergência BRT vs UTC).
  const hoje = new Date().toISOString().slice(0, 10);
  const top = await db.todas(env,
    `SELECT u.id, u.nome, u.avatar, MAX(r.pontos) AS pontos
     FROM resultados r JOIN usuarios u ON u.id = r.usuario_id
     WHERE r.modo = 'desafio' AND substr(r.criado_em, 1, 10) = ?  AND r.pontos > 0
     GROUP BY u.id ORDER BY pontos DESC, u.nome ASC LIMIT 10`,
    hoje);
  const resumo = await db.primeira(env,
    `SELECT COUNT(DISTINCT usuario_id) AS jogadores, ROUND(AVG(best)) AS media
     FROM (SELECT usuario_id, MAX(pontos) AS best FROM resultados
           WHERE modo = 'desafio' AND substr(criado_em, 1, 10) = ? GROUP BY usuario_id)`,
    hoje);

  let minha = null;
  const usuario = await auth.usuarioDaSessao(env, request);
  if (usuario) {
    const total = Number(resumo && resumo.jogadores) || 0;
    const meu = await db.primeira(env,
      `SELECT MAX(pontos) AS melhor FROM resultados
       WHERE usuario_id = ? AND modo = 'desafio' AND substr(criado_em, 1, 10) = ?`,
      usuario.id, hoje);
    if (meu && meu.melhor !== null && Number(meu.melhor) > 0) {
      const acima = await db.primeira(env,
        `SELECT COUNT(DISTINCT usuario_id) AS c FROM resultados
         WHERE modo = 'desafio' AND substr(criado_em, 1, 10) = ? AND pontos > ?`,
        hoje, Number(meu.melhor));
      minha = { jogou: true, melhor: Number(meu.melhor), posicao: (acima && acima.c ? acima.c : 0) + 1, total };
    } else {
      minha = { jogou: false, melhor: 0, posicao: null, total };
    }
  }

  return ok({
    data: hoje,
    seed: sementeDiaDesafio(hoje),
    perguntas: DESAFIO_PERGUNTAS,
    resumo: {
      jogadores: Number(resumo && resumo.jogadores) || 0,
      media: Math.round(Number(resumo && resumo.media) || 0)
    },
    top: (top || []).map(function (r, i) {
      return { posicao: i + 1, id: r.id, nome: r.nome, avatar: r.avatar, pontos: r.pontos };
    }),
    minha
  });
}

// POST /api/desafio/resultado — registra a tentativa do dia (melhor pontuação vence).
async function registrarResultadoDesafio(env, request) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const limite = await checar(env, request, 'desafio', 10, 60);
    if (!limite.ok) return erro(429, 'Muitos resultados enviados. Aguarde um instante.', {
      tentaDeNovoEm: limite.tentaDeNovoEm
    });
    const corpo = (await lerCorpo(request)) || {};
    const pontos = Math.max(0, Math.floor(Number(corpo.pontos) || 0));
    const acertos = Math.max(0, Math.floor(Number(corpo.acertos) || 0));
    const erros = Math.max(0, Math.floor(Number(corpo.erros) || 0));
    const combo = Math.max(0, Math.floor(Number(corpo.combo) || 0));
    const percentual = acertos + erros ? Math.round(100 * acertos / (acertos + erros)) : 0;

    await db.executar(env,
      'INSERT INTO resultados (id, usuario_id, quiz_id, quiz_titulo, modo, pontos, acertos, erros, tempo_medio, combo, percentual, xp_ganho, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      db.novoId('r_'), usuario.id, 'desafio-dia', 'Desafio do Dia', 'desafio',
      pontos, acertos, erros, Math.floor(Number(corpo.tempo) || 0), combo,
      percentual, Math.floor(Number(corpo.xp) || 0), new Date().toISOString());

    return await desafioDia(env, request);
  });
}

// ---------- RANKING GLOBAL ----------

// GET /api/ranking?tipo=&periodo=
async function rankingGlobal(env, request) {
  const url = new URL(request.url);
  const tipo = url.searchParams.get('tipo') || 'pontos';
  const periodo = url.searchParams.get('periodo') || 'geral';

  const filtroPeriodo = periodoParaSQL(periodo);
  let sql = 'SELECT u.id, u.nome, u.avatar, ';

  const metricas = {
    pontos: 'MAX(r.pontos) AS valor',
    xp: 'SUM(r.xp_ganho) AS valor',
    sequencia: 'MAX(r.combo) AS valor',
    quizzes: 'COUNT(DISTINCT r.quiz_id) AS valor',
    taxa: 'ROUND(100.0 * SUM(r.acertos) / NULLIF(SUM(r.acertos + r.erros), 0)) AS valor'
  };
  if (!metricas[tipo]) return erro(400, 'Tipo de ranking inválido.');
  sql += metricas[tipo];
  sql += ' FROM resultados r JOIN usuarios u ON u.id = r.usuario_id WHERE 1=1' + filtroPeriodo.sql;
  sql += ' GROUP BY u.id, u.nome, u.avatar ORDER BY (CASE WHEN valor IS NULL THEN 0 ELSE valor END) DESC, u.nome ASC LIMIT 50';

  const params = filtroPeriodo.params;
  const linhas = await db.todas(env, sql, ...params);
  const posicao = url.searchParams.get('posicao');

  let minha = null;
  if (posicao) {
    // Ranking com posição própria (parcial para os testes)
    const tudo = await db.todas(env, sql, ...params);
    const idx = tudo.findIndex(function (r) { return r.id === posicao; });
    minha = idx >= 0 ? { posicao: idx + 1, ...tudo[idx] } : null;
  }

  return ok({
    tipo: tipo, periodo: periodo,
    ranking: linhas.map(function (r, i) {
      return { posicao: i + 1, id: r.id, nome: r.nome, avatar: r.avatar, valor: Math.round(Number(r.valor) || 0) };
    }),
    minha
  });
}

function periodoParaSQL(periodo) {
  switch (periodo) {
    case 'hoje': return { sql: ' AND date(r.criado_em) = date("now")', params: [] };
    case 'semana': return { sql: ' AND r.criado_em >= datetime("now", "-7 days")', params: [] };
    case 'mes': return { sql: ' AND r.criado_em >= datetime("now", "-30 days")', params: [] };
    default: return { sql: '', params: [] };
  }
}

// ---------- SALAS (REST + polling) ----------

// Gera código único de sala (AKE###)
async function gerarCodigoSala(env) {
  const alfa = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let tentativa = 0; tentativa < 20; tentativa++) {
    let codigo = '';
    for (let i = 0; i < 6; i++) codigo += alfa[Math.floor(Math.random() * alfa.length)];
    const existente = await db.primeira(env, 'SELECT codigo FROM salas WHERE codigo = ? AND estado != "finalizada"', codigo);
    if (!existente) return codigo;
  }
  return 'AKE' + Math.floor(100 + Math.random() * 900);
}

// POST /api/salas — criar sala
async function criarSala(env, request) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const corpo = (await lerCorpo(request)) || {};
    const quizId = val.validarId(corpo.quizId || 'quiz-geral');
    const quiz = await db.primeira(env, 'SELECT id, titulo FROM quizzes WHERE id = ?', quizId.valor);
    if (!quiz) return erro(400, 'Quiz não encontrado.');

    const codigo = await gerarCodigoSala(env);
    await db.executar(env,
      'INSERT INTO salas (codigo, quiz_id, quiz_titulo, criador_id, criador_nome, estado) VALUES (?, ?, ?, ?, ?, "aguardando")',
      codigo, quiz.id, quiz.titulo, usuario.id, usuario.nome);
    await db.executar(env,
      'INSERT OR REPLACE INTO sala_jogadores (codigo, jogador_id, nome, pontos, acertos, erros, combo, finalizado) VALUES (?, ?, ?, 0, 0, 0, 0, 0)',
      codigo, usuario.id, usuario.nome);

    return criado({ codigo: codigo, quizId: quiz.id, quizTitulo: quiz.titulo });
  });
}

// GET /api/salas/:codigo — estado da sala (polling)
async function salaEstado(env, request, params) {
  const codigo = String(params[0] || '').trim().toUpperCase();
  if (!codigo) return erro(400, 'Código da sala inválido.');
  const sala = await db.primeira(env, 'SELECT * FROM salas WHERE codigo = ?', codigo);
  if (!sala) return naoEncontrado('Sala não encontrada.');
  const jogadores = await db.todas(env,
    'SELECT jogador_id AS id, nome, pontos, acertos, erros, combo, finalizado FROM sala_jogadores WHERE codigo = ? ORDER BY pontos DESC',
    codigo);
  return ok({
    sala: {
      codigo, quizId: sala.quiz_id, quizTitulo: sala.quiz_titulo,
      criadorNome: sala.criador_nome, criadorId: sala.criador_id,
      estado: sala.estado, criadaEm: sala.criada_em
    },
    jogadores: jogadores
  });
}

// POST /api/salas/:codigo/entrar — entrar numa sala
async function entrarSala(env, request, params) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const codigo = String(params[0] || '').trim().toUpperCase();
    if (!codigo) return erro(400, 'Código da sala inválido.');
    const sala = await db.primeira(env, 'SELECT * FROM salas WHERE codigo = ?', codigo);
    if (!sala) return naoEncontrado('Sala não encontrada.');
    if (sala.estado !== 'aguardando') return erro(409, 'A sala já começou ou terminou.');
    await db.executar(env,
      'INSERT OR REPLACE INTO sala_jogadores (codigo, jogador_id, nome, pontos, acertos, erros, combo, finalizado) VALUES (?, ?, ?, 0, 0, 0, 0, 0)',
      codigo, usuario.id, usuario.nome);
    return ok({ ok: true, nome: usuario.nome });
  });
}

// POST /api/salas/:codigo/resultado — registrar resultado individual
async function resultadoSala(env, request, params) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const codigo = String(params[0] || '').trim().toUpperCase();
    const corpo = (await lerCorpo(request)) || {};
    const sala = await db.primeira(env, 'SELECT * FROM salas WHERE codigo = ?', codigo);
    if (!sala) return naoEncontrado('Sala não encontrada.');

    const pontos = Math.max(0, Math.floor(Number(corpo.pontos) || 0));
    const acertos = Math.max(0, Math.floor(Number(corpo.acertos) || 0));
    const erros = Math.max(0, Math.floor(Number(corpo.erros) || 0));
    const combo = Math.max(0, Math.floor(Number(corpo.combo) || 0));
    await db.executar(env,
      'UPDATE sala_jogadores SET pontos = ?, acertos = ?, erros = ?, combo = ?, finalizado = 1, nome = ? WHERE codigo = ? AND jogador_id = ?',
      pontos, acertos, erros, combo, usuario.nome, codigo, usuario.id);
    await db.executar(env, 'UPDATE salas SET atualizada_em = ? WHERE codigo = ?', new Date().toISOString(), codigo);

    // Guarda resultado individual como partida normal também
    const total = acertos + erros;
    const percentual = total ? Math.round(100 * acertos / total) : 0;
    await db.executar(env,
      'INSERT INTO resultados (id, usuario_id, quiz_id, quiz_titulo, modo, pontos, acertos, erros, tempo_medio, combo, percentual, xp_ganho, criado_em) VALUES (?, ?, ?, ?, "sala", ?, ?, ?, 0, ?, ?, 0, ?)',
      db.novoId('r_'), usuario.id, sala.quiz_id, sala.quiz_titulo, pontos, acertos, erros, combo,
      percentual, new Date().toISOString());

    return ok({ ok: true });
  });
}

// POST /api/salas/:codigo/iniciar — host inicia a partida
async function iniciarSala(env, request, params) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const codigo = String(params[0] || '').trim().toUpperCase();
    const sala = await db.primeira(env, 'SELECT * FROM salas WHERE codigo = ?', codigo);
    if (!sala) return naoEncontrado('Sala não encontrada.');
    if (sala.criador_id !== usuario.id && !auth.ehAdmin(usuario)) return erro(403, 'Somente o criador pode iniciar.');
    const jogadores = await db.todas(env, 'SELECT COUNT(*) AS c FROM sala_jogadores WHERE codigo = ?', codigo);
    if (jogadores[0].c < 1) return erro(400, 'A sala precisa de pelo menos 1 jogador.');
    await db.executar(env, 'UPDATE salas SET estado = "jogando", atualizada_em = ? WHERE codigo = ?', new Date().toISOString(), codigo);
    return ok({ ok: true, estado: 'jogando' });
  });
}

// POST /api/salas/:codigo/finalizar — host encerra
async function finalizarSala(env, request, params) {
  return auth.exigirAuth(env, request, async function (usuario) {
    const codigo = String(params[0] || '').trim().toUpperCase();
    const sala = await db.primeira(env, 'SELECT * FROM salas WHERE codigo = ?', codigo);
    if (!sala) return naoEncontrado('Sala não encontrada.');
    if (sala.criador_id !== usuario.id && !auth.ehAdmin(usuario)) return erro(403, 'Somente o criador pode finalizar.');
    await db.executar(env, 'UPDATE salas SET estado = "finalizada", atualizada_em = ? WHERE codigo = ?', new Date().toISOString(), codigo);
    return ok({ ok: true, estado: 'finalizada' });
  });
}

// GET /api/health
async function health(env) {
  await db.primeira(env, 'SELECT 1 AS ok');
  return ok({ ok: true, nome: 'quiz-ake', tempo: new Date().toISOString() });
}

// ---------- ROTEAMENTO ----------

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const partes = partesDaUrl(url);
  const metodo = request.method;
  const caminho = partes.join('/');

  try {
    // Roteamento declarativo
    const rotas = [
      // health
      [caminho === 'health' && metodo === 'GET', () => health(env)],
      // auth
      [caminho === 'auth/registrar' && metodo === 'POST', () => registrar(env, request)],
      [caminho === 'auth/login' && metodo === 'POST', () => login(env, request)],
      [caminho === 'auth/logout' && metodo === 'POST', () => logout(env, request)],
      [caminho === 'auth/recuperar' && metodo === 'POST', () => recuperarSenha(env, request)],
      [caminho === 'auth/recuperar/confirmar' && metodo === 'POST', () => confirmarRecuperacao(env, request)],
      [caminho === 'auth/estado' && metodo === 'GET', () => estadoSessao(env, request)],
      [caminho === 'me' && metodo === 'GET', () => meuPerfil(env, request)],
      [caminho === 'me' && metodo === 'PATCH', () => atualizarMe(env, request)],
      // migração
      [caminho === 'migrate' && metodo === 'POST', () => migrar(env, request)],
      [caminho === 'me/progresso' && metodo === 'GET', () => meuProgresso(env, request)],
      // quizzes
      [caminho === 'quizzes' && metodo === 'GET', () => listarQuizzes(env, request)],
      [caminho === 'quizzes' && metodo === 'POST', () => criarQuiz(env, request)],
      [caminho === 'quizzes' && partes.length === 2 && metodo === 'GET', () => detalheQuiz(env, request, partes)],
      [caminho === 'quizzes' && partes.length === 2 && metodo === 'PATCH', () => editarQuiz(env, request, partes)],
      [caminho === 'quizzes' && partes.length === 2 && metodo === 'DELETE', () => removerQuiz(env, request, partes)],
      // admin
      [caminho === 'admin/dashboard' && metodo === 'GET', () => auth.exigirAdmin(env, request, () => adminDashboard(env))],
      [caminho === 'admin/usuarios' && metodo === 'GET', () => auth.exigirAdmin(env, request, () => adminUsuarios(env, request))],
      [caminho === 'admin/usuarios' && partes.length === 3 && metodo === 'PATCH', () => auth.exigirAdmin(env, request, () => adminEditarUsuario(env, request, partes))],
      [caminho === 'admin/ranking-resumo' && metodo === 'GET', () => auth.exigirAdmin(env, request, () => adminRanking(env))],
      // IA
      [caminho === 'ia/gerar' && metodo === 'POST', () => gerarQuizComIA(env, request)],
      [caminho === 'ia/gerar/salvar' && metodo === 'POST', () => salvarRascunhoIA(env, request)],
      // ranking
      [caminho === 'ranking' && metodo === 'GET', () => rankingGlobal(env, request)],
      // desafio do dia
      [caminho === 'desafio' && metodo === 'GET', () => desafioDia(env, request)],
      [caminho === 'desafio/resultado' && metodo === 'POST', () => registrarResultadoDesafio(env, request)],
      // salas
      [caminho === 'salas' && metodo === 'POST', () => criarSala(env, request)],
      [caminho === 'salas' && partes.length === 2 && metodo === 'GET', () => salaEstado(env, request, partes)],
      [caminho === 'salas' && partes.length === 3 && partes[1] === 'entrar' && metodo === 'POST', () => entrarSala(env, request, partes)],
      [caminho === 'salas' && partes.length === 3 && partes[1] === 'resultado' && metodo === 'POST', () => resultadoSala(env, request, partes)],
      [caminho === 'salas' && partes.length === 3 && partes[1] === 'iniciar' && metodo === 'POST', () => iniciarSala(env, request, partes)],
      [caminho === 'salas' && partes.length === 3 && partes[1] === 'finalizar' && metodo === 'POST', () => finalizarSala(env, request, partes)]
    ];

    for (const [condicao, acao] of rotas) {
      if (condicao) return await acao();
    }

    return naoEncontrado('Rota não encontrada: /api/' + caminho + ' (' + metodo + ')');
  } catch (e) {
    console.error('[api] erro não tratado em /api/' + caminho + ':', e.stack || e);
    return erro(500, 'Erro interno do servidor.');
  }
}