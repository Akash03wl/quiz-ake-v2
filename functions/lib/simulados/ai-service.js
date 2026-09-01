/* ============================================================
   NIVORA - Camada de IA (Fase 1 - abstração)
   AIService com providers trocáveis. Resto da app não depende
   de um único provedor.
   - AIService
     ├── GeminiProvider (via OpenRouter / AI_BASE_URL)
     └── WorkersAIProvider (binding AI)
   Fallback local (mock) garante que testes nunca quebrem por IA.
   ============================================================ */

import { LIMITES } from '../config.js';

const MODELO_PADRAO = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

// Prompt robusto (não simplista) conforme regra #7
export function montarPromptIA({ materia, assuntos, dificuldade, quantidade, idioma = 'pt-BR' }) {
  const descDificuldade = {
    facil: 'Conceitos básicos, identificação e aplicação simples.',
    medio: 'Interpretação, aplicação e raciocínio moderado.',
    dificil: 'Associação de conceitos e problemas mais complexos.',
    muito_dificil: 'Maior profundidade, interpretação, combinação de conhecimentos e resolução de problemas.',
    personalizado: 'Nível personalizado conforme assuntos informados.'
  };
  return `Você é um especialista em criação de questões educacionais em ${idioma}.
TAREFA: Gere exatamente ${quantidade} questões de múltipla escolha (4 ou 5 alternativas, UMA única correta).

CONTEXTO:
- Matéria: ${materia}
- Assuntos: ${assuntos.join(', ')}
- Dificuldade: ${dificuldade} — ${descDificuldade[dificuldade] || ''}
- Idioma: ${idioma}
- Tipo: múltipla escolha

REGRAS OBRIGATÓRIAS:
1. Analise os assuntos e identifique conceitos relevantes.
2. Elabore questões respeitando a dificuldade informada.
3. Evite repetição entre questões.
4. Crie alternativas plausíveis (distratores fortes).
5. Defina exatamente UMA resposta correta por questão.
6. Crie explicação pedagógica clara para o gabarito.
7. Associe cada questão ao assunto mais pertinente.
8. Revise a própria questão antes de finalizar.
9. Responda APENAS JSON válido, sem markdown, sem texto extra.

FORMATO JSON EXIGIDO:
{
  "questoes": [
    {
      "enunciado": "Texto da pergunta",
      "alternativas": ["A","B","C","D"],
      "correta_idx": 2,
      "explicacao": "Por que a alternativa correta está certa",
      "dificuldade": "${dificuldade}",
      "assunto": "um dos assuntos informados"
    }
  ]
}

GERE AGORA ${quantidade} QUESTÕES.`;
}

export function extrairJSON(texto) {
  const t = String(texto || '');
  const ini = t.indexOf('{');
  const fim = t.lastIndexOf('}');
  if (ini < 0 || fim <= ini) return null;
  try { return JSON.parse(t.slice(ini, fim + 1)); } catch { return null; }
}

// ---------- Providers ----------

async function chamarWorkersAI(env, prompt) {
  if (!env.AI) throw new Error('Workers AI não configurado (binding AI ausente).');
  const modelo = env.AI_MODEL || MODELO_PADRAO;
  const resp = await env.AI.run(modelo, {
    messages: [
      { role: 'system', content: 'Você gera APENAS JSON válido, sem markdown e sem texto extra.' },
      { role: 'user', content: prompt }
    ]
  });
  return typeof resp === 'string' ? resp : (resp && resp.response) || '';
}

async function chamarOpenRouter(env, prompt) {
  const url = (env.AI_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '') + '/chat/completions';
  const key = env.AI_API_KEY;
  if (!key) throw new Error('AI_API_KEY não configurado.');
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      model: env.AI_MODEL || 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: 'Você gera APENAS JSON válido, sem markdown e sem texto extra.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
  });
  if (!r.ok) throw new Error('Provedor IA falhou: HTTP ' + r.status);
  const d = await r.json();
  return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
}

// Geração local determinística (fallback offline)
export function gerarMockLocal({ materia, assuntos, dificuldade, quantidade }) {
  const base = assuntos[0] || materia || 'Conhecimentos Gerais';
  const questoes = [];
  for (let i = 0; i < quantidade; i++) {
    questoes.push({
      enunciado: `[${base} - ${dificuldade}] Questão mock ${i + 1}: Qual alternativa está correta sobre "${assuntos[i % assuntos.length]}"?`,
      alternativas: [
        `Alternativa A sobre ${base}`,
        `Alternativa B sobre ${base}`,
        `Alternativa C correta sobre ${assuntos[i % assuntos.length]}`,
        `Alternativa D sobre ${base}`
      ],
      correta_idx: 2,
      explicacao: `A alternativa C está correta porque aborda diretamente "${assuntos[i % assuntos.length]}" no nível ${dificuldade}.`,
      dificuldade,
      assunto: assuntos[i % assuntos.length]
    });
  }
  return { questoes };
}

export class AIService {
  constructor(env) { this.env = env; }

  async generateQuestions(params) {
    const quantidade = Math.min(LIMITES.MAX_QUESTOES, Math.max(LIMITES.MIN_QUESTOES, Number(params.quantidade) || 10));
    const prompt = montarPromptIA({ ...params, quantidade });

    // 1) Workers AI
    if (this.env.AI) {
      try {
        const texto = await chamarWorkersAI(this.env, prompt);
        const dados = extrairJSON(texto);
        if (dados && Array.isArray(dados.questoes) && dados.questoes.length) {
          return { questoes: dados.questoes.slice(0, quantidade), provedor: 'workers-ai', prompt, raw: texto };
        }
      } catch (e) {
        console.error('[ai] workers-ai falhou:', e.message);
      }
    }
    // 2) OpenRouter / Gemini / OpenAI compatível
    if (this.env.AI_API_KEY) {
      try {
        const texto = await chamarOpenRouter(this.env, prompt);
        const dados = extrairJSON(texto);
        if (dados && Array.isArray(dados.questoes) && dados.questoes.length) {
          return { questoes: dados.questoes.slice(0, quantidade), provedor: 'openrouter', prompt, raw: texto };
        }
      } catch (e) {
        console.error('[ai] openrouter falhou:', e.message);
      }
    }
    // 3) Fallback mock (nunca falha)
    const mock = gerarMockLocal({ ...params, quantidade });
    return { questoes: mock.questoes, provedor: 'mock-local', prompt, raw: JSON.stringify(mock) };
  }

  // Validação de conteúdo assistida por IA (segunda passada)
  async validateQuestions(questoes) {
    // Fase 1: validação estrutural local. IA valida conteúdo em Fase 5.
    const { validarLoteQuestoes } = await import('./validation.js');
    return validarLoteQuestoes(questoes);
  }

  async regenerateQuestion(params, questaoAnterior) {
    // Regenera uma única questão mantendo contexto
    const r = await this.generateQuestions({ ...params, quantidade: 1 });
    return r.questoes[0] || null;
  }
}

export default AIService;
