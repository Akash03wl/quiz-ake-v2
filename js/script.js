/* ==========================================================
   QUIZ AKE - LÓGICA DO SITE (JavaScript)
   Este arquivo faz tudo funcionar. Está organizado em seções
   numeradas, cada uma com uma função clara.
   ========================================================== */

/* ------------------------------------------------------------
   1) CATEGORIAS DE QUIZZES
   Cada categoria tem: id, nome, emoji e uma cor de destaque.
   ------------------------------------------------------------ */
const CATEGORIAS = [
  { id: 'geral',      nome: 'Conhecimentos Gerais', emoji: '🧠', cor: '#7c6cf0' },
  { id: 'geografia',  nome: 'Geografia',            emoji: '🌎', cor: '#2aa1d9' },
  { id: 'historia',   nome: 'História',             emoji: '📜', cor: '#e0a33a' },
  { id: 'ciencia',    nome: 'Ciência',              emoji: '🔬', cor: '#35c08a' },
  { id: 'esportes',   nome: 'Esportes',             emoji: '⚽', cor: '#e05a4f' },
  { id: 'games',      nome: 'Games',                emoji: '🎮', cor: '#9b6cf0' },
  { id: 'filmes',     nome: 'Filmes e Séries',      emoji: '🎬', cor: '#d94b6f' },
  { id: 'musica',     nome: 'Música',               emoji: '🎵', cor: '#e04b9b' },
  { id: 'tecnologia', nome: 'Tecnologia',           emoji: '💻', cor: '#4aa8ff' },
  { id: 'portugues',  nome: 'Português',            emoji: '📚', cor: '#8fa83c' },
  { id: 'matematica', nome: 'Matemática',           emoji: '➗', cor: '#e0a33a' },
  { id: 'brasil',     nome: 'Brasil',               emoji: '🇧🇷', cor: '#2fc05f' },
  { id: 'logica',     nome: 'Lógica',               emoji: '🧩', cor: '#6366f1' }
];

/* ============================================================
   2) BANCO DE PERGUNTAS
   Cada pergunta tem:
   - categoria     : a categoria a que pertence
   - pergunta      : o texto
   - alternativas  : opções de resposta
   - correta       : posição (índice) da resposta certa
   - valor         : peso de pontos (1 = normal, 2/3 = prêmio)
   ============================================================ */
