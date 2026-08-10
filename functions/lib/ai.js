/* ============================================================
   QUIZ AKE BACKEND - lib/ai.js
   Geração de quizzes com IA.
   - Provedor default: Workers AI (binding "AI", modelo via AI_MODEL).
   - Fallback: endpoint OpenAI-compatível via AI_BASE_URL/AI_API_KEY.
   - Fallback final: banco local garantido (offline / limite de IA),
     que SEMPRE devolve um rascunho válido para revisão pelo usuário.
   O rascunho nunca é salvo automaticamente: o usuário revisa e salva.
   ============================================================ */

import { validarQuizQuizz, validarCategoria } from './validacao.js';

const MODELO_PADRAO = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const PREFIXO_ID_LOCAL = 'ia-';

const BANCO_LOCAL = {
  geral: [
    { pergunta: 'Qual é o maior planeta do Sistema Solar?', alternativas: ['Terra', 'Júpiter', 'Saturno', 'Marte'], correta: 1, explicacao: 'Júpiter é o maior planeta, com mais de 2,5x a massa de todos os outros juntos.', dificuldade: 'medio' },
    { pergunta: 'Qual é o símbolo químico do ouro?', alternativas: ['Au', 'Ag', 'Fe', 'O'], correta: 0, explicacao: 'Au vem do latim "aurum". Ag é prata, Fe é ferro e O é oxigênio.', dificuldade: 'medio' },
    { pergunta: 'Qual desses animais é um mamífero?', alternativas: ['Tubarão', 'Golfinho', 'Polvo', 'Tartaruga'], correta: 1, explicacao: 'O golfinho é mamífero: respira ar, tem sangue quente e amamenta os filhotes.', dificuldade: 'facil' },
    { pergunta: 'Quantos ossos tem (aprox.) o corpo humano adulto?', alternativas: ['106', '206', '306', '406'], correta: 1, explicacao: 'Um adulto tem em média 206 ossos; bebês nascem com cerca de 300.', dificuldade: 'facil' },
    { pergunta: 'Qual planeta é chamado de "Planeta Vermelho"?', alternativas: ['Vênus', 'Marte', 'Mercúrio', 'Netuno'], correta: 1, explicacao: 'Marte tem coloração avermelhada por causa do óxido de ferro no solo.', dificuldade: 'facil' }
  ],
  ciencia: [
    { pergunta: 'Qual é o maior planeta do Sistema Solar?', alternativas: ['Terra', 'Júpiter', 'Saturno', 'Marte'], correta: 1, explicacao: 'Júpiter é o maior planeta, com mais de 2,5x a massa de todos os outros juntos.', dificuldade: 'medio' },
    { pergunta: 'Qual é o símbolo químico do ouro?', alternativas: ['Au', 'Ag', 'Fe', 'O'], correta: 0, explicacao: 'Au vem do latim "aurum". Ag é prata, Fe é ferro e O é oxigênio.', dificuldade: 'medio' },
    { pergunta: 'Qual gás os seres humanos respiram para sobreviver?', alternativas: ['Oxigênio', 'Hidrogênio', 'Gás carbônico', 'Hélio'], correta: 0, explicacao: 'O oxigênio (O2) é absorvido pelos pulmões e usado pelas células para produzir energia.', dificuldade: 'facil' },
    { pergunta: 'A água ferve a 100°C ao nível do mar.', alternativas: ['Verdadeiro', 'Falso'], correta: 0, explicacao: 'Ao nível do mar a água ferve a 100°C; em altitudes maiores ferve antes.', dificuldade: 'facil' }
  ],
  geografia: [
    { pergunta: 'Qual é o maior oceano do mundo?', alternativas: ['Atlântico', 'Índico', 'Pacífico', 'Ártico'], correta: 2, explicacao: 'O Pacífico cobre cerca de 1/3 da superfície da Terra.', dificuldade: 'facil' },
    { pergunta: 'Qual é a capital da França?', alternativas: ['Londres', 'Paris', 'Roma', 'Berlim'], correta: 1, explicacao: 'Paris é a capital da França, banhada pelo rio Sena.', dificuldade: 'facil' },
    { pergunta: 'Qual é o maior país do mundo em território?', alternativas: ['China', 'EUA', 'Brasil', 'Rússia'], correta: 3, explicacao: 'A Rússia é o maior país, com mais de 17 milhões de km².', dificuldade: 'facil' },
    { pergunta: 'Em que continente fica o Egito?', alternativas: ['Ásia', 'África', 'Europa', 'América'], correta: 1, explicacao: 'O Egito fica no nordeste da África, ligado à Ásia pela península do Sinai.', dificuldade: 'facil' }
  ],
  historia: [
    { pergunta: 'Quando o homem pisou na Lua pela primeira vez?', alternativas: ['1965', '1969', '1972', '1979'], correta: 1, explicacao: 'Em 20 de julho de 1969 a Apollo 11 chegou à Lua com Neil Armstrong.', dificuldade: 'medio' },
    { pergunta: 'Quem pintou a Mona Lisa?', alternativas: ['Van Gogh', 'Picasso', 'Leonardo da Vinci', 'Michelangelo'], correta: 2, explicacao: 'A Mona Lisa foi pintada por Leonardo da Vinci no início do século XVI.', dificuldade: 'facil' },
    { pergunta: 'Qual país conquistou a primeira Copa do Mundo de futebol?', alternativas: ['Brasil', 'Itália', 'Uruguai', 'Argentina'], correta: 2, explicacao: 'O Uruguai venceu a primeira Copa do Mundo, em 1930, jogando em casa.', dificuldade: 'medio' },
    { pergunta: 'Em que década caiu o Muro de Berlim?', alternativas: ['1960', '1970', '1980', '1990'], correta: 2, explicacao: 'O Muro de Berlim caiu em 1989, no fim da década de 1980.', dificuldade: 'medio' }
  ],
  tecnologia: [
    { pergunta: 'O que significa a sigla HTML?', alternativas: ['Hiper Texto de Marcas', 'Linguagem de Marcação de Hipertexto', 'Linguagem de Máquina Total', 'Hora de Melhorar os Textos'], correta: 1, explicacao: 'HTML = HyperText Markup Language, a linguagem que estrutura as páginas web.', dificuldade: 'medio' },
    { pergunta: 'Qual destes é um navegador de internet?', alternativas: ['Photoshop', 'Chrome', 'Windows', 'Word'], correta: 1, explicacao: 'Google Chrome é um navegador. Photoshop é editor de imagens, Windows é sistema e Word é editor de texto.', dificuldade: 'facil' },
    { pergunta: 'Qual empresa criou o iPhone?', alternativas: ['Google', 'Microsoft', 'Apple', 'Samsung'], correta: 2, explicacao: 'O iPhone foi lançado pela Apple em 2007.', dificuldade: 'facil' },
    { pergunta: 'Qual protocolo é seguro para acessar sites?', alternativas: ['FTP', 'HTTP', 'HTTPS', 'SMTP'], correta: 2, explicacao: 'HTTPS adiciona criptografia (SSL/TLS) ao HTTP, protegendo os dados da conexão.', dificuldade: 'dificil' }
  ],
  games: [
    { pergunta: 'Quem é o criador do Super Mario?', alternativas: ['Shigeru Miyamoto', 'Hideo Kojima', 'Gabe Newell', 'John Carmack'], correta: 0, explicacao: 'Shigeru Miyamoto, da Nintendo, criou Mario, Zelda e Donkey Kong.', dificuldade: 'medio' },
    { pergunta: 'Qual jogo é famoso por construir com blocos?', alternativas: ['Tetris', 'Pac-Man', 'Minecraft', 'Angry Birds'], correta: 2, explicacao: 'Minecraft é o sandbox de construção por blocos mais vendido do mundo.', dificuldade: 'facil' },
    { pergunta: 'Quem é o mascote da Nintendo?', alternativas: ['Sonic', 'Mario', 'Crash', 'Knuckles'], correta: 1, explicacao: 'Mario é o mascote da Nintendo.', dificuldade: 'facil' }
  ],
  filmes: [
    { pergunta: 'Qual saga de filmes tem o personagem Darth Vader?', alternativas: ['Senhor dos Anéis', 'Star Wars', 'Harry Potter', 'Jurassic Park'], correta: 1, explicacao: 'Darth Vader é o vilão icônico da saga Star Wars.', dificuldade: 'facil' },
    { pergunta: 'Quem interpretou Tony Stark no cinema?', alternativas: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Scarlett Johansson'], correta: 1, explicacao: 'Robert Downey Jr. deu vida ao Homem de Ferro a partir de 2008.', dificuldade: 'facil' },
    { pergunta: 'Qual filme tem a frase "Que a força esteja com você"?', alternativas: ['Star Trek', 'Star Wars', 'Matrix', 'Guardiões da Galáxia'], correta: 1, explicacao: '"Que a força esteja com você" é a frase clássica de Star Wars.', dificuldade: 'facil' }
  ],
  musica: [
    { pergunta: 'Qual artista é conhecido como o "Rei do Pop"?', alternativas: ['Elvis Presley', 'Freddie Mercury', 'Michael Jackson', 'Bob Dylan'], correta: 2, explicacao: 'Michael Jackson é mundialmente conhecido como o Rei do Pop.', dificuldade: 'facil' },
    { pergunta: 'Quantas cordas tem um violão comum?', alternativas: ['4', '5', '6', '7'], correta: 2, explicacao: 'O violão padrão tem 6 cordas (mi, lá, ré, sol, si, mi).', dificuldade: 'facil' },
    { pergunta: 'Qual banda gravou o álbum "The Dark Side of the Moon"?', alternativas: ['The Beatles', 'Pink Floyd', 'Queen', 'Led Zeppelin'], correta: 1, explicacao: 'Pink Floyd lançou "The Dark Side of the Moon" em 1973.', dificuldade: 'medio' }
  ],
  esportes: [
    { pergunta: 'Quantos jogadores compõem um time de futebol em campo?', alternativas: ['9', '10', '11', '12'], correta: 2, explicacao: 'Cada time entra com 11 jogadores em campo, incluindo o goleiro.', dificuldade: 'facil' },
    { pergunta: 'Quantos pontos vale uma cesta comum no basquete?', alternativas: ['1', '2', '3', '4'], correta: 1, explicacao: 'Uma cesta da quadra vale 2 pontos (lance livre vale 1, além do arco vale 3).', dificuldade: 'facil' },
    { pergunta: 'Qual piloto tem mais títulos de Fórmula 1?', alternativas: ['Schumacher', 'Hamilton', 'Senna', 'Verstappen'], correta: 1, explicacao: 'Lewis Hamilton tem 7 títulos, empatado com Michael Schumacher.', dificuldade: 'medio' }
  ],
  portugues: [
    { pergunta: 'Qual é o plural de "pão"?', alternativas: ['pãos', 'pães', 'painões', 'páis'], correta: 1, explicacao: 'A maioria das palavras terminadas em ão faz plural em ões, mas "pão" faz "pães".', dificuldade: 'facil' },
    { pergunta: 'Qual é a forma correta: "eles ..."?', alternativas: ['fizero', 'fizeram', 'fazem', 'fez'], correta: 1, explicacao: '"Eles fizeram" é a forma correta no pretérito perfeito.', dificuldade: 'medio' },
    { pergunta: 'Qual destas palavras é um substantivo?', alternativas: ['Bonito', 'Coragem', 'Rapidamente', 'Cantando'], correta: 1, explicacao: '"Coragem" é substantivo; "bonito" é adjetivo, "rapidamente" é advérbio e "cantando" é verbo no gerúndio.', dificuldade: 'facil' }
  ],
  matematica: [
    { pergunta: 'Quantos lados tem um hexágono?', alternativas: ['4', '5', '6', '7'], correta: 2, explicacao: 'Hexágono = hex (seis) + gono (ângulo): seis lados.', dificuldade: 'facil' },
    { pergunta: 'Qual é o resultado de 7 x 8?', alternativas: ['48', '54', '56', '64'], correta: 2, explicacao: '7 x 8 = 56.', dificuldade: 'facil' },
    { pergunta: 'Qual é o único número primo par?', alternativas: ['0', '1', '2', '4'], correta: 2, explicacao: 'O único primo par é o 2; todo outro par é divisível por 2.', dificuldade: 'medio' }
  ],
  brasil: [
    { pergunta: 'Qual é a capital do Brasil?', alternativas: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador'], correta: 2, explicacao: 'Brasília é a capital federal desde 1960.', dificuldade: 'facil' },
    { pergunta: 'Quem foi o primeiro presidente do Brasil?', alternativas: ['Deodoro da Fonseca', 'Getúlio Vargas', 'Juscelino Kubitschek', 'Washington Luís'], correta: 0, explicacao: 'Deodoro da Fonseca assumiu após a Proclamação da República, em 1889.', dificuldade: 'medio' },
    { pergunta: 'Qual é o idioma oficial do Brasil?', alternativas: ['Espanhol', 'Português', 'Inglês', 'Tupi-guarani'], correta: 1, explicacao: 'O português é o idioma oficial do Brasil.', dificuldade: 'facil' }
  ],
  logica: [
    { pergunta: 'Qual número completa a sequência: 2, 4, 6, ...?', alternativas: ['7', '8', '9', '10'], correta: 1, explicacao: 'A sequência soma 2 a cada termo: 2, 4, 6, 8.', dificuldade: 'facil' },
    { pergunta: 'Se A > B e B > C, então:', alternativas: ['A < C', 'A > C', 'A = C', 'É impossível saber'], correta: 1, explicacao: 'Pela transitividade, se A > B e B > C, então A > C.', dificuldade: 'medio' },
    { pergunta: 'Quantas pernas têm 2 cachorros e 3 gatos?', alternativas: ['16', '18', '20', '24'], correta: 2, explicacao: '5 animais x 4 pernas = 20 pernas.', dificuldade: 'medio' }
  ]
};

// Monta o prompt para o modelo. Pede JSON estrito em pt-BR.
function montarPrompt(tema, categoria, dificuldade, quantidade) {
  return 'Você é um especialista em criar quizzes educativos em português do Brasil. ' +
    'Gere exatamente ' + quantidade + ' perguntas de quiz sobre "' + tema + '" ' +
    '(categoria: ' + categoria + ', dificuldade: ' + dificuldade + ').\n' +
    'Responda APENAS com um JSON válido, sem texto extra, no formato:\n' +
    '{"titulo":"<título sugestivo>","perguntas":[{"pergunta":"...","alternativas":["a","b","c","d"],"correta":<índice 0-3>,"explicacao":"...","dificuldade":"<facil|medio|dificil>"}]}\n' +
    'Regras: cada pergunta deve ter 4 alternativas; "correta" é o índice da alternativa certa (0 a 3); ' +
    'as respostas devem ser corretas e verificáveis; evite perguntas ambíguas.';
}

// Chamada ao Workers AI.
async function chamarWorkersAI(env, prompt) {
  const modelo = env.AI_MODEL || MODELO_PADRAO;
  const resposta = await env.AI.run(modelo, {
    messages: [
      { role: 'system', content: 'Você gera JSON válido, sem markdown e sem texto extra.' },
      { role: 'user', content: prompt }
    ]
  });
  return typeof resposta === 'string' ? resposta : (resposta && resposta.response) || '';
}

// Chamada a endpoint OpenAI-compatível (se configurado).
async function chamarOpenAICompativel(env, prompt) {
  const url = (env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '') + '/chat/completions';
  const apiKey = env.AI_API_KEY;
  if (!url || !apiKey) throw new Error('Provedor OpenAI-compatível não configurado.');
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify({
      model: env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você gera JSON válido, sem markdown e sem texto extra.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8
    })
  });
  if (!r.ok) throw new Error('Falha no provedor de IA: HTTP ' + r.status);
  const dados = await r.json();
  return (dados.choices && dados.choices[0] && dados.choices[0].message && dados.choices[0].message.content) || '';
}

