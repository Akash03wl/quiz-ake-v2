/* ============================================================
   NIVORA - Motor de pontuação (Fase 1)
   Regras centralizadas, testáveis e sem dependência de frontend.
   Garante: mais acertos NUNCA fica abaixo de menos acertos,
   mesmo com bônus de velocidade.
   ============================================================ */

import { SCORING } from './config.js';

/**
 * Calcula pontos de uma questão.
 * @param {boolean} acertou
 * @param {number} tempoGastoS - segundos gastos na questão
 * @param {number} tempoLimiteS - limite da questão (0 = sem limite)
 * @returns {number} pontos 0..120
 */
export function pontosDaQuestao(acertou, tempoGastoS, tempoLimiteS) {
  if (!acertou) return SCORING.ERRO;
  let bonus = 0;
  if (tempoLimiteS && tempoLimiteS > 0) {
    // Bônus decresce linearmente: rápido = max, lento = 0
    const t = Math.max(0, Number(tempoGastoS) || 0);
    if (t <= SCORING.TEMPO_RAPIDO_S) bonus = SCORING.VELOCIDADE_MAX;
    else if (t < SCORING.TEMPO_LENTO_S) {
      const faixa = SCORING.TEMPO_LENTO_S - SCORING.TEMPO_RAPIDO_S;
      bonus = Math.round(SCORING.VELOCIDADE_MAX * (1 - (t - SCORING.TEMPO_RAPIDO_S) / faixa));
    }
  } else if (!tempoLimiteS) {
    // Sem limite: bônus pequeno se respondeu rápido (<10s)
    const t = Number(tempoGastoS) || 0;
    if (t > 0 && t <= 10) bonus = Math.round(SCORING.VELOCIDADE_MAX * 0.5);
  }
  return SCORING.CORRETO + Math.max(0, bonus);
}

/**
 * Calcula resultado agregado de uma tentativa.
 * @param {Array<{acertou:boolean, tempoGasto:number}>} respostas
 * @param {number} tempoLimite
 * @returns {{acertos:number, erros:number, total:number, pontuacao:number, tempoTotal:number, aproveitamento:number}}
 */
export function calcularResultado(respostas, tempoLimite) {
  let acertos = 0;
  let erros = 0;
  let pontuacao = 0;
  let tempoTotal = 0;
  for (const r of respostas) {
    tempoTotal += Number(r.tempoGasto) || 0;
    if (r.acertou) {
      acertos++;
      pontuacao += pontosDaQuestao(true, r.tempoGasto, tempoLimite);
    } else {
      erros++;
      pontuacao += pontosDaQuestao(false, r.tempoGasto, tempoLimite);
    }
  }
  const total = acertos + erros;
  const aproveitamento = total ? Math.round((acertos / total) * 100) : 0;
  return { acertos, erros, total, pontuacao, tempoTotal, aproveitamento };
}

/**
 * Ordena ranking: acertos desc, pontuacao desc, tempo asc
 */
export function ordenarRanking(lista) {
  return [...lista].sort((a, b) => {
    if (b.acertos !== a.acertos) return b.acertos - a.acertos;
    if (b.pontuacao !== a.pontuacao) return b.pontuacao - a.pontuacao;
    return (a.tempo_total || a.tempoTotal || 0) - (b.tempo_total || b.tempoTotal || 0);
  });
}

export default { pontosDaQuestao, calcularResultado, ordenarRanking };