const BANCO_DE_PERGUNTAS = [
  // --- Ciência / Natureza ---
  { categoria: 'ciencia', pergunta: "Qual é o maior planeta do Sistema Solar?", alternativas: ["Terra", "Júpiter", "Saturno", "Marte"], correta: 1, valor: 1 },
  { categoria: 'ciencia', pergunta: "Qual é o símbolo químico do ouro?", alternativas: ["Au", "Ag", "Fe", "O"], correta: 0, valor: 1 },
  { categoria: 'ciencia', pergunta: "Qual gás os seres humanos respiram para sobreviver?", alternativas: ["Oxigênio", "Hidrogênio", "Gás carbônico", "Hélio"], correta: 0, valor: 1 },
  { categoria: 'ciencia', pergunta: "Qual destes animais é um mamífero?", alternativas: ["Tubarão", "Golfinho", "Polvo", "Tartaruga"], correta: 1, valor: 2 },
  { categoria: 'ciencia', pergunta: "Quantos ossos tem (aprox.) o corpo humano adulto?", alternativas: ["106", "206", "306", "406"], correta: 1, valor: 1 },
  { categoria: 'ciencia', pergunta: "O que a fotossíntese produz nas plantas?", alternativas: ["Oxigênio", "Carbono", "Nitrogênio", "Hidrogênio"], correta: 0, valor: 1 },
  { categoria: 'ciencia', pergunta: "Quantos estados físicos básicos da matéria existem?", alternativas: ["2", "3", "4", "5"], correta: 1, valor: 3 },

  // --- Geografia ---
  { categoria: 'geografia', pergunta: "Qual é o maior oceano do mundo?", alternativas: ["Atlântico", "Índico", "Pacífico", "Ártico"], correta: 2, valor: 1 },
  { categoria: 'geografia', pergunta: "Qual é a capital da França?", alternativas: ["Londres", "Paris", "Roma", "Berlim"], correta: 1, valor: 1 },
  { categoria: 'geografia', pergunta: "Qual é o maior país do mundo em território?", alternativas: ["China", "EUA", "Brasil", "Rússia"], correta: 3, valor: 1 },
  { categoria: 'geografia', pergunta: "Quantos continentes existem no planeta?", alternativas: ["5", "6", "7", "8"], correta: 2, valor: 1 },
  { categoria: 'geografia', pergunta: "Em que continente fica o Egito?", alternativas: ["Ásia", "África", "Europa", "América"], correta: 1, valor: 1 },
  { categoria: 'geografia', pergunta: "Qual o maior deserto (não polar) do mundo?", alternativas: ["Saara", "Gobi", "Kalahari", "Atacama"], correta: 0, valor: 2 },
  { categoria: 'geografia', pergunta: "Qual planeta é conhecido como 'Planeta Vermelho'?", alternativas: ["Vênus", "Marte", "Mercúrio", "Netuno"], correta: 1, valor: 1 },

  // --- História ---
  { categoria: 'historia', pergunta: "Quando o homem pisou na Lua pela primeira vez?", alternativas: ["1965", "1969", "1972", "1979"], correta: 1, valor: 2 },
  { categoria: 'historia', pergunta: "Em qual ano o Brasil comemorou 500 anos de descobrimento?", alternativas: ["1998", "2000", "2002", "2005"], correta: 1, valor: 3 },
  { categoria: 'historia', pergunta: "Quem pintou a Mona Lisa?", alternativas: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo"], correta: 2, valor: 2 },
  { categoria: 'historia', pergunta: "Qual país conquistou a primeira Copa do Mundo de futebol?", alternativas: ["Brasil", "Itália", "Uruguai", "Argentina"], correta: 2, valor: 1 },

  // --- Esportes ---
  { categoria: 'esportes', pergunta: "Quantos jogadores compõem um time de futebol em campo?", alternativas: ["9", "10", "11", "12"], correta: 2, valor: 1 },
  { categoria: 'esportes', pergunta: "Em que país surgiram as Olimpíadas da era moderna?", alternativas: ["França", "Grécia", "Itália", "EUA"], correta: 1, valor: 2 },
  { categoria: 'esportes', pergunta: "Qual piloto tem mais títulos de Fórmula 1?", alternativas: ["Schumacher", "Hamilton", "Senna", "Verstappen"], correta: 1, valor: 3 },

  // --- Games ---
  { categoria: 'games', pergunta: "Quem é o criador do Super Mario?", alternativas: ["Shigeru Miyamoto", "Hideo Kojima", "Gabe Newell", "John Carmack"], correta: 0, valor: 2 },
  { categoria: 'games', pergunta: "Qual jogo é famoso por construir com blocos?", alternativas: ["Tetris", "Pac-Man", "Minecraft", "Angry Birds"], correta: 2, valor: 1 },
  { categoria: 'games', pergunta: "Qual é o protagonista do Resident Evil 1?", alternativas: ["Chris Redfield", "Jill Valentine", "Albert Wesker", "Barry Burton"], correta: 0, valor: 3 },

  // --- Filmes e Séries ---
  { categoria: 'filmes', pergunta: "Qual saga de filmes tem o personagem Darth Vader?", alternativas: ["Senhor dos Anéis", "Star Wars", "Harry Potter", "Jurassic Park"], correta: 1, valor: 1 },
  { categoria: 'filmes', pergunta: "Quem interpretou Tony Stark no cinema?", alternativas: ["Chris Evans", "Robert Downey Jr.", "Chris Hemsworth", "Scarlett Johansson"], correta: 1, valor: 2 },
  { categoria: 'filmes', pergunta: "Qual filme tem a frase 'Que a força esteja com você'?", alternativas: ["Star Trek", "Star Wars", "Guardiões da Galáxia", "Matrix"], correta: 1, valor: 1 },

  // --- Música ---
  { categoria: 'musica', pergunta: "Qual artista é conhecido como o 'Rei do Pop'?", alternativas: ["Elvis Presley", "Freddie Mercury", "Michael Jackson", "Bob Dylan"], correta: 2, valor: 1 },
  { categoria: 'musica', pergunta: "Qual é a nacionalidade de Beethoven?", alternativas: ["Francês", "Alemão", "Italiano", "Austríaco"], correta: 1, valor: 1 },

  // --- Tecnologia ---
  { categoria: 'tecnologia', pergunta: "Qual destes é um navegador de internet?", alternativas: ["Photoshop", "Chrome", "Windows", "Word"], correta: 1, valor: 1 },
  { categoria: 'tecnologia', pergunta: "O que significa HTML?", alternativas: ["Hiper Texto de Marcas", "Linguagem de Marcação de Hipertexto", "Linguagem de Máquina Total", "Hora de Melhorar os Textos"], correta: 1, valor: 3 },
  { categoria: 'tecnologia', pergunta: "Qual destes é um sistema operacional?", alternativas: ["Linux", "Intel", "NVIDIA", "RAM"], correta: 0, valor: 2 },

  // --- Português ---
  { categoria: 'portugues', pergunta: "Qual é o plural de 'pão'?", alternativas: ["pãos", "pães", "painçes", "pãis"], correta: 1, valor: 1 },
  { categoria: 'portugues', pergunta: "Qual é o correto: 'eles ...'?", alternativas: ["fizero", "fizeram", "fazem", "fez"], correta: 1, valor: 2 },
  { categoria: 'portugues', pergunta: "Quantas letras tem a palavra 'paralelepípedo'?", alternativas: ["11", "12", "13", "14"], correta: 2, valor: 1 },

  // --- Matemática ---
  { categoria: 'matematica', pergunta: "Quantos lados tem um hexágono?", alternativas: ["4", "5", "6", "7"], correta: 2, valor: 1 },
  { categoria: 'matematica', pergunta: "Qual é o resultado de 7 x 8?", alternativas: ["48", "54", "56", "64"], correta: 2, valor: 1 },
  { categoria: 'matematica', pergunta: "Qual é o único número primo par?", alternativas: ["0", "1", "2", "4"], correta: 2, valor: 2 },
  { categoria: 'matematica', pergunta: "Quanto é a raiz quadrada de 144?", alternativas: ["10", "11", "12", "14"], correta: 2, valor: 1 },

  // --- Brasil ---
  { categoria: 'brasil', pergunta: "Qual é a capital do Brasil?", alternativas: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"], correta: 2, valor: 1 },
  { categoria: 'brasil', pergunta: "Quem foi o primeiro presidente do Brasil?", alternativas: ["Getúlio Vargas", "Deodoro da Fonseca", "Juscelino Kubitschek", "Washington Luís"], correta: 1, valor: 1 },
  { categoria: 'brasil', pergunta: "Qual cidade foi a primeira capital do Brasil (1500)?", alternativas: ["Salvador", "Rio de Janeiro", "Recife", "São Paulo"], correta: 0, valor: 2 },

  // --- Lógica ---
  { categoria: 'logica', pergunta: "Qual número completa a sequência: 2, 4, 6, ...?", alternativas: ["7", "8", "9", "10"], correta: 1, valor: 1 },
  { categoria: 'logica', pergunta: "Se A > B e B > C, então:", alternativas: ["A < C", "A > C", "A = C", "Impossível saber"], correta: 1, valor: 2 },
  { categoria: 'logica', pergunta: "Quantas pernas têm 2 cachorros e 3 gatos?", alternativas: ["16", "18", "20", "24"], correta: 2, valor: 3 }
];

/* ============================================================
   3) CONFIGURAÇÕES DO JOGO
   ============================================================ */
const TEMPO_POR_PERGUNTA = 20;   // segundos por pergunta
const QUANTAS_PERGUNTAS = 10;    // total de perguntas por partida
const PONTOS_CERTA = 10;         // pontos base ao acertar
const BONUS_COMBO = 5;           // bônus por acerto em sequência
const META_XP = 100;             // XP necessária para subir de nível

/* ============================================================
   4) MAPA DE TELAS (cada <main> da página)
   ============================================================ */
const TELAS = {
  inicio: 'tela-inicio',
  quizzes: 'tela-quizzes',
  quiz: 'tela-quiz',
  resultado: 'tela-resultado',
  ranking: 'tela-ranking',
  conquistas: 'tela-conquistas',
  perfil: 'tela-perfil'
};

/* ============================================================
   5) VARIÁVEIS DE ESTADO DO JOGO
   ============================================================ */
let perguntasSorteio = [];   // perguntas da partida atual
let indiceAtual = 0;         // qual pergunta estamos
let pontuacao = 0;           // total de pontos
let sequenciaCerta = 0;      // acertos seguidos (combo)
let maiorCombo = 0;          // maior combo da partida
let acertos = 0;             // total de acertos
let erros = 0;               // total de erros
let respondeu = false;       // evita clicar 2x na mesma pergunta
let categoriaAtual = 'geral';// categoria em jogo
let tempoRestante = 0;       // segundos que faltam
let cronometro = null;       // guarda o setInterval do cronômetro
let tempoTotalUsado = 0;     // soma do tempo usado nas perguntas

/* ============================================================
   6) REFERÊNCIA AOS ELEMENTOS DA PÁGINA
   ============================================================ */
const el = {
  // Home / hero
  heroTotalQuiz: document.getElementById('hero-total-perguntas'),
  heroTotalCat: document.getElementById('hero-total-categorias'),
  destaques: document.getElementById('destaques-grade'),
  categorias: document.getElementById('categorias-grade'),
  categoriasFull: document.getElementById('categorias-grade-full'),
  statsVazio: document.getElementById('stats-estado-vazio'),
  gradeStats: document.getElementById('grade-stats'),
  rankingResumo: document.getElementById('ranking-resumo'),
  rankingCompleto: document.getElementById('ranking-completo'),
  conquistas: document.getElementById('conquistas-grade'),
  perfilStats: document.getElementById('perfil-stats'),
  perfilNivel: document.getElementById('perfil-nivel'),
  perfilXp: document.getElementById('perfil-xp'),
  barraXp: document.getElementById('barra-xp'),

  // Quiz
  textoProgresso: document.getElementById('texto-progresso'),
  barraProgresso: document.getElementById('barra-progresso'),
  chipCombo: document.getElementById('chip-combo'),
  numeroSeq: document.getElementById('sequencia'),
  chipPremio: document.getElementById('chip-premio'),
  numTimer: document.getElementById('numero-timer'),
  barraTimer: document.getElementById('barra-timer'),
  seloBonus: document.getElementById('selo-bonus'),
  numeroPergunta: document.getElementById('numero-pergunta'),
  textoPergunta: document.getElementById('texto-pergunta'),
  areaRespostas: document.getElementById('area-respostas'),
  pontuacao: document.getElementById('pontuacao'),
  acertosTela: document.getElementById('acertos'),
  errosTela: document.getElementById('erros'),

  // Resultado
  emojiResultado: document.getElementById('emoji-resultado'),
  tituloResultado: document.getElementById('titulo-resultado'),
  subtituloResultado: document.getElementById('subtitulo-resultado'),
  pontuacaoFinal: document.getElementById('pontuacao-final'),
  melhorPontuacao: document.getElementById('melhor-pontuacao'),
  rAcertos: document.getElementById('resultado-acertos'),
  rErros: document.getElementById('resultado-erros'),
  rPercentual: document.getElementById('resultado-percentual'),
  rCombo: document.getElementById('resultado-combo'),
  rTempo: document.getElementById('resultado-tempo'),
  rXp: document.getElementById('resultado-xp')
};

/* ============================================================
   7) ARMAZENAMENTO LOCAL (localStorage)
   Guarda: recorde, XP, estatísticas, ranking, conquistas e tema.
   ============================================================ */
const CHAVE = {
  recorde: 'quizAKE_recorde',
  xp: 'quizAKE_xp',
  stats: 'quizAKE_stats',
  ranking: 'quizAKE_ranking',
  conquistas: 'quizAKE_conquistas',
  tema: 'quizAKE_tema'
};

function lerTexto(chave) {
  try { return localStorage.getItem(chave); } catch (e) { return null; }
}

function gravarTexto(chave, valor) {
  try { localStorage.setItem(chave, valor); } catch (e) {}
}

function lerNumero(chave) {
  const v = lerTexto(chave);
  return v === null ? 0 : Number(v);
}

function lerLista(chave) {
  const v = lerTexto(chave);
  if (v === null) return [];
  try { return JSON.parse(v); } catch (e) { return []; }
}

function lerRecorde() {
  return lerNumero(CHAVE.recorde);
}

/* ============================================================
   8) SISTEMA DE TEMAS (escuro, claro e sistema)
   ============================================================ */
const TEMAS = ['dark', 'light', 'system'];
const ICONES_TEMA = { dark: '🌙', light: '☀️', system: '🖥️' };

function temaAtual() {
  const t = lerTexto(CHAVE.tema);
  return TEMAS.includes(t) ? t : 'system';
}

function aplicarTema() {
  const t = temaAtual();
  document.documentElement.setAttribute('data-theme', t);
  const botao = document.getElementById('botao-tema');
  botao.textContent = ICONES_TEMA[t];
  botao.setAttribute('aria-label', 'Tema atual: ' + t + '. Clique para alternar');
}

function alternarTema() {
  const ordem = ['dark', 'light', 'system'];
  const atual = temaAtual();
  const proximo = ordem[(ordem.indexOf(atual) + 1) % ordem.length];
  gravarTexto(CHAVE.tema, proximo);
  aplicarTema();
}

/* ============================================================
   9) NAVEGAÇÃO ENTRE TELAS
   ============================================================ */
function mostrarTela(nomeTela) {
  const id = TELAS[nomeTela] || TELAS.inicio;

  // Esconde todos os <main> (telas)
  document.querySelectorAll('main.tela').forEach(function (main) {
    main.classList.add('hidden');
  });

  // Mostra a tela pedida
  const alvo = document.getElementById(id);
  if (alvo) alvo.classList.remove('hidden');

  // Atualiza o link ativo do menu
  document.querySelectorAll('.nav-link').forEach(function (link) {
    const alvoLink = link.getAttribute('data-navegar');
    link.classList.toggle('active', alvoLink === nomeTela);
  });

  // Fecha o menu mobile e sobe ao topo
  fecharMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function iniciarNavegacao() {
  // Links do menu e botões com data-navegar
  document.querySelectorAll('[data-navegar]').forEach(function (elem) {
    elem.addEventListener('click', function (ev) {
      ev.preventDefault();
      const alvo = this.getAttribute('data-navegar');
      if (alvo === 'quiz-dia') { entrarQuiz('geral'); return; }
      mostrarTela(alvo);
      if (alvo === 'quizzes') renderizarCategorias();
      if (alvo === 'ranking') renderizarRanking();
      if (alvo === 'conquistas') renderizarConquistas();
      if (alvo === 'perfil') renderizarPerfil();
    });
  });

  // Botões "Começar" (navbar e hero) iniciam um quiz geral
  document.getElementById('botao-comecar').addEventListener('click', function () {
    entrarQuiz('geral');
  });
  document.getElementById('botao-jogar-hero').addEventListener('click', function () {
    entrarQuiz('geral');
  });

  // Botão "Jogar novamente" na tela de resultado
  document.getElementById('botao-reiniciar').addEventListener('click', function () {
    entrarQuiz(categoriaAtual);
  });

  // Botão do tema
  document.getElementById('botao-tema').addEventListener('click', alternarTema);
}

/* ============================================================
   10) MENU MOBILE (hambúrguer)
   ============================================================ */
function iniciarMenuMobile() {
  const botao = document.getElementById('menu-toggle');
  const nav = document.getElementById('nav-links');

  botao.addEventListener('click', function () {
    const abrir = nav.classList.toggle('aberto');
    botao.setAttribute('aria-expanded', abrir);
  });
}

function fecharMenu() {
  const nav = document.getElementById('nav-links');
  nav.classList.remove('aberto');
  document.getElementById('menu-toggle').setAttribute('aria-expanded', 'false');
}

/* ============================================================
   11) RENDERIZAR CATEGORIAS
   ============================================================ */
function contarPerguntas(categoriaId) {
  if (categoriaId === 'geral') return BANCO_DE_PERGUNTAS.length;
  return BANCO_DE_PERGUNTAS.filter(function (p) {
    return p.categoria === categoriaId;
  }).length;
}

function criarCardCategoria(cat) {
  const div = document.createElement('div');
  const total = contarPerguntas(cat.id);
  const disponivel = total > 0;

  div.className = 'card-quiz';
  div.style.setProperty('--cor-categoria', cat.cor);
  div.setAttribute('role', 'button');
  div.setAttribute('tabindex', '0');
  div.setAttribute('aria-label', 'Categoria ' + cat.nome + (disponivel ? ' com ' + total + ' perguntas' : ' em breve'));

  div.innerHTML =
    '<span class="icone">' + (disponivel ? cat.emoji : '🔒') + '</span>' +
    '<span class="nome">' + cat.nome + '</span>' +
    '<span class="meta">' + (disponivel ? total + ' perguntas' : 'Em breve') + '</span>';

  if (!disponivel) {
    div.style.opacity = '0.5';
    div.style.cursor = 'not-allowed';
    return div;
  }

  // Só permite abrir se houver perguntas
  function abrir() { entrarQuiz(cat.id); }
  div.addEventListener('click', abrir);
  div.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      abrir();
    }
  });

  return div;
}

