-- ============================================================
-- NIVORA - Migração 0003: PLATAFORMA DE SIMULADOS COM IA
-- Entidades exigidas no prompt mestre: subjects, rooms/simulados,
-- questions, options, attempts, answers, ai_generations, admin_logs
-- Compatível com Cloudflare D1. NÃO quebra schema existente.
-- ============================================================

-- ---------- MATERIAS / ASSUNTOS (subjects) ----------
CREATE TABLE IF NOT EXISTS materias (
  id          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  descricao   TEXT NOT NULL DEFAULT '',
  cor         TEXT NOT NULL DEFAULT '#7c6cf0',
  emoji       TEXT NOT NULL DEFAULT '📚',
  criado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_materias_slug ON materias(slug);

-- ---------- SIMULADOS / SALAS (rooms) ----------
-- Estados exigidos: DRAFT REVIEW PUBLISHED ACTIVE CLOSED ARCHIVED
-- Mapeados para: rascunho, revisao, publicado, ativo, fechado, arquivado
CREATE TABLE IF NOT EXISTS simulados (
  id                TEXT PRIMARY KEY,
  titulo            TEXT NOT NULL,
  descricao         TEXT NOT NULL DEFAULT '',
  materia_id        TEXT REFERENCES materias(id) ON DELETE SET NULL,
  materia_nome      TEXT NOT NULL DEFAULT 'Geral',
  assuntos          TEXT NOT NULL DEFAULT '[]',
  quantidade        INTEGER NOT NULL DEFAULT 10,
  dificuldade       TEXT NOT NULL DEFAULT 'medio' CHECK (dificuldade IN ('facil','medio','dificil','muito_dificil','personalizado')),
  tempo_por_questao INTEGER NOT NULL DEFAULT 30,
  status            TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','revisao','publicado','ativo','fechado','arquivado')),
  codigo            TEXT UNIQUE,
  criador_id        TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em         TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em     TEXT NOT NULL DEFAULT (datetime('now')),
  publicado_em      TEXT
);
CREATE INDEX IF NOT EXISTS idx_simulados_status ON simulados(status);
CREATE INDEX IF NOT EXISTS idx_simulados_materia ON simulados(materia_id);
CREATE INDEX IF NOT EXISTS idx_simulados_codigo ON simulados(codigo);

-- ---------- QUESTOES DO SIMULADO ----------
CREATE TABLE IF NOT EXISTS simulado_questoes (
  id            TEXT PRIMARY KEY,
  simulado_id   TEXT NOT NULL REFERENCES simulados(id) ON DELETE CASCADE,
  enunciado     TEXT NOT NULL,
  explicacao    TEXT NOT NULL DEFAULT '',
  dificuldade   TEXT NOT NULL DEFAULT 'medio' CHECK (dificuldade IN ('facil','medio','dificil','muito_dificil')),
  assunto       TEXT NOT NULL DEFAULT '',
  ordem         INTEGER NOT NULL DEFAULT 0,
  correta_idx   INTEGER NOT NULL DEFAULT 0,
  validada      INTEGER NOT NULL DEFAULT 0,
  criado_em     TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_simulado_questoes_simulado ON simulado_questoes(simulado_id);

-- ---------- ALTERNATIVAS ----------
CREATE TABLE IF NOT EXISTS questao_alternativas (
  id          TEXT PRIMARY KEY,
  questao_id  TEXT NOT NULL REFERENCES simulado_questoes(id) ON DELETE CASCADE,
  texto       TEXT NOT NULL,
  ordem       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_questao_alternativas_questao ON questao_alternativas(questao_id);

-- ---------- TENTATIVAS (uma por usuario por simulado por padrão) ----------
CREATE TABLE IF NOT EXISTS tentativas (
  id            TEXT PRIMARY KEY,
  usuario_id    TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  simulado_id   TEXT NOT NULL REFERENCES simulados(id) ON DELETE CASCADE,
  iniciado_em   TEXT NOT NULL DEFAULT (datetime('now')),
  finalizado_em TEXT,
  acertos       INTEGER NOT NULL DEFAULT 0,
  erros         INTEGER NOT NULL DEFAULT 0,
  total         INTEGER NOT NULL DEFAULT 0,
  pontuacao     INTEGER NOT NULL DEFAULT 0,
  tempo_total   INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento','finalizada','expirada')),
  UNIQUE(usuario_id, simulado_id)
);
CREATE INDEX IF NOT EXISTS idx_tentativas_usuario ON tentativas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tentativas_simulado ON tentativas(simulado_id);
CREATE INDEX IF NOT EXISTS idx_tentativas_status ON tentativas(status);

-- ---------- RESPOSTAS (uma por questao por tentativa) ----------
CREATE TABLE IF NOT EXISTS tentativa_respostas (
  id              TEXT PRIMARY KEY,
  tentativa_id    TEXT NOT NULL REFERENCES tentativas(id) ON DELETE CASCADE,
  questao_id      TEXT NOT NULL REFERENCES simulado_questoes(id) ON DELETE CASCADE,
  alternativa_idx INTEGER,
  correta         INTEGER NOT NULL DEFAULT 0,
  tempo_gasto     INTEGER NOT NULL DEFAULT 0,
  criado_em       TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(tentativa_id, questao_id)
);
CREATE INDEX IF NOT EXISTS idx_tentativa_respostas_tentativa ON tentativa_respostas(tentativa_id);

-- ---------- GERAÇÕES IA (auditoria) ----------
CREATE TABLE IF NOT EXISTS ai_generations (
  id            TEXT PRIMARY KEY,
  simulado_id   TEXT REFERENCES simulados(id) ON DELETE SET NULL,
  usuario_id    TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
  provedor      TEXT NOT NULL DEFAULT 'local',
  modelo        TEXT NOT NULL DEFAULT '',
  prompt        TEXT NOT NULL DEFAULT '',
  resposta_raw  TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'sucesso' CHECK (status IN ('sucesso','falha','pendente')),
  tentativas    INTEGER NOT NULL DEFAULT 1,
  criado_em     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ai_generations_simulado ON ai_generations(simulado_id);

-- ---------- LOGS ADMINISTRATIVOS ----------
CREATE TABLE IF NOT EXISTS admin_logs (
  id          TEXT PRIMARY KEY,
  usuario_id  TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
  acao        TEXT NOT NULL,
  alvo_tipo   TEXT NOT NULL DEFAULT '',
  alvo_id     TEXT NOT NULL DEFAULT '',
  detalhes    TEXT NOT NULL DEFAULT '{}',
  criado_em   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_admin_logs_usuario ON admin_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_acao ON admin_logs(acao);
CREATE INDEX IF NOT EXISTS idx_admin_logs_criado ON admin_logs(criado_em);

-- ---------- SEED: materias basicas ----------
INSERT OR IGNORE INTO materias (id, nome, slug, descricao, cor, emoji) VALUES
  ('matematica', 'Matemática', 'matematica', 'Álgebra, geometria, funções e cálculo', '#8fa83c', '➗'),
  ('portugues', 'Português', 'portugues', 'Gramática, interpretação e literatura', '#d08a3c', '📚'),
  ('historia', 'História', 'historia', 'História geral e do Brasil', '#e0a33a', '📜'),
  ('geografia', 'Geografia', 'geografia', 'Geografia física e humana', '#2aa1d9', '🌎'),
  ('ciencia', 'Ciências', 'ciencia', 'Biologia, química e física', '#35c08a', '🔬'),
  ('geral', 'Conhecimentos Gerais', 'geral', 'Matérias variadas', '#7c6cf0', '🧠');
