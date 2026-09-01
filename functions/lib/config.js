/* ============================================================
   NIVORA - Configuração central (Fase 1)
   Todas as constantes de pontuação, tempo e limites ficam aqui.
   Evita valores espalhados pelo código (regra #15 do prompt).
   ============================================================ */

// ---------- PONTUAÇÃO ----------
export const SCORING = {
  // Acerto = 100 pontos (fator principal)
  CORRETO: 100,
  // Bônus de velocidade = até 20 pontos por questão
  VELOCIDADE_MAX: 20,
  // Erro = 0 pontos
  ERRO: 0,
  // Tempo considerado "rápido" para bônus máximo (em segundos)
  TEMPO_RAPIDO_S: 5,
  // Tempo limite para ainda ganhar algum bônus (em segundos)
  TEMPO_LENTO_S: 30
};

// ---------- TEMPO POR QUESTÃO (segundos) ----------
export const TEMPO_QUESTAO = {
  SEM_LIMITE: 0,
  S_15: 15,
  S_30: 30,
  S_45: 45,
  S_60: 60,
  S_120: 120,
  PADRAO: 30
};

// ---------- QUANTIDADE DE QUESTÕES ----------
export const QUANTIDADES = [10, 20, 30, 40, 50];

// ---------- DIFICULDADES ----------
export const DIFICULDADES = {
  FACIL: 'facil',
  MEDIO: 'medio',
  DIFICIL: 'dificil',
  MUITO_DIFICIL: 'muito_dificil',
  PERSONALIZADO: 'personalizado'
};

export const DIFICULDADE_LABEL = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
  muito_dificil: 'Muito difícil',
  personalizado: 'Personalizado'
};

// Explicação pedagógica de cada nível (regra #6)
export const DIFICULDADE_DESC = {
  facil: 'Conceitos básicos, identificação e aplicação simples.',
  medio: 'Interpretação, aplicação e raciocínio moderado.',
  dificil: 'Associação de conceitos e problemas mais complexos.',
  muito_dificil: 'Maior profundidade, interpretação, combinação de conhecimentos e resolução de problemas.',
  personalizado: 'Configuração livre definida pelo administrador.'
};

// ---------- STATUS DE SALA/SIMULADO ----------
export const STATUS = {
  RASCUNHO: 'rascunho',
  REVISAO: 'revisao',
  PUBLICADO: 'publicado',
  ATIVO: 'ativo',
  FECHADO: 'fechado',
  ARQUIVADO: 'arquivado'
};

// Alias para compatibilidade com spec (DRAFT etc)
export const STATUS_SPEC = {
  DRAFT: 'rascunho',
  REVIEW: 'revisao',
  PUBLISHED: 'publicado',
  ACTIVE: 'ativo',
  CLOSED: 'fechado',
  ARCHIVED: 'arquivado'
};

// ---------- LIMITES ----------
export const LIMITES = {
  MAX_TITULO: 80,
  MAX_DESCRICAO: 300,
  MAX_ENUNCIADO: 800,
  MAX_ALTERNATIVA: 300,
  MAX_EXPLICACAO: 800,
  MAX_ASSUNTOS: 12,
  MAX_QUESTOES: 50,
  MIN_QUESTOES: 5,
  MAX_TENTATIVAS_REGENERACAO: 3
};

// ---------- ORDENAÇÃO RANKING ----------
// 1. acertos (desc)
// 2. pontuacao (desc)
// 3. tempo_total (asc)
export const RANKING_ORDEM = ['acertos DESC', 'pontuacao DESC', 'tempo_total ASC'];

export default { SCORING, TEMPO_QUESTAO, QUANTIDADES, DIFICULDADES, STATUS, LIMITES };