function renderizarCategorias() {
  el.categorias.innerHTML = '';
  el.categoriasFull.innerHTML = '';
  CATEGORIAS.forEach(function (cat) {
    el.categorias.appendChild(criarCardCategoria(cat));
    el.categoriasFull.appendChild(criarCardCategoria(cat));
  });
}

/* ============================================================
   12) RENDERIZAR DESTAQUES (quiz do dia, populares, recomendados)
   ============================================================ */
function renderizarDestaques() {
  const grade = el.destaques;
  grade.innerHTML = '';

  const destaques = [
    { cat: 'geral',     rotulo: '⭐ Quiz do dia',     desc: 'Perguntas variadas de todas as áreas.' },
    { cat: 'geografia', rotulo: '🔥 Populares',      desc: 'A categoria mais jogada por aqui.' },
    { cat: 'ciencia',   rotulo: '✨ Recomendados',   desc: 'Ideal para quem ama descobertas.' }
  ];

  destaques.forEach(function (d) {
    const cat = CATEGORIAS.find(function (c) { return c.id === d.cat; });
    if (!cat) return;

    const div = document.createElement('div');
    div.className = 'card-quiz';
    div.style.setProperty('--cor-categoria', cat.cor);
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.innerHTML =
      '<span class="icone">' + cat.emoji + '</span>' +
      '<span class="nome">' + cat.nome + '</span>' +
      '<span class="meta">' + d.rotulo + ' · ' + d.desc + '</span>';

    function abrir() { entrarQuiz(d.cat); }
    div.addEventListener('click', abrir);
    div.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        abrir();
      }
    });

    grade.appendChild(div);
  });
}

