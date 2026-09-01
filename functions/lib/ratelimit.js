/* ============================================================
   NIVORA BACKEND - lib/ratelimit.js
   Limitação de taxa baseada em D1. Cada chave (IP+rota) tem uma
   contagem dentro de uma janela inteira de segundos.
   ============================================================ */

const JANELA_PADRAO = 60;        // 1 minuto
const LIMITE_PADRAO = 60;

// Chave pronta: "rl:IP:rotulo". Obtém o IP da requisição.
export function ipDaRequisicao(request) {
  const xff = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For');
  if (xff) return String(xff).split(',')[0].trim();
  return 'desconhecido';
}

// Verifica e incremeta. Retorna { ok: true } ou { ok: false, tentaDeNovoEm }.
export async function checar(env, request, rotulo, limite, janela) {
  limite = limite || LIMITE_PADRAO;
  janela = janela || JANELA_PADRAO;
  const ip = ipDaRequisicao(request);
  const agora = Math.floor(Date.now() / 1000);
  const janelaAtual = Math.floor(agora / janela) * janela;
  const chave = 'rl:' + ip + ':' + rotulo;

  try {
    const linha = await env.DB.prepare(
      'SELECT contagem, janela_expira FROM rate_limit WHERE chave = ?'
    ).bind(chave).first();

    if (!linha || Number(linha.janela_expira) !== janelaAtual) {
      // nova janela: zera
      await env.DB.prepare(
        'INSERT INTO rate_limit (chave, contagem, janela_expira) VALUES (?, 1, ?) ON CONFLICT(chave) DO UPDATE SET contagem = 1, janela_expira = excluded.janela_expira'
      ).bind(chave, janelaAtual).run();
      return { ok: true };
    }

    const contagem = Number(linha.contagem) + 1;
    if (contagem > limite) {
      const tentaDeNovoEm = janelaAtual + janela - agora;
      return { ok: false, tentaDeNovoEm: tentaDeNovoEm };
    }

    await env.DB.prepare(
      'UPDATE rate_limit SET contagem = ? WHERE chave = ?'
    ).bind(contagem, chave).run();
    return { ok: true };
  } catch (e) {
    console.error('[ratelimit] erro:', e.message);
    // Falha em rate limit nunca bloqueia a aplicação.
    return { ok: true };
  }
}

export default { checar, ipDaRequisicao };