// Extrai o primeiro objeto JSON do texto (robusto a markdown/código).
function extrairJSON(texto) {
  const t = String(texto || '');
  const ini = t.indexOf('{');
  const fim = t.lastIndexOf('}');
  if (ini < 0 || fim <= ini) return null;
  try {
    return JSON.parse(t.slice(ini, fim + 1));
  } catch (e) {
    return null;
  }
}

// Valida e normaliza o rascunho vindo da IA.
function normalizarRascunho(dados, categoria, dificuldade, quantidade) {
  if (!dados || typeof dados !== 'object') return null;
  const perguntas = Array.isArray(dados.perguntas) ? dados.perguntas : [];
  const rascunho = {
    titulo: String(dados.titulo || (categoria === 'geral' ? 'Quiz do dia (IA)' : 'Quiz de ' + categoria)).slice(0, 80),
    descricao: 'Gerado com IA sobre "' + String(dados.titulo || temaFallback(categoria)) + '".',
    categoria: categoria,
    dificuldade: dificuldade,
    perguntas: perguntas.slice(0, quantidade)
  };
  const validado = validarQuizQuizz(rascunho);
  if (!validado.ok) return null;
  return validado.valor;
}

function temaFallback(cat) {
  const nomes = { geral: 'conhecimentos gerais', ciencia: 'ciência', geografia: 'geografia', historia: 'história', tecnologia: 'tecnologia', games: 'games', filmes: 'filmes', musica: 'música', esportes: 'esportes', portugues: 'português', matematica: 'matemática', brasil: 'Brasil', logica: 'lógica' };
  return nomes[cat] || 'conhecimentos gerais';
}