/* ============================================================
   13) ESTATÍSTICAS (home + perfil)
   ============================================================ */
function carregarStats() {
  return lerLista(CHAVE.stats);
}

function salvarStats(stats) {
  gravarTexto(CHAVE.stats, JSON.stringify(stats));
}

function renderizarEstatisticas() {
  const stats = carregarStats();
  el.statsVazio.innerHTML = '';
  el.gradeStats.innerHTML = '';

  const jogos = stats.jogos || 0;

  if (jogos === 0) {
    el.statsVazio.innerHTML =
      '<span class="emoji">🎯</span>' +
      '<p><strong>Você ainda não jogou!</strong><br>Complete um quiz para ver suas estatísticas por aqui.</p>';
    return;
  }

  const acertosTotal = stats.acertos || 0;
  const errosTotal = stats.erros || 0;
  const respondidas = acertosTotal + errosTotal;
  const taxa = respondidas > 0 ? Math.round((acertosTotal / respondidas) * 100) : 0;

  const cards = [
    { valor: jogos, rotulo: 'Quizzes realizados' },
    { valor: respondidas, rotulo: 'Perguntas respondidas' },
    { valor: taxa + '%', rotulo: 'Taxa de acerto' },
    { valor: lerRecorde(), rotulo: 'Melhor pontuação' }
  ];

  cards.forEach(function (c) {
    const div = document.createElement('div');
    div.className = 'stat-card';
    div.innerHTML = '<span class="stat-valor">' + c.valor + '</span><span class="stat-rotulo">' + c.rotulo + '</span>';
    el.gradeStats.appendChild(div);
  });
}

