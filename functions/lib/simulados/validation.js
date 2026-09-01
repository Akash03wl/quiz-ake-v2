/* ============================================================
   NIVORA - Validação de simulados/questões (Fase 1)
   Validação de schema antes de salvar. Nunca confia em IA.
   ============================================================ */

import { LIMITES } from '../config.js';

export function validarSimulado(dados) {
  if (!dados || typeof dados !== 'object') return { ok: false, erro: 'Dados inválidos.' };
  const titulo = String(dados.titulo || '').trim();
  if (titulo.length < 3) return { ok: false, erro: 'Título deve ter pelo menos 3 caracteres.' };
  if (titulo.length > LIMITES.MAX_TITULO) return { ok: false, erro: 'Título muito longo.' };

  const descricao = String(dados.descricao || '').trim().slice(0, LIMITES.MAX_DESCRICAO);
  const quantidade = Number(dados.quantidade) || 10;
  if (![10, 20, 30, 40, 50].includes(quantidade) && (quantidade < LIMITES.MIN_QUESTOES || quantidade > LIMITES.MAX_QUESTOES)) {
    return { ok: false, erro: 'Quantidade de questões inválida.' };
  }

  const dificuldade = String(dados.dificuldade || 'medio');
  const diffs = ['facil', 'medio', 'dificil', 'muito_dificil', 'personalizado'];
  if (!diffs.includes(dificuldade)) return { ok: false, erro: 'Dificuldade inválida.' };

  const tempo = Number(dados.tempo_por_questao ?? dados.tempoPorQuestao ?? 30);
  if (![0, 15, 30, 45, 60, 120].includes(tempo)) return { ok: false, erro: 'Tempo por questão inválido.' };

  const assuntos = Array.isArray(dados.assuntos) ? dados.assuntos.map(s => String(s).trim()).filter(Boolean).slice(0, LIMITES.MAX_ASSUNTOS) : [];
  if (!assuntos.length) return { ok: false, erro: 'Informe pelo menos um assunto.' };

  const materia = String(dados.materia || dados.materia_id || dados.materiaNome || 'geral').trim();

  return {
    ok: true,
    valor: { titulo, descricao, quantidade, dificuldade, tempo_por_questao: tempo, assuntos, materia }
  };
}

export function validarQuestao(q, idx = 0) {
  const base = `Questão ${idx + 1}: `;
  if (!q || typeof q !== 'object') return { ok: false, erro: base + 'dados inválidos.' };
  const enunciado = String(q.enunciado || q.question || q.pergunta || '').trim();
  if (!enunciado) return { ok: false, erro: base + 'enunciado obrigatório.' };
  if (enunciado.length > LIMITES.MAX_ENUNCIADO) return { ok: false, erro: base + 'enunciado muito longo.' };

  let alternativas = Array.isArray(q.alternativas || q.options) ? (q.alternativas || q.options) : [];
  alternativas = alternativas.map(a => String(a).trim()).filter(Boolean);
  if (alternativas.length < 4) return { ok: false, erro: base + 'mínimo 4 alternativas.' };
  if (alternativas.length > 5) alternativas = alternativas.slice(0, 5);
  const set = new Set(alternativas.map(s => s.toLowerCase()));
  if (set.size !== alternativas.length) return { ok: false, erro: base + 'alternativas duplicadas.' };
  if (alternativas.some(a => !a)) return { ok: false, erro: base + 'alternativa vazia.' };

  let correta = Number(q.correta_idx ?? q.correctAnswer ?? q.correta);
  if (!Number.isInteger(correta) || correta < 0 || correta >= alternativas.length) {
    return { ok: false, erro: base + 'gabarito inválido.' };
  }

  const explicacao = String(q.explicacao || q.explanation || '').trim();
  if (!explicacao) return { ok: false, erro: base + 'explicação obrigatória.' };

  const assunto = String(q.assunto || q.subject || '').trim();
  const dificuldade = String(q.dificuldade || q.difficulty || 'medio');
  if (!['facil', 'medio', 'dificil', 'muito_dificil'].includes(dificuldade)) {
    return { ok: false, erro: base + 'dificuldade inválida.' };
  }

  return {
    ok: true,
    valor: { enunciado, alternativas, correta_idx: correta, explicacao, assunto, dificuldade }
  };
}

export function validarLoteQuestoes(questoes) {
  if (!Array.isArray(questoes) || !questoes.length) return { ok: false, erro: 'Nenhuma questão enviada.' };
  const validas = [];
  for (let i = 0; i < questoes.length; i++) {
    const r = validarQuestao(questoes[i], i);
    if (!r.ok) return r;
    validas.push(r.valor);
  }
  // Verifica única resposta correta já garantida acima; checa duplicação de enunciado
  const enunciados = new Set(validas.map(v => v.enunciado.toLowerCase()));
  if (enunciados.size !== validas.length) return { ok: false, erro: 'Há questões com enunciados duplicados.' };
  return { ok: true, valor: validas };
}

export default { validarSimulado, validarQuestao, validarLoteQuestoes };