// Gera um rascunho a partir da IA (com fallback local garantido).
async function gerarRascunho(env, params) {
  const tema = String(params.tema || '').slice(0, 60);
  const categoria = params.categoria || 'geral';
  const dificuldade = params.dificuldade || 'medio';
  const quantidade = Math.min(15, Math.max(3, Number(params.quantidade) || 5));

  const cat = validarCategoria(categoria);
  const categoriaOk = cat.ok ? cat.valor : 'geral';

  let rascunho = null;
  let provedor = null;

  if (env.AI) {
    try {
      const texto = await chamarWorkersAI(env, montarPrompt(tema, categoriaOk, dificuldade, quantidade));
      const dados = extrairJSON(texto);
      rascunho = normalizarRascunho(dados, categoriaOk, dificuldade, quantidade);
      if (rascunho) provedor = 'Workers AI';
    } catch (e) {
      console.error('[ai] Workers AI falhou:', e.message);
    }
  }

  if (!rascunho && env.AI_API_KEY && env.AI_BASE_URL) {
    try {
      const texto = await chamarOpenAICompativel(env, montarPrompt(tema, categoriaOk, dificuldade, quantidade));
      const dados = extrairJSON(texto);
      rascunho = normalizarRascunho(dados, categoriaOk, dificuldade, quantidade);
      if (rascunho) provedor = 'OpenAI-compatível';
    } catch (e) {
      console.error('[ai] OpenAI-compatível falhou:', e.message);
    }
  }

  if (!rascunho) {
    rascunho = rascunhoLocal(categoriaOk, quantidade);
    provedor = 'local (offline/sem créditos de IA)';
  }

  return { rascunho: rascunho, provedor: provedor };
}

// Gera rascunho a partir do banco local (garantia de funcionamento offline).
function rascunhoLocal(categoria, quantidade) {
  const pool = BANCO_LOCAL[categoria] || BANCO_LOCAL.geral;
  const perguntas = pool.slice(0, quantidade).map(function (p) {
    return {
      pergunta: p.pergunta,
      alternativas: p.alternativas,
      correta: p.correta,
      explicacao: p.explicacao,
      dificuldade: p.dificuldade || 'medio'
    };
  });
  return {
    titulo: 'Quiz de ' + temaFallback(categoria) + ' (rascunho)',
    descricao: 'Rascunho gerado pela plataforma. Revise as perguntas antes de salvar.',
    categoria: categoria,
    dificuldade: 'medio',
    perguntas: perguntas
  };
}

export { gerarRascunho, normalizarRascunho, extrairJSON, montarPrompt, PREFIXO_ID_LOCAL, MODELO_PADRAO };

export default { gerarRascunho, PREFIXO_ID_LOCAL };