function renderizarPerfil() {
  const stats = carregarStats();
  const jogos = stats.jogos || 0;
  const xpTotal = lerNumero(CHAVE.xp);
  const nivel = Math.floor(xpTotal / META_XP) + 1;
  const xpNoNivel = xpTotal % META_XP;

  el.perfilNivel.textContent = nivel;
  el.perfilXp.textContent = xpTotal + ' XP';
  el.barraXp.style.width = (xpNoNivel / META_XP) * 100 + '%';
  el.barraXp.setAttribute('aria-label', 'XP do nível: ' + xpNoNivel + ' de ' + META_XP);

  el.perfilStats.innerHTML = '';

  const acertosTotal = stats.acertos || 0;
  const errosTotal = stats.erros || 0;
  const respondidas = acertosTotal + errosTotal;
  const taxa = respondidas > 0 ? Math.round((acertosTotal / respondidas) * 100) : 0;

  const cards = [
    ['🎮', jogos, 'Jogos'],
    ['❓', respondidas, 'Perguntas'],
    ['✅', taxa + '%', 'Acerto'],
    ['🏆', lerRecorde(), 'Recorde']
  ];

  cards.forEach(function (c) {
    const div = document.createElement('div');
    div.className = 'stat-card';
    div.innerHTML = '<span class="stat-valor">' + c[1] + '</span><span class="stat-rotulo">' + c[2] + '</span>';
    el.perfilStats.appendChild(div);
  });
}

/* ============================================================
   14) RANKING (resumo na home + página completa)
   ============================================================ */
function renderizarRanking() {
  const lista = lerLista(CHAVE.ranking);
  const resumo = el.rankingResumo;
  const completo = el.rankingCompleto;

  resumo.innerHTML = '';
  completo.innerHTML = '';

  if (lista.length === 0) {
    const vazio =
      '<div class="estado-vazio"><span class="emoji">🏆</span>' +
      '<p><strong>Nenhum registro ainda.</strong><br>Jogue uma partida para entrar no ranking.</p></div>';
    resumo.innerHTML = vazio;
    completo.innerHTML = vazio;
    return;
  }

  const medalhas = ['🥇', '🥈', '🥉'];
  const itens = lista.map(function (entry, i) {
    const medalha = medalhas[i] || (i + 1) + 'º';
    return '<li><span class="pos">' + medalha + '</span>' +
      '<span class="nome">' + entry.data + '</span>' +
      '<span class="pts">' + entry.pontos + ' pts</span></li>';
  });

  resumo.innerHTML = '<ul class="lista-ranking">' + itens.slice(0, 3).join('') + '</ul>';
  completo.innerHTML = '<ul class="lista-ranking">' + itens.slice(0, 10).join('') + '</ul>';
}

