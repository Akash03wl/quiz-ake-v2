-- ============================================================
-- NIVORA - Migração 0001: schema base (Cloudflare D1)
-- ============================================================

-- ---------- CONTAS ----------
CREATE TABLE IF NOT EXISTS usuarios (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  senha_hash    TEXT NOT NULL,
  nome          TEXT NOT NULL DEFAULT 'Jogador AKE',
  avatar        TEXT NOT NULL DEFAULT '🧑🚀', 
  papel         TEXT NOT NULL DEFAULT 'usuario' CHECK (papel IN ('usuario','moderador','admin')),
  status        TEXT NOT NULL DEFAULT 'ativo'   CHECK (status IN ('ativo','bloqueado')),
  google_id     TEXT,
  criado_em     TEXT NOT NULL DEFAULT (datetime('now')),
  ultimo_acesso TEXT,
  adm_por       TEXT
);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- ---------- SESSÕES (cookie de autenticação) ----------
CREATE TABLE IF NOT EXISTS sessoes (
  token      TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criada_em  TEXT NOT NULL DEFAULT (datetime('now')),
  expira_em  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);

-- ---------- RECUPERAÇÃO DE SENHA ----------
CREATE TABLE IF NOT EXISTS recuperacoes (
  token      TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em  TEXT NOT NULL DEFAULT (datetime('now')),
  expira_em  TEXT NOT NULL,
  usado      INTEGER NOT NULL DEFAULT 0
);

-- ---------- PERFIS (progresso canônico espelhado do navegador) ----------
CREATE TABLE IF NOT EXISTS perfis (
  usuario_id    TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  xp            INTEGER NOT NULL DEFAULT 0,
  nivel         INTEGER NOT NULL DEFAULT 1,
  recorde       INTEGER NOT NULL DEFAULT 0,
  stats         TEXT NOT NULL DEFAULT '{}',
  conquistas    TEXT NOT NULL DEFAULT '[]',
  favoritos     TEXT NOT NULL DEFAULT '[]',
  streak        TEXT NOT NULL DEFAULT '{"dias":[]}',
  desafio       TEXT NOT NULL DEFAULT '{}',
  historico     TEXT NOT NULL DEFAULT '[]',
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- QUIZZES (metadados) ----------
-- origem: oficial = catálogo do FRONTEND (perguntas ficam no navegador);
--         criado/ia = produzidos e persistidos aqui (perguntas nas tabelas abaixo).
CREATE TABLE IF NOT EXISTS quizzes (
  id          TEXT PRIMARY KEY,
  titulo      TEXT NOT NULL,
  descricao   TEXT NOT NULL DEFAULT '',
  categoria   TEXT NOT NULL DEFAULT 'geral',
  dificuldade TEXT NOT NULL DEFAULT 'medio',
  emoji       TEXT NOT NULL DEFAULT '@',
  cor         TEXT NOT NULL DEFAULT '#7c6cf0',
  autor       TEXT NOT NULL DEFAULT 'Nivora',
  autor_id    TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
  tags        TEXT NOT NULL DEFAULT '[]',
  quantidade  INTEGER NOT NULL DEFAULT 0,
  duracao     INTEGER NOT NULL DEFAULT 60,
  status      TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('rascunho','ativo','inativo')),
  destaque    INTEGER NOT NULL DEFAULT 0,
  origem      TEXT NOT NULL DEFAULT 'oficial' CHECK (origem IN ('oficial','criado','ia')),
  criado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_quizzes_categoria ON quizzes(categoria);
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status);

-- ---------- PERGUNTAS (apenas para quizzes criados / gerados por IA) ----------
CREATE TABLE IF NOT EXISTS perguntas (
  id            TEXT PRIMARY KEY,
  quiz_id       TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  pergunta      TEXT NOT NULL,
  alternativas  TEXT NOT NULL DEFAULT '[]',
  correta       INTEGER NOT NULL DEFAULT 0,
  explicacao    TEXT NOT NULL DEFAULT '',
  dificuldade   TEXT NOT NULL DEFAULT 'medio',
  tipo          TEXT NOT NULL DEFAULT 'multipla',
  ordem         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_perguntas_quiz ON perguntas(quiz_id);

-- ---------- RESULTADOS (histórico competitivo para ranking global) ----------
CREATE TABLE IF NOT EXISTS resultados (
  id          TEXT PRIMARY KEY,
  usuario_id  TEXT REFERENCES usuarios(id) ON DELETE CASCADE,
  quiz_id     TEXT NOT NULL,
  quiz_titulo TEXT NOT NULL DEFAULT '',
  modo        TEXT NOT NULL DEFAULT 'normal',
  pontos      INTEGER NOT NULL DEFAULT 0,
  acertos     INTEGER NOT NULL DEFAULT 0,
  erros       INTEGER NOT NULL DEFAULT 0,
  tempo_medio INTEGER NOT NULL DEFAULT 0,
  combo       INTEGER NOT NULL DEFAULT 0,
  percentual  INTEGER NOT NULL DEFAULT 0,
  xp_ganho    INTEGER NOT NULL DEFAULT 0,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_resultados_usuario ON resultados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_resultados_data ON resultados(criado_em);

-- ---------- CONQUISTAS (catálogo + progresso) ----------
CREATE TABLE IF NOT EXISTS conquistas (
  id    TEXT PRIMARY KEY,
  icone TEXT NOT NULL DEFAULT '@',
  nome  TEXT NOT NULL,
  desc  TEXT NOT NULL DEFAULT '',
  tipo  TEXT NOT NULL,
  alvo  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS conquistas_usuario (
  usuario_id   TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  conquista_id TEXT NOT NULL REFERENCES conquistas(id) ON DELETE CASCADE,
  progresso    INTEGER NOT NULL DEFAULT 0,
  desbloqueada INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (usuario_id, conquista_id)
);

-- ---------- SALAS (multiplayer: REST + polling) ----------
CREATE TABLE IF NOT EXISTS salas (
  codigo       TEXT PRIMARY KEY,
  quiz_id      TEXT NOT NULL,
  quiz_titulo  TEXT NOT NULL DEFAULT '',
  criador_id   TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
  criador_nome TEXT NOT NULL DEFAULT '',
  estado       TEXT NOT NULL DEFAULT 'aguardando' CHECK (estado IN ('aguardando','jogando','finalizada')),
  criada_em    TEXT NOT NULL DEFAULT (datetime('now')),
  atualizada_em TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sala_jogadores (
  codigo     TEXT NOT NULL REFERENCES salas(codigo) ON DELETE CASCADE,
  jogador_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  pontos     INTEGER NOT NULL DEFAULT 0,
  acertos    INTEGER NOT NULL DEFAULT 0,
  erros      INTEGER NOT NULL DEFAULT 0,
  combo      INTEGER NOT NULL DEFAULT 0,
  finalizado INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (codigo, jogador_id)
);
CREATE INDEX IF NOT EXISTS idx_sala_jogadores_codigo ON sala_jogadores(codigo);

-- ---------- RATE LIMIT (janela por chave) ----------
CREATE TABLE IF NOT EXISTS rate_limit (
  chave        TEXT PRIMARY KEY,
  contagem     INTEGER NOT NULL DEFAULT 0,
  janela_expira INTEGER NOT NULL DEFAULT 0
);