/* ============================================================
   15) CONQUISTAS
   ============================================================ */
const CONQUISTAS_DEF = [
  { id: 'primeiro',  nome: 'Primeira partida', desc: 'Complete seu primeiro quiz', icone: '🎯' },
  { id: 'pontos100', nome: 'Centenário',       desc: 'Faça 100 pontos em uma partida', icone: '💯' },
  { id: 'combo5',    nome: 'Fogoso',           desc: 'Atinga 5 acertos seguidos', icone: '🔥' },
  { id: 'acertoTotal', nome: 'Perfeição',      desc: 'Conclua com 100% de acerto', icone: '⭐' },
  { id: 'recorde',   nome: 'Recordista',       desc: 'Bata seu próprio recorde', icone: '🏅' },
  { id: 'cincoJogos', nome: 'Veterano',        desc: 'Jogue pelo menos 5 partidas', icone: '🎮' }
];

function renderizarConquistas() {
  const grade = el.conquistas;
  const ganhas = lerLista(CHAVE.conquistas);
  grade.innerHTML = '';

  CONQUISTAS_DEF.forEach(function (conq) {
    const desbloqueada = ganhas.includes(conq.id);
    const div = document.createElement('div');
    div.className = 'conquista' + (desbloqueada ? '' : ' bloqueada');
    div.innerHTML =
      '<div class="icone">' + (desbloqueada ? conq.icone : '🔒') + '</div>' +
      '<div class="nome">' + conq.nome + '</div>' +
      '<div class="desc">' + conq.desc + '</div>' +
      '<div class="desc">' + (desbloqueada ? '✅ Desbloqueada' : 'Bloqueada') + '</div>';
    grade.appendChild(div);
  });
}

function desbloquearConquista(id) {
  const lista = lerLista(CHAVE.conquistas);
  if (!lista.includes(id)) {
    lista.push(id);
    gravarTexto(CHAVE.conquistas, JSON.stringify(lista));
  }
}

function checarConquistas(dados) {
  desbloquearConquista('primeiro');
  if (dados.pontos >= 100) desbloquearConquista('pontos100');
  if (dados.maiorCombo >= 5) desbloquearConquista('combo5');
  if (dados.percentual === 100) desbloquearConquista('acertoTotal');
  if (dados.novoRecorde) desbloquearConquista('recorde');
  if ((carregarStats().jogos || 0) >= 5) desbloquearConquista('cincoJogos');
}

/* ============================================================
   16) MOTOR DO QUIZ

   Fluxo:
     entrarQuiz()     -> sorteia e inicia
     mostrarPergunta() -> mostra pergunta + timer
     responder()      -> valida o clique
     tempoEsgotado()  -> quando o cronômetro chega a 0
     proximaPergunta() -> avança com pequena pausa
     finalizarQuiz()  -> calcula tudo e mostra o resultado
   ============================================================ */

/* Filtra as perguntas da categoria e embaralha */
function entrarQuiz(categoriaId) {
  categoriaAtual = categoriaId;

  let pool = BANCO_DE_PERGUNTAS;
  if (categoriaId !== 'geral') {
    pool = BANCO_DE_PERGUNTAS.filter(function (q) { return q.categoria === categoriaId; });
  }
  if (pool.length === 0) return; // categoria indisponível

  // Embaralha (Fisher-Yates)
  const embaralhadas = pool.slice();
  for (let i = embaralhadas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const troca = embaralhadas[i];
    embaralhadas[i] = embaralhadas[j];
    embaralhadas[j] = troca;
  }

  perguntasSorteio = embaralhadas.slice(0, QUANTAS_PERGUNTAS);

  // Zera contadores
  indiceAtual = 0;
  pontuacao = 0;
  sequenciaCerta = 0;
  maiorCombo = 0;
  acertos = 0;
  erros = 0;
  tempoTotalUsado = 0;

  el.pontuacao.textContent = '0';
  el.acertosTela.textContent = '0';
  el.errosTela.textContent = '0';
  el.chipCombo.style.display = 'none';

  mostrarTela('quiz');
  mostrarPergunta();
}

/* Mostra a pergunta atual e inicia o cronômetro */
function mostrarPergunta() {
  pararTimer();

  const pergunta = perguntasSorteio[indiceAtual];
  const total = perguntasSorteio.length;

  el.textoProgresso.textContent = 'Pergunta ' + (indiceAtual + 1) + ' de ' + total;
  el.numeroPergunta.textContent = 'Pergunta ' + (indiceAtual + 1);

  const concluido = (indiceAtual / total) * 100;
  el.barraProgresso.style.width = concluido + '%';

  // Selo de pergunta prêmio
  if (pergunta.valor > 1) {
    el.seloBonus.classList.remove('hidden');
    el.chipPremio.classList.remove('hidden');
    el.chipPremio.textContent = '⭐ x' + pergunta.valor;
  } else {
    el.seloBonus.classList.add('hidden');
    el.chipPremio.classList.add('hidden');
  }

  el.textoPergunta.textContent = pergunta.pergunta;

  // Cria os botões de resposta
  el.areaRespostas.innerHTML = '';
  for (let i = 0; i < pergunta.alternativas.length; i++) {
    const botao = document.createElement('button');
    botao.className = 'answer-btn';
    botao.textContent = pergunta.alternativas[i];
    botao.addEventListener('click', function () { responder(i, botao, pergunta.valor); });
    el.areaRespostas.appendChild(botao);
  }

  respondeu = false;
  iniciarTimer();
}

/* Cronômetro: conta de 20 até 0, atualizando a cada segundo */
function iniciarTimer() {
  pararTimer();

  tempoRestante = TEMPO_POR_PERGUNTA;
  el.numTimer.textContent = tempoRestante;

  el.barraTimer.style.width = '100%';
  el.numTimer.classList.remove('warning', 'danger');
  el.barraTimer.style.background = 'var(--ok)';

  cronometro = setInterval(function () {
    tempoRestante--;
    el.numTimer.textContent = tempoRestante;

    const porcentagem = (tempoRestante / TEMPO_POR_PERGUNTA) * 100;
    el.barraTimer.style.width = porcentagem + '%';

    if (tempoRestante <= 5) {
      el.numTimer.classList.add('danger');
      el.barraTimer.style.background = 'var(--erro)';
    } else if (tempoRestante <= 9) {
      el.numTimer.classList.add('warning');
      el.barraTimer.style.background = 'var(--aviso)';
    } else {
      el.barraTimer.style.background = 'var(--ok)';
    }

    if (tempoRestante <= 0) {
      pararTimer();
      tempoEsgotado();
    }
  }, 1000);
}

function pararTimer() {
  if (cronometro !== null) {
    clearInterval(cronometro);
    cronometro = null;
  }
}

/* Quando o tempo acaba, conta como erro */
function tempoEsgotado() {
  if (respondeu) return;
  respondeu = true;

  erros++;
  el.errosTela.textContent = erros;

  // tempo usado = todo o tempo da pergunta
  tempoTotalUsado += TEMPO_POR_PERGUNTA;

  // Desabilita botões e marca a resposta certa
  const botoes = el.areaRespostas.querySelectorAll('.answer-btn');
  botoes.forEach(function (b) { b.disabled = true; });
  const indiceOk = perguntasSorteio[indiceAtual].correta;
  botoes[indiceOk].classList.add('correct');

  sequenciaCerta = 0;   // quebra combo
  el.chipCombo.style.display = 'none';
  el.numeroSeq.textContent = '0';

  tocarSom(false);
  mostrarMensagem('⏰ Tempo esgotado!', 'var(--erro)');

  proximaPergunta();
}

/* Quando o usuário clica em uma alternativa */
function responder(indiceClicado, botaoClicado, valorPergunta) {
  if (respondeu) return;
  respondeu = true;

  pararTimer();

  // tempo usado nesta pergunta
  const tempoUsado = TEMPO_POR_PERGUNTA - tempoRestante;
  tempoTotalUsado += tempoUsado;

  // Desabilita todos os botões
  const todosBotoes = el.areaRespostas.querySelectorAll('.answer-btn');
  todosBotoes.forEach(function (b) { b.disabled = true; });

  const pergunta = perguntasSorteio[indiceAtual];
  const certa = pergunta.correta;

  if (indiceClicado === certa) {
    // ---------- ACERTOU ----------
    botaoClicado.classList.add('correct');
    acertos++;
    el.acertosTela.textContent = acertos;

    sequenciaCerta++;
    if (sequenciaCerta > maiorCombo) maiorCombo = sequenciaCerta;
    el.chipCombo.style.display = 'inline-flex';
    el.numeroSeq.textContent = sequenciaCerta;

    // pontos = base + bônus do combo, multiplicado pelo valor
    const pontosBase = PONTOS_CERTA + (BONUS_COMBO * (sequenciaCerta - 1));
    const pontosGanhos = pontosBase * valorPergunta;
    pontuacao += pontosGanhos;
    el.pontuacao.textContent = pontuacao;

    tocarSom(true);
    criarConfete();

    const msg = valorPergunta > 1
      ? '+ ' + pontosGanhos + ' pts (x' + valorPergunta + ')'
      : '+ ' + pontosGanhos + ' pts';
    mostrarMensagem(msg, 'var(--ok)');

  } else {
    // ---------- ERROU ----------
    botaoClicado.classList.add('wrong');
    todosBotoes[certa].classList.add('correct'); // mostra a certa
    erros++;
    el.errosTela.textContent = erros;

    sequenciaCerta = 0; // quebra combo
    el.numeroSeq.textContent = '0';
    el.chipCombo.style.display = 'none';

    tocarSom(false);
    mostrarMensagem('✖ Errou', 'var(--erro)');
  }

  proximaPergunta();
}

/* Passa para a próxima pergunta ou finaliza o quiz */
function proximaPergunta() {
  setTimeout(function () {
    indiceAtual++;
    if (indiceAtual < perguntasSorteio.length) {
      mostrarPergunta();
    } else {
      finalizarQuiz();
    }
  }, 1500);
}

/* ============================================================
   17) FINAL DO QUIZ: calcula tudo e mostra o resultado
   ============================================================ */
function finalizarQuiz() {
  pararTimer();

  const total = perguntasSorteio.length;
  const percentual = Math.round((acertos / total) * 100);
  const tempoMedio = total > 0 ? Math.round(tempoTotalUsado / total) : 0;

  // Recorde
  const antes = lerRecorde();
  const novoRecorde = pontuacao > antes;
  if (novoRecorde) gravarTexto(CHAVE.recorde, pontuacao);

  // XP: acertos * 10 + maior combo * 6
  const xpGanho = acertos * 10 + maiorCombo * 6;
  const xpTotal = lerNumero(CHAVE.xp) + xpGanho;
  gravarTexto(CHAVE.xp, xpTotal);

  // Estatísticas gerais
  const stats = carregarStats();
  stats.jogos = (stats.jogos || 0) + 1;
  stats.acertos = (stats.acertos || 0) + acertos;
  stats.erros = (stats.erros || 0) + erros;
  salvarStats(stats);

  // Ranking (guarda as 5 melhores)
  const ranking = lerLista(CHAVE.ranking);
  ranking.push({ pontos: pontuacao, data: new Date().toLocaleDateString('pt-BR') });
  ranking.sort(function (a, b) { return b.pontos - a.pontos; });
  gravarTexto(CHAVE.ranking, JSON.stringify(ranking.slice(0, 5)));

  // Conquistas
  checarConquistas({ pontos: pontuacao, maiorCombo: maiorCombo, percentual: percentual, novoRecorde: novoRecorde });

  // Preenche a tela de resultado
  el.pontuacaoFinal.textContent = pontuacao + ' pontos';
  el.rAcertos.textContent = acertos;
  el.rErros.textContent = erros;
  el.rPercentual.textContent = percentual + '%';
  el.rCombo.textContent = 'x' + maiorCombo;
  el.rTempo.textContent = tempoMedio + 's';
  el.rXp.textContent = '+ ' + xpGanho;
  el.melhorPontuacao.textContent = '🏅 Melhor pontuação: ' + lerRecorde();

  // Perfil (emoji + título + subtítulo)
  let emoji, titulo, subtitulo;
  if (percentual === 100) {
    emoji = '🏆'; titulo = 'Perfeito!'; subtitulo = '100% de acerto, que gênio!' + (novoRecorde ? ' Novo recorde!' : '');
  } else if (acertos >= 8) {
    emoji = '🎉'; titulo = 'Excelente!'; subtitulo = 'Você arrasou!' + (novoRecorde ? ' Novo recorde!' : '');
  } else if (acertos >= 6) {
    emoji = '😄'; titulo = 'Muito bom!'; subtitulo = 'Continue treinando, você vai longe!';
  } else if (acertos >= 3) {
    emoji = '🙂'; titulo = 'Bom começo'; subtitulo = 'Esforço sempre ajuda!';
  } else {
    emoji = '💪'; titulo = 'Não desista'; subtitulo = 'Todo mestre já foi iniciante. Tente de novo!';
  }

  el.emojiResultado.textContent = emoji;
  el.tituloResultado.textContent = titulo;
  el.subtituloResultado.textContent = subtitulo;

  if (percentual >= 70) criarConfete();

  mostrarTela('resultado');
  renderizarEstatisticas();
  renderizarRanking();
  renderizarConquistas();
}

/* ============================================================
   18) MENSAGENS FLUTUANTES E CONFETE
   ============================================================ */
function mostrarMensagem(texto, cor) {
  const msg = document.createElement('div');
  msg.className = 'floating-msg';
  msg.textContent = texto;
  msg.style.color = cor;
  document.body.appendChild(msg);

  setTimeout(function () {
    if (msg.parentNode) msg.parentNode.removeChild(msg);
  }, 900);
}

function criarConfete() {
  const emojis = ['🎉', '💥', '✨', '🎊', '🌟'];
  for (let i = 0; i < 24; i++) {
    const pedaco = document.createElement('div');
    pedaco.className = 'confetti-piece';
    pedaco.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    pedaco.style.left = Math.random() * 100 + 'vw';
    pedaco.style.animationDuration = (1.5 + Math.random()) + 's';
    pedaco.style.fontSize = (16 + Math.random() * 22) + 'px';

    document.body.appendChild(pedaco);

    setTimeout(function (p) {
      return function () {
        if (p.parentNode) p.parentNode.removeChild(p);
      };
    }(pedaco), 2800);
  }
}

/* ============================================================
   19) SOM (beeps simples via Web Audio API)
   ============================================================ */
function tocarSom(acertou) {
  try {
    const contexto = new (window.AudioContext || window.webkitAudioContext)();
    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();

    oscilador.connect(ganho);
    ganho.connect(contexto.destination);

    oscilador.frequency.value = acertou ? 760 : 220;
    ganho.gain.value = 0.15;
    oscilador.start();
    oscilador.stop(contexto.currentTime + 0.22);
  } catch (e) {
    // se o navegador não suportar áudio, ignora silenciosamente
  }
}

/* ============================================================
   20) INICIALIZAÇÃO DA PÁGINA
   ============================================================ */
function iniciar() {
  aplicarTema();
  iniciarNavegacao();
  iniciarMenuMobile();

  el.heroTotalQuiz.textContent = BANCO_DE_PERGUNTAS.length;
  el.heroTotalCat.textContent = CATEGORIAS.length;

  renderizarCategorias();
  renderizarDestaques();
  renderizarEstatisticas();
  renderizarRanking();
  renderizarConquistas();
  renderizarPerfil();

  mostrarTela('inicio');
}

document.addEventListener('DOMContentLoaded', iniciar);