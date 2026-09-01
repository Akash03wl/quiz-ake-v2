/* ==========================================================
   Nivora - LÓGICA DO SITE (JavaScript)
   Fase 1: motor do quiz, ranking local, conquistas e perfil.
   Fase 2: XP/níveis, favoritos, histórico, streak, desafio do
           dia, busca/filtros, conquistas com progresso.
   Fase 3: competição e interação — modos (Sobrevivência, Blitz,
           Contra o Tempo), ranking global por período/métrica,
           compartilhamento, desafio competitivo e arquitetura
           de salas multiplayer (WebSocket), preparada para
           integração futura com backend.
   ========================================================== */

/* ---------- 1) CONFIGURAÇÕES DO JOGO ---------- */
var TEMPO_POR_DIFICULDADE = { facil: 25, medio: 20, dificil: 15, insano: 12 };
var QUANTAS_PERGUNTAS = 10;
var PONTOS_CERTA = 10;
var BONUS_COMBO = 5;
var LIMITE_HISTORICO = 12;
var LIMITE_RANKING = 5;
var PERGUNTAS_DESAFIO = 6;

/* Modos especiais (Fase 3) */
var QUANTAS_BLITZ = 15;          // perguntas no modo Blitz
var TEMPO_BLITZ = 6;             // segundos por pergunta no Blitz
var TEMPO_CONTRA_INICIAL = 90;   // relógio inicial do Contra o Tempo
var CONTRA_ACERTO = 8;           // segundos ganhos a cada acerto
var CONTRA_PENALIDADE = 10;      // segundos perdidos a cada erro
var LIMITE_PARTIDAS = 120;       // partidas competitivas guardadas

var XP_ACERTO = 10;
var XP_COMBO = 5;
var XP_COMPLETAR = 25;
var XP_PERFEITO = 40;
var XP_CONQUISTA = 15;
var XP_DESAFIO = 30;

/* ---------- 2) NÍVEIS E XP ---------- */
function limiarNivel(numero) {
  var predef = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 4900, 5900, 7100, 8500, 10000];
  if (numero <= predef.length) return predef[numero - 1];
  return predef[predef.length - 1] + (numero - predef.length) * 600;
}

function calcularNivel(xp) {
  var nivel = 1;
  while (xp >= limiarNivel(nivel + 1)) nivel++;
  var atual = limiarNivel(nivel);
  var proximo = limiarNivel(nivel + 1);
  return {
    nivel: nivel,
    xpNoNivel: xp - atual,
    xpNecessario: proximo - atual,
    progresso: Math.min(100, Math.round(((xp - atual) / (proximo - atual)) * 100))
  };
}

/* ---------- 3) TELAS ---------- */
var TELAS = {
  inicio: 'tela-inicio',
  modos: 'tela-modos',
  quizzes: 'tela-quizzes',
  quiz: 'tela-quiz',
  resultado: 'tela-resultado',
  ranking: 'tela-ranking',
  salas: 'tela-salas',
  conquistas: 'tela-conquistas',
  perfil: 'tela-perfil',
  conta: 'tela-conta',
  criar: 'tela-criar',
  admin: 'tela-admin'
};

/* ---------- 4) ESTADO DO JOGO ---------- */
var perguntasSorteio = [];
var indiceAtual = 0;
var pontuacao = 0;
var sequenciaCerta = 0;
var maiorCombo = 0;
var acertos = 0;
var erros = 0;
var rapidas = 0;
var respondeu = false;
var quizAtual = null;
var modoAtual = 'normal';   // normal | desafio | sobrevivencia | blitz | contra-tempo
var fimSobrev = false;      // encerra partida de Sobrevivência ao errar
var categoriaAtual = 'geral';
var tempoRestante = 0;
var cronometro = null;
var cronometroGlobal = null; // relógio do Contra o Tempo
var tecnicoTempoGeral = 0;  // (não usado, mantém compatibilidade)
var tempoGeral = 0;
var tempoGeralMax = 0;
var tempoTotalUsado = 0;
var segundosPorPergunta = 20;
var nomeAnterior = '';
var ultimaPartida = null;   // último registro competitivo (p/ compartilhar)

/* ---------- 5) REFERÊNCIAS DE ELEMENTOS ---------- */
function q(sel) { return document.getElementById(sel); }

var el = {
  heroTotalPerguntas: q('hero-total-perguntas'),
  heroTotalCats: q('hero-total-categorias'),
  destaques: q('destaques-grade'),
  categorias: q('categorias-grade'),
  statsVazio: q('stats-estado-vazio'),
  gradeStats: q('grade-stats'),
  rankingResumo: q('ranking-resumo'),
  favoritosGrade: q('favoritos-grade'),
  desafioCard: q('desafio-card'),

  modosGrade: q('modos-grade'),
  modosSalas: q('modos-salas-card'),
  salasCard: q('salas-card'),

  busca: q('busca-quizzes'),
  filtroCat: q('filtro-categoria'),
  filtroDif: q('filtro-dificuldade'),
  ordem: q('ordem-quizzes'),
  soFavoritos: q('so-favoritos'),
  contagem: q('contagem-quizzes'),
  gradePopulares: q('grade-populares'),
  gradeRecentes: q('grade-recentes'),
  gradeRecomendados: q('grade-recomendados'),
  gradeTodos: q('grade-todos'),

  textoProgresso: q('texto-progresso'),
  barraProgresso: q('barra-progresso'),
  modoChip: q('modo-chip'),
  chipCombo: q('chip-combo'),
  numeroSeq: q('sequencia'),
  chipPremio: q('chip-premio'),
  numTimer: q('numero-timer'),
  barraTimer: q('barra-timer'),
  seloBonus: q('selo-bonus'),
  numeroPergunta: q('numero-pergunta'),
  tipoPergunta: q('tipo-pergunta'),
  textoPergunta: q('texto-pergunta'),
  areaRespostas: q('area-respostas'),
  areaExplicacao: q('area-explicacao'),
  pontuacao: q('pontuacao'),
  acertosTela: q('acertos'),
  errosTela: q('erros'),

  emojiResultado: q('emoji-resultado'),
  tituloResultado: q('titulo-resultado'),
  subtituloResultado: q('subtitulo-resultado'),
  pontuacaoFinal: q('pontuacao-final'),
  melhorPontuacao: q('melhor-pontuacao'),
  rAcertos: q('resultado-acertos'),
  rErros: q('resultado-erros'),
  rPercentual: q('resultado-percentual'),
  rCombo: q('resultado-combo'),
  rTempo: q('resultado-tempo'),
  rXp: q('resultado-xp'),
  rNivel: q('resultado-nivel'),
  rBarraXp: q('resultado-barra-xp'),
  rProgresso: q('resultado-progresso'),
  rConquistas: q('resultado-conquistas'),
  rStreak: q('resultado-streak'),
  resultadoNota: q('resultado-nota'),
  shareCard: q('share-card'),
  shareConteudo: q('share-card-conteudo'),
  botaoShareImagem: q('botao-share-imagem'),
  botaoCompartilhar: q('botao-compartilhar'),

  conquistas: q('conquistas-grade'),
  conquistasProgresso: q('conquistas-progresso'),

  rankingDescricao: q('ranking-descricao'),
  periodoFiltros: q('periodo-filtros'),
  rankingTipo: q('ranking-tipo'),
  rankingPodio: q('ranking-podio'),
  rankingTabela: q('ranking-tabela'),
  rankingMinhaPosicao: q('ranking-minha-posicao'),

  perfilNome: q('perfil-nome'),
  perfilNivel: q('perfil-nivel'),
  perfilXp: q('perfil-xp'),
  barraXp: q('barra-xp'),
  perfilStats: q('perfil-stats'),
  perfilHistorico: q('perfil-historico'),
  perfilStreak: q('perfil-streak'),
  perfilCompeticao: q('perfil-competicao'),
  perfilRecordes: q('perfil-recordes'),
  perfilCompetitivo: q('perfil-competitivo'),

  overlayNivel: q('overlay-nivel'),
  overlayNivelTexto: q('overlay-nivel-texto')
};

/* ---------- 5b) ARQUITETURA DE BACKEND (Fase 3) ----------
   A V2 é 100% front-end. Esta seção concentra TODOS os pontos de
   integração com backend, para que a migração futura seja direta.
   Enquanto não houver servidor, 'conectado' é false e as funções
   retornam dados locais + avisos honestos (sem simular jogadores). */
var BACKEND = {
  conectado: false,
  tipo: 'local',           // 'local' | 'websocket' | 'api'
  wsUrl: '',               // ex.: 'wss://quiz-ake-v2.example.com/game'
  apiUrl: '',              // ex.: 'https://quiz-ake-v2.example.com/api'
  conectar: function (config) {
    if (!config) return false;
    this.tipo = config.tipo || 'api';
    this.wsUrl = config.wsUrl || this.wsUrl;
    this.apiUrl = config.apiUrl || this.apiUrl;
    // Quando houver backend de verdade, esta função inicia socket/fetch.
    this.conectado = true;
    return true;
  },
  desconectar: function () { this.conectado = false; }
};

/* ---------- 6) ARMAZENAMENTO ---------- */
var CHAVE = {
  recorde: 'quizAKE_recorde',
  xp: 'quizAKE_xp',
  stats: 'quizAKE_stats',
  favoritos: 'quizAKE_favoritos',
  historico: 'quizAKE_historico',
  ranking: 'quizAKE_ranking',
  conquistas: 'quizAKE_conquistas',
  streak: 'quizAKE_streak',
  desafio: 'quizAKE_desafio',
  desafioInfo: 'quizAKE_desafioInfo',
  tema: 'quizAKE_tema',
  nome: 'quizAKE_nome',
  partidas: 'quizAKE_partidas'     // Fase 3: log competitivo (histórico oficial)
};

function lerTexto(chave) { try { return localStorage.getItem(chave); } catch (e) { return null; } }
function gravarTexto(chave, valor) { try { localStorage.setItem(chave, valor); } catch (e) {} }
function lerNumero(chave) { var v = lerTexto(chave); return v === null ? 0 : Number(v); }
function lerLista(chave) { var v = lerTexto(chave); if (v === null) return []; try { return JSON.parse(v); } catch (e) { return []; } }
function lerObjeto(chave, padrao) {
  var v = lerTexto(chave);
  if (v === null) return padrao;
  try { var o = JSON.parse(v); return o && typeof o === 'object' ? o : padrao; } catch (e) { return padrao; }
}
function lerStats() {
  return lerObjeto(CHAVE.stats, { jogos: 0, acertos: 0, erros: 0, rapidas: 0, maiorCombo: 0, perfeitos: 0, desafios: 0, maiorPontos: 0, sobrevSeq: 0, blitzPontos: 0, contraPontos: 0, modosDistintos: 0 });
}
function salvarStats(s) { gravarTexto(CHAVE.stats, JSON.stringify(s)); }
function lerNome() { var n = lerTexto(CHAVE.nome); return (n && n.trim()) ? n : 'Estudante Nivora'; }

function lerRecorde() { return lerNumero(CHAVE.recorde); }

function iso(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function hojeISO() { return iso(new Date()); }
function dataComOffset(offset) {
  var d = new Date();
  d.setDate(d.getDate() + offset);
  return iso(d);
}
function inicioDoDia(ms) {
  var d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/* ---------- 7) TEMA ---------- */
var TEMAS = ['dark', 'light', 'system'];
var ICONES_TEMA = { dark: 'dark_mode', light: 'light_mode', system: 'desktop_windows' };
function temaAtual() { var t = lerTexto(CHAVE.tema); return TEMAS.indexOf(t) >= 0 ? t : 'system'; }
function aplicarTema() {
  var t = temaAtual();
  document.documentElement.setAttribute('data-theme', t);
  var b = q('botao-tema');
  if (b) {
    b.innerHTML = ic(ICONES_TEMA[t], 'icone');
    b.setAttribute('aria-label', 'Tema: ' + t);
  }
}
function alternarTema() {
  var ordem = ['dark', 'light', 'system'];
  var proximo = ordem[(ordem.indexOf(temaAtual()) + 1) % ordem.length];
  gravarTexto(CHAVE.tema, proximo);
  aplicarTema();
}

/* ---------- 8) NAVEGAÇÃO ---------- */
function mostrarTela(nomeTela) {
  var id = TELAS[nomeTela] || TELAS.inicio;
  document.querySelectorAll('main.tela').forEach(function (m) { m.classList.add('hidden'); });
  var alvo = document.getElementById(id);
  if (alvo) alvo.classList.remove('hidden');

  document.querySelectorAll('.nav-link').forEach(function (l) {
    l.classList.toggle('active', l.getAttribute('data-navegar') === nomeTela);
  });

  if (nomeTela === 'quizzes') renderizarPaginaQuizzes();
  if (nomeTela === 'modos') renderizarModos();
  if (nomeTela === 'ranking') renderizarRanking();
  if (nomeTela === 'salas') renderizarSalas();
  if (nomeTela === 'conquistas') renderizarConquistas();
  if (nomeTela === 'perfil') renderizarPerfil();
  if (nomeTela === 'inicio') renderizarHome();
  if (nomeTela === 'conta') renderizarConta();
  if (nomeTela === 'criar') renderizarCriar();
  if (nomeTela === 'admin') renderizarAdmin();

  fecharMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function iniciarNavegacao() {
  document.addEventListener('click', function (ev) {
    var elem = ev.target.closest ? ev.target.closest('[data-navegar]') : null;
    if (!elem) return;
    ev.preventDefault();
    var alvo = elem.getAttribute('data-navegar');
    if (alvo === 'quiz-dia') { iniciarDesafioDoDia(); return; }
    mostrarTela(alvo);
  });

  q('botao-comecar').addEventListener('click', function () { entrarNoQuiz('quiz-geral'); });
  q('botao-jogar-hero').addEventListener('click', function () { entrarNoQuiz('quiz-geral'); });
  q('botao-reiniciar').addEventListener('click', function () {
    if (modoAtual === 'normal' || modoAtual === 'desafio') {
      entrarNoQuiz(quizAtual ? quizAtual.id : 'quiz-geral');
    } else if (modoAtual === 'sobrevivencia' || modoAtual === 'blitz' || modoAtual === 'contra-tempo') {
      iniciarModo(modoAtual);
    }
  });
  q('botao-tema').addEventListener('click', alternarTema);

  // Fase 3: compartilhamento
  if (el.botaoCompartilhar) el.botaoCompartilhar.addEventListener('click', compartilharResultado);
  if (el.botaoShareImagem) el.botaoShareImagem.addEventListener('click', baixarImagemShare);

  // Fase 3: ranking — período e tipo
  if (el.periodoFiltros) el.periodoFiltros.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.periodo-btn');
    if (!btn) return;
    el.periodoFiltros.querySelectorAll('.periodo-btn').forEach(function (b) { b.classList.remove('ativo'); });
    btn.classList.add('ativo');
    renderizarRanking();
  });
  if (el.rankingTipo) el.rankingTipo.addEventListener('change', renderizarRanking);

  if (el.busca) el.busca.addEventListener('input', debounce(renderizarTodos, 180));
  if (el.filtroCat) el.filtroCat.addEventListener('change', renderizarTodos);
  if (el.filtroDif) el.filtroDif.addEventListener('change', renderizarTodos);
  if (el.ordem) el.ordem.addEventListener('change', renderizarTodos);
  if (el.soFavoritos) el.soFavoritos.addEventListener('change', renderizarTodos);

  // Perfil: nome editável
  var inputNome = q('input-nome');
  if (inputNome) inputNome.addEventListener('change', function () {
    var nome = inputNome.value.trim();
    if (nome) { gravarTexto(CHAVE.nome, nome); inputNome.value = nome; renderizarPerfil(); }
  });
}

function debounce(fn, ms) {
  var timer = null;
  return function () { clearTimeout(timer); timer = setTimeout(fn, ms); };
}

/* ---------- 9) MENU MOBILE ---------- */
function iniciarMenuMobile() {
  var b = q('menu-toggle'), nav = q('nav-links');
  if (!b || !nav) return;
  b.addEventListener('click', function () {
    var aberto = nav.classList.toggle('aberto');
    b.setAttribute('aria-expanded', aberto);
  });
}
function fecharMenu() {
  var nav = q('nav-links');
  if (nav) nav.classList.remove('aberto');
  var b = q('menu-toggle');
  if (b) b.setAttribute('aria-expanded', 'false');
}

/* ---------- 10) FAVORITOS ---------- */
function ehFavorito(id) { return lerLista(CHAVE.favoritos).indexOf(id) >= 0; }
function alternarFavorito(id) {
  var lista = lerLista(CHAVE.favoritos);
  var i = lista.indexOf(id);
  if (i >= 0) { lista.splice(i, 1); gravarTexto(CHAVE.favoritos, JSON.stringify(lista)); if (window.API && typeof window.API.agendarSincronizacao === 'function') window.API.agendarSincronizacao(); return false; }
  lista.push(id); gravarTexto(CHAVE.favoritos, JSON.stringify(lista)); if (window.API && typeof window.API.agendarSincronizacao === 'function') window.API.agendarSincronizacao(); return true;
}

/* ---------- 11) HISTÓRICO ---------- */
function lerHistorico() { return lerLista(CHAVE.historico); }
function registrarHistorico(reg) {
  var lista = lerHistorico();
  lista.unshift(reg);
  gravarTexto(CHAVE.historico, JSON.stringify(lista.slice(0, LIMITE_HISTORICO)));
}
function vezesJogado(id) { return lerHistorico().filter(function (h) { return h.quiz === id; }).length; }
function ultimoJogoData(id) {
  var lista = lerHistorico();
  for (var i = 0; i < lista.length; i++) if (lista[i].quiz === id) return lista[i].quando;
  return '';
}

/* ---------- 11b) PARTIDAS COMPETITIVAS (Fase 3) ---------- */
function lerPartidas() { return lerLista(CHAVE.partidas); }
function registrarPartida(rec) {
  var lista = lerPartidas();
  lista.unshift(rec);
  gravarTexto(CHAVE.partidas, JSON.stringify(lista.slice(0, LIMITE_PARTIDAS)));
  if (window.API && typeof window.API.agendarSincronizacao === 'function') window.API.agendarSincronizacao();
}
function partidasNoPeriodo(periodo) {
  var lista = lerPartidas();
  if (!periodo || periodo === 'geral') return lista;
  var agora = inicioDoDia(Date.now());
  var hojemis = inicioDoDia(Date.now());
  if (periodo === 'hoje') {
    return lista.filter(function (p) { return inicioDoDia(p.ts) === hojemis; });
  }
  return lista.filter(function (p) {
    var ms = p.ts || Date.now();
    var d = inicioDoDia(ms);
    if (periodo === 'semana') return d >= agora - 6 * 86400000;
    if (periodo === 'mes') return d >= agora - 29 * 86400000;
    return true;
  });
}

/* ---------- 12) STREAK ---------- */
function lerStreak() { return lerObjeto(CHAVE.streak, { dias: [] }); }
function calcularStreak() {
  var obj = lerStreak();
  var dias = obj.dias || [];
  var agora = 0, cursor = hojeISO();
  while (dias.indexOf(cursor) >= 0) { agora++; cursor = dataComOffset(-agora); }
  var maior = Math.max(obj.maior || 0, agora);
  return { atual: agora, maior: maior, dias: dias };
}
function registrarAtividade() {
  var obj = lerStreak();
  var dias = obj.dias || [];
  var hoje = hojeISO();
  if (dias.indexOf(hoje) < 0) {
    dias.push(hoje);
    if (dias.length > 120) dias = dias.slice(-120);
    obj.dias = dias;
    gravarTexto(CHAVE.streak, JSON.stringify(obj));
  }
  return calcularStreak();
}

/* ---------- 13) DESAFIO DO DIA (competitivo GLOBAL, Fase 4) ---------- */
function sementeDia(texto) {
  var h = 0;
  for (var i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h;
}

// ------------------------------------------------------------------
// Informações globais do desafio (seed do dia, perguntas, ranking).
// Fonte: GET /api/desafio. Cached por dia; offline usa o seed da data.
// ------------------------------------------------------------------
var desafioInfo = lerObjeto(CHAVE.desafioInfo, null);
function cachearDesafioInfo(info) {
  desafioInfo = info;
  if (info) gravarTexto(CHAVE.desafioInfo, JSON.stringify(info));
}
function desafioInfoDeHoje() {
  if (desafioInfo && desafioInfo.data === hojeISO()) return desafioInfo;
  var cache = lerObjeto(CHAVE.desafioInfo, null);
  if (cache && cache.data === hojeISO()) { desafioInfo = cache; return cache; }
  return null;
}
function carregarDesafioGlobal(forcar) {
  var cache = desafioInfoDeHoje();
  if (cache && cache.carregado && !forcar) return Promise.resolve(cache);
  if (!BACKEND.conectado || !window.API || typeof window.API.desafioHoje !== 'function') {
    return Promise.resolve(desafioInfoDeHoje());
  }
  return window.API.desafioHoje().then(function (d) {
    if (d && d.data === hojeISO()) cachearDesafioInfo(Object.assign({}, d, { carregado: true }));
    else cachearDesafioInfo(null);
    return desafioInfoDeHoje();
  }).catch(function () { return desafioInfoDeHoje(); });
}

// Sorteio determinístico: o mesmo seed = as mesmas perguntas para todos.
function perguntasDesafioHoje() {
  var info = desafioInfoDeHoje();
  var semente = info && typeof info.seed === 'number' ? info.seed : sementeDia(hojeISO());
  var qtd = (info && typeof info.perguntas === 'number' && info.perguntas > 0) ? info.perguntas : PERGUNTAS_DESAFIO;
  var pool = PERGUNTAS.slice();
  for (var i = pool.length - 1; i > 0; i--) {
    semente = (semente * 1103515245 + 12345) >>> 0;
    var j = semente % (i + 1);
    var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  return pool.slice(0, qtd);
}
function iniciarDesafioDoDia() {
  pararTudo();
  modoAtual = 'desafio';
  perguntasSorteio = perguntasDesafioHoje();
  prepararPartida(perguntasSorteio);
  if (el.modoChip) { el.modoChip.innerHTML = ic('flag') + ' Desafio do Dia'; el.modoChip.classList.remove('hidden'); }
}
function dadosDesafioHoje() {
  // Estatísticas do desafio de hoje a partir das partidas competitivas.
  var partes = lerPartidas().filter(function (p) { return p.modo === 'desafio' && inicioDoDia(p.ts) === inicioDoDia(Date.now()); });
  if (!partes.length) return { jogado: false, melhor: 0, media: 0, posicao: null, qtd: 0 };
  var melhores = partes.sort(function (a, b) { return b.pontos - a.pontos; });
  var soma = 0;
  partes.forEach(function (p) { soma += p.pontos; });
  return { jogado: true, melhor: melhores[0].pontos, media: Math.round(soma / partes.length), posicao: 1, qtd: partes.length };
}
// Envia a tentativa do desafio ao backend (global) e atualiza ranking + nota.
function enviarDesafioGlobal() {
  var p = ultimaPartida;
  var nota = function (info) { atualizarNotaDesafio(info); };
  if (!window.API || typeof window.API.enviarDesafio !== 'function' || !BACKEND.conectado) { nota(null); return; }
  if (!window.API.usuarioLogado || !window.API.usuarioLogado()) { nota(null); return; }
  window.API.enviarDesafio({
    pontos: p.pontos || 0,
    acertos: p.acertos || 0,
    erros: p.erros || 0,
    combo: p.maiorCombo || 0,
    xp: p.xp || 0,
    ts: p.ts || Date.now(),
    dataISO: p.dataISO || hojeISO()
  }).then(function (d) {
    if (d && d.data === hojeISO()) cachearDesafioInfo(Object.assign({}, d, { carregado: true }));
    nota(desafioInfoDeHoje());
    if (el.desafioCard) renderizarDesafio();
  }).catch(function () { nota(null); });
}
// Mostra a posição global na tela de resultado (pós-desafio).
function atualizarNotaDesafio(info) {
  if (!el.resultadoNota) return;
  var g = info && info.carregado ? info : null;
  if (!g || !g.minha) {
    el.resultadoNota.innerHTML =
      '<div class="nota-linha"><span>' + ic('flag') + ' Desafio do Dia</span><strong>Posição global indisponível — entre na sua conta.</strong></div>';
    return;
  }
  var m = g.minha;
  el.resultadoNota.innerHTML =
    '<div class="nota-linha"><span>' + ic('flag') + ' Desafio do Dia</span><strong>' +
    (m.jogou
      ? 'Sua posição hoje: #' + m.posicao + ' de ' + m.total + ' · melhor ' + m.melhor + ' pts'
      : 'Partida enviada. Continue tentando para entrar no ranking!') +
    '</strong></div>';
}
function renderizarDesafio() {
  if (!el.desafioCard) return;
  var desafio = lerObjeto(CHAVE.desafio, { hoje: '', melhor: 0 });
  var info = dadosDesafioHoje();
  var jogouHoje = desafio.hoje === hojeISO();
  var g = desafioInfoDeHoje();
  var qtd = (g && g.perguntas) ? g.perguntas : PERGUNTAS_DESAFIO;
  var blocos = '';

  if (!BACKEND.conectado) {
    // Offline: estatísticas locais e aviso.
    blocos = '<p class="desafio-aviso">' + ic('cloud_off') + ' Offline — competindo contra seu histórico local. Conecte-se para o ranking global.</p>' +
      (info.jogado
        ? '<div class="destaque-meta"><span>' + ic('stars') + ' Melhor de hoje: <strong>' + info.melhor + ' pts</strong></span><span>' + ic('monitoring') + ' Sua média: <strong>' + info.media + ' pts</strong></span></div>'
        : '<div class="destaque-meta"><span>' + ic('help') + ' ' + qtd + ' perguntas</span>' +
          (jogouHoje ? '<span>' + ic('stars') + ' Melhor hoje: ' + desafio.melhor + ' pts</span>' : '<span>Você ainda não jogou hoje</span>') + '</div>');
  } else if (!g || !g.carregado) {
    blocos = '<p class="desafio-aviso">' + ic('cloud_sync') + ' Carregando ranking global…</p>' +
      '<div class="destaque-meta"><span>' + ic('help') + ' ' + qtd + ' perguntas</span>' +
      (jogouHoje ? '<span>' + ic('stars') + ' Melhor hoje: ' + desafio.melhor + ' pts</span>' : '<span>Você ainda não jogou hoje</span>') + '</div>';
  } else {
    var resumo = g.resumo || {};
    blocos = '<div class="destaque-meta">' +
      '<span>' + ic('public') + ' ' + resumo.jogadores + ' jogadores</span>' +
      '<span>' + ic('monitoring') + ' Média: <strong>' + resumo.media + ' pts</strong></span>' +
      '</div>';
    if (g.minha && g.minha.jogou) {
      blocos += '<div class="destaque-meta">' +
        '<span>' + ic('stars') + ' Seu melhor: <strong>' + g.minha.melhor + ' pts</strong></span>' +
        '<span>' + ic('military_tech') + ' Posição: <strong>#' + g.minha.posicao + ' de ' + g.minha.total + '</strong></span>' +
        '</div>';
    } else if (g.minha) {
      blocos += '<p class="desafio-aviso">Jogue e entre no ranking de hoje!</p>';
    }
    if (g.top && g.top.length) {
      blocos += '<div class="desafio-top-label">' + ic('emoji_events') + ' Top de hoje</div>' +
        '<div class="podio desafio-podio">' + g.top.slice(0, 3).map(function (t, i) {
          return '<div class="podio-item' + (i === 0 ? ' primeiro' : '') + '">' +
            '<span class="podio-medalha">' + (i + 1) + 'º</span>' +
            '<span class="podio-avatar">' + esc(t.avatar || '🧑‍🚀') + '</span>' +
            '<span class="podio-nome">' + esc(t.nome || '?') + '</span>' +
            '<span class="podio-valor">' + t.pontos + ' pts</span>' +
          '</div>';
        }).join('') + '</div>';
    }
  }

  el.desafioCard.innerHTML =
    '<div class="destaque-badge">' + ic('flag') + ' Desafio do Dia</div>' +
    '<h3>' + new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) + '</h3>' +
    '<p>As mesmas ' + qtd + ' perguntas para todos. Dispute o ranking de hoje com jogadores do mundo todo.</p>' +
    blocos +
    '<button class="btn btn-primary" id="btn-desafio-card">' + (info.jogado ? 'Melhorar resultado' : 'Jogar Desafio') + '</button>';

  var b = q('btn-desafio-card');
  if (b) b.addEventListener('click', iniciarDesafioDoDia);

  // Garante o seed/perguntas em cache p/ o sorteio e o ranking frescos.
  var antes = !!(g && g.carregado);
  carregarDesafioGlobal(!antes).then(function (novo) {
    var depois = !!(novo && novo.carregado);
    if (depois === antes) return;
    var visivel = !document.getElementById(TELAS.inicio).classList.contains('hidden');
    if (visivel) renderizarDesafio();
  });
}

/* ---------- 14) CARDS DE QUIZ ---------- */
function htmlCard(quiz) {
  var dif = buscarDif(quiz.dificuldade) || DIFICULDADES[0];
  var fav = ehFavorito(quiz.id);
  var minutos = Math.max(1, Math.round(quiz.duracao / 60));
  var tags = (quiz.tags || []).slice(0, 2).map(function (t) {
    return '<span class="quiz-tag">#' + t.replace(/\s/g, '') + '</span>';
  }).join('');
  return '<article class="quiz-card" data-quiz="' + quiz.id + '">' +
    '<div class="quiz-capa" style="--capa:' + quiz.capa.cor + '">' +
      '<span class="quiz-capa-emoji">' + quiz.capa.emoji + '</span>' +
      '<button class="quiz-fav' + (fav ? ' ativo' : '') + '" data-fav="' + quiz.id + '" aria-label="Favoritar">♥</button>' +
    '</div>' +
    '<div class="quiz-corpo">' +
      '<div class="quiz-linha"><span class="chip-dificuldade">' + dif.icone + ' ' + dif.nome + '</span>' +
      '<span class="quiz-data">' + (quiz.dataCriacao || '').slice(0, 4) + '</span></div>' +
      '<h3 class="quiz-titulo">' + quiz.titulo + '</h3>' +
      '<p class="quiz-desc">' + quiz.descricao + '</p>' +
      '<div class="quiz-tags">' + tags + '</div>' +
      '<div class="quiz-meta-row">' +
        '<span>' + ic('help') + ' ' + quiz.quantidade + ' questões</span>' +
        '<span>' + ic('schedule') + ' ' + minutos + ' min</span>' +
        '<span>' + ic('account_circle') + ' ' + quiz.autor + '</span>' +
      '</div>' +
    '</div>' +
  '</article>';
}

function anexarAcoes(card) {
  card.addEventListener('click', function () {
    entrarNoQuizCard(card);
  });
  var fav = card.querySelector('[data-fav]');
  if (fav) fav.addEventListener('click', function (ev) {
    ev.stopPropagation();
    var ativo = alternarFavorito(fav.getAttribute('data-fav'));
    fav.classList.toggle('ativo', ativo);
  });
}
function entrarNoQuizCard(card) {
  var id = card.getAttribute('data-quiz');
  if (id) entrarNoQuiz(id);
}
function renderizarCards(container, quizzes) {
  if (!container) return;
  container.innerHTML = quizzes.map(htmlCard).join('');
  container.querySelectorAll('.quiz-card').forEach(anexarAcoes);
}

/* ---------- 15) PÁGINA DE QUIZZES ---------- */
function filtrosAtuais() {
  var busca = el.busca ? el.busca.value.trim().toLowerCase() : '';
  var cat = el.filtroCat ? el.filtroCat.value : '';
  var dif = el.filtroDif ? el.filtroDif.value : '';
  var fav = el.soFavoritos ? el.soFavoritos.checked : false;
  return { busca: busca, cat: cat, dif: dif, fav: fav };
}
function ordenarLista(lista, chave) {
  var copia = lista.slice();
  if (chave === 'titulo')
    copia.sort(function (a, b) { return a.titulo.localeCompare(b.titulo); });
  else if (chave === 'populares')
    copia.sort(function (a, b) { return vezesJogado(b.id) - vezesJogado(a.id); });
  else if (chave === 'recentes') {
    copia.sort(function (a, b) {
      var da = ultimoJogoData(a.id), db = ultimoJogoData(b.id);
      if (da === '' || db === '') return da === '' ? 1 : -1;
      return da < db ? 1 : -1;
    });
  } else if (chave === 'duracao')
    copia.sort(function (a, b) { return a.duracao - b.duracao; });
  return copia;
}
function filtrarQuizzes() {
  var f = filtrosAtuais();
  return QUIZZES.filter(function (q) {
    if (f.cat && q.categoria !== f.cat) return false;
    if (f.dif && q.dificuldade !== f.dif) return false;
    if (f.fav && !ehFavorito(q.id)) return false;
    if (f.busca) {
      var catNome = (buscarCategoria(q.categoria) || { nome: '' }).nome.toLowerCase();
      var alvo = (q.titulo + ' ' + catNome + ' ' + (q.tags || []).join(' ')).toLowerCase();
      if (alvo.indexOf(f.busca) < 0) return false;
    }
    return true;
  });
}
function renderizarTodos() {
  var ordem = el.ordem ? el.ordem.value : '';
  var lista = ordenarLista(filtrarQuizzes(), ordem);
  if (el.contagem) el.contagem.textContent = lista.length + ' quiz(es)';
  renderizarCards(el.gradeTodos, lista);
}
function renderizarSugestoes() {
  if (el.gradePopulares) {
    var pop = QUIZZES.slice().sort(function (a, b) { return vezesJogado(b.id) - vezesJogado(a.id); }).slice(0, 3);
    renderizarCards(el.gradePopulares, pop);
  }
  if (el.gradeRecentes) {
    var rec = QUIZZES.slice().sort(function (a, b) {
      var da = ultimoJogoData(a.id), db = ultimoJogoData(b.id);
      if (da === '' || db === '') return da === '' ? 1 : -1;
      return da < db ? 1 : -1;
    }).slice(0, 3);
    renderizarCards(el.gradeRecentes, rec);
  }
  if (el.gradeRecomendados) {
    var rec2 = QUIZZES.slice().sort(function (a, b) { return vezesJogado(a.id) - vezesJogado(b.id); }).slice(0, 3);
    renderizarCards(el.gradeRecomendados, rec2);
  }
}
function popularFiltros() {
  if (el.filtroCat && el.filtroCat.options.length <= 1) {
    var h1 = '<option value="">Todas as categorias</option>';
    CATEGORIAS.forEach(function (c) { h1 += '<option value="' + c.id + '">' + c.emoji + ' ' + c.nome + '</option>'; });
    el.filtroCat.innerHTML = h1;
  }
  if (el.filtroDif && el.filtroDif.options.length <= 1) {
    var h2 = '<option value="">Todas as dificuldades</option>';
    DIFICULDADES.forEach(function (d) { h2 += '<option value="' + d.id + '">' + d.icone + ' ' + d.nome + '</option>'; });
    el.filtroDif.innerHTML = h2;
  }
}
function renderizarPaginaQuizzes() {
  popularFiltros();
  renderizarSugestoes();
  renderizarTodos();
}

/* ---------- 16) HOME ---------- */
function renderizarHome() {
  renderizarDescricao();
  renderizarCategorias();
  renderizarDesafio();
  renderizarFavoritosHome();
  renderizarEstatisticas();
  renderizarRankingResumo();
}
function renderizarEstatisticas() {
  if (!el.gradeStats) return;
  var s = lerStats();
  if (el.statsVazio) el.statsVazio.innerHTML = '';
  el.gradeStats.innerHTML = '';

  if (!s.jogos) {
    if (el.statsVazio) {
      el.statsVazio.innerHTML =
        '<span class="emoji">' + ic('emoji_events') + '</span>' +
        '<p><strong>Você ainda não jogou!</strong><br>Complete um quiz para ver suas estatísticas por aqui.</p>';
    }
    return;
  }

  var respondidas = (s.acertos || 0) + (s.erros || 0);
  var taxa = respondidas ? Math.round(((s.acertos || 0) / respondidas) * 100) : 0;
  var sequencia = calcularStreak();

  var cards = [
    ['🎮', s.jogos, 'Quizzes realizados'],
    ['❓', respondidas, 'Perguntas'],
    ['✅', taxa + '%', 'Taxa de acerto'],
    ['🏆', lerRecorde(), 'Melhor pontuação'],
    ['🌈', s.maiorCombo, 'Maior combo'],
    ['📅', sequencia.atual, 'Dias seguidos']
  ];

  cards.forEach(function (c) {
    var d = document.createElement('div');
    d.className = 'stat-card';
    d.innerHTML = '<span class="stat-valor">' + c[1] + '</span><span class="stat-rotulo">' + c[2] + '</span>';
    el.gradeStats.appendChild(d);
  });
}
function renderizarDescricao() {
  if (!el.destaques) return;
  var quest = QUIZZES.slice().sort(function (a, b) { return vezesJogado(b.id) - vezesJogado(a.id); });
  renderizarCards(el.destaques, quest.slice(0, 3));
}
function renderizarCategorias() {
  if (!el.categorias) return;
  el.categorias.innerHTML = CATEGORIAS.map(function (c) {
    var qz = buscarQuiz('quiz-' + c.id);
    var total = qz ? qz.quantidade : 0;
    return '<article class="card-cat" data-cat="' + c.id + '" style="--cat-cor:' + c.cor + '">' +
      '<span class="cat-icone">' + c.emoji + '</span>' +
      '<span class="cat-nome">' + c.nome + '</span>' +
      '<span class="cat-meta">' + total + ' perguntas</span></article>';
  }).join('');
  el.categorias.querySelectorAll('[data-cat]').forEach(function (card) {
    card.addEventListener('click', function () { entrarNoQuiz('quiz-' + card.getAttribute('data-cat')); });
  });
}
function renderizarFavoritosHome() {
  if (!el.favoritosGrade) return;
  var favs = lerLista(CHAVE.favoritos);
  var quizes = QUIZZES.filter(function (q) { return favs.indexOf(q.id) >= 0; }).slice(0, 3);
  if (quizes.length === 0) {
    el.favoritosGrade.innerHTML = '<div class="estado-vazio"><span class="emoji">' + ic('favorite') + '</span><p>Nenhum favorito ainda. Toque no coração de um quiz!</p></div>';
    return;
  }
  renderizarCards(el.favoritosGrade, quizes);
}
function renderizarRankingResumo() {
  if (!el.rankingResumo) return;
  var lista = lerLista(CHAVE.ranking);
  if (lista.length === 0) {
    el.rankingResumo.innerHTML = '<div class="estado-vazio"><span class="emoji">' + ic('emoji_events') + '</span><p><strong>Nenhum registro ainda.</strong><br>Jogue para entrar no ranking.</p></div>';
    return;
  }
  var itens = lista.slice(0, 3).map(function (r, i) {
    return '<li><span class="pos">' + (i === 0 ? '1º' : i === 1 ? '2º' : '3º') + '</span><span class="nome">' + r.nome + '</span><span class="pts">' + r.pontos + ' pts</span></li>';
  });
  el.rankingResumo.innerHTML = '<ul class="lista-ranking">' + itens.join('') + '</ul>';
}

/* ---------- 17) MODOS DE JOGO (Fase 3) ---------- */
function iniciarModo(id) {
  var modo = buscarModo(id);
  if (!modo) return;
  pararTudo();
  modoAtual = id;
  fimSobrev = false;

  if (el.modoChip) {
    el.modoChip.textContent = modo.icone + ' ' + modo.nome;
    el.modoChip.style.setProperty('--modo-cor', modo.cor || 'var(--acento)');
    el.modoChip.classList.remove('hidden');
  }

  // Pool embaralhado de todas as perguntas.
  var pool = PERGUNTAS.slice();
  for (var i = pool.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }

  if (modoAtual === 'sobrevivencia' || modoAtual === 'contra-tempo') {
    perguntasSorteio = pool; // infinito: recicla quando acabar
  } else if (modoAtual === 'blitz') {
    perguntasSorteio = pool.slice(0, QUANTAS_BLITZ);
  }

  if (modoAtual === 'contra-tempo') {
    tempoGeralMax = TEMPO_CONTRA_INICIAL;
    tempoGeral = tempoGeralMax;
  }

  prepararPartida(perguntasSorteio);
}
function renderizarModos() {
  if (!el.modosGrade) return;
  var s = lerStats();
  var modosHtml = MODOS.map(function (m) {
    var melhor = sDeModo(m.id);
    var rec = melhor ? melhor.pontos : 0;
    return '<article class="modo-card" data-modo="' + m.id + '" style="--modo-cor:' + m.cor + '">' +
      '<span class="modo-icone">' + m.icone + '</span>' +
      '<h3 class="modo-nome">' + m.nome + '</h3>' +
      '<p class="modo-desc">' + m.desc + '</p>' +
      '<span class="modo-regra">' + m.regra + '</span>' +
      '<span class="modo-recorde">Recorde: <strong>' + rec + ' pts</strong></span>' +
      '<button class="btn btn-primary" data-modo-jogar="' + m.id + '">Jogar agora</button>' +
    '</article>';
  }).join('');
  el.modosGrade.innerHTML = modosHtml;
  el.modosGrade.querySelectorAll('[data-modo-jogar]').forEach(function (b) {
    b.addEventListener('click', function () { iniciarModo(b.getAttribute('data-modo-jogar')); });
  });

  // Card da seção multiplayer (arquitetura preparada)
  if (el.modosSalas) renderizarCardSalas(el.modosSalas, true);
}

/* Recordes por modo derivados do histórico competitivo */
function sDeModo(modoId) {
  var partes = lerPartidas().filter(function (p) { return p.modo === modoId; });
  if (!partes.length) return null;
  var melhorPontos = 0, melhorHonra = null;
  partes.forEach(function (p) {
    if (p.pontos > melhorPontos) { melhorPontos = p.pontos; melhorHonra = p; }
  });
  return melhorHonra;
}

/* ---------- 18) RANKING GLOBAL E ESPECÍFICOS (Fase 3) ---------- */
function periodoAtual() {
  var ativo = el.periodoFiltros ? el.periodoFiltros.querySelector('.periodo-btn.ativo') : null;
  return ativo ? ativo.getAttribute('data-periodo') : 'geral';
}
function rankingTipoAtual() {
  return el.rankingTipo ? el.rankingTipo.value : 'pontos';
}
/* Retorna a lista ordenada de partidas do período, pela métrica escolhida.
   Quando o backend estiver conectado, a mesma assinatura buscaria a lista
   global no servidor (ver BACKEND.conectar). */
function listaRankingLocal(tipo, periodo) {
  var lista = partidasNoPeriodo(periodo);
  var ordem = { pontos: 'pontos', xp: 'xp', sequencia: 'maiorCombo', quizzes: 'ts', taxa: 'taxa' };
  var chave = ordem[tipo] || 'pontos';
  return lista.slice().sort(function (a, b) {
    var va = a[chave] || 0, vb = b[chave] || 0;
    if (tipo === 'quizzes') return vb - va;   // mais partidas primeiro (rs, lista já é por data)
    return vb - va;
  });
}
function roteirizarRanking() {
  var tipo = rankingTipoAtual();
  var periodo = periodoAtual();
  return { tipo: tipo, periodo: periodo, lista: listaRankingLocal(tipo, periodo) };
}
function renderizarRanking() {
  if (!el.rankingTipo || !el.rankingPodio || !el.rankingTabela) return;
  var dados = roteirizarRanking();
  var tipo = dados.tipo, periodo = dados.periodo, lista = dados.lista;

  var rotuloPeriodo = { hoje: 'hoje', semana: 'nesta semana', mes: 'neste mês', geral: 'no geral' }[periodo] || '';
  var rotuloTipo = el.rankingTipo.options[el.rankingTipo.selectedIndex] ? el.rankingTipo.options[el.rankingTipo.selectedIndex].text : '';

  var aviso = '';
  if (!BACKEND.conectado) {
    aviso = '<p class="ranking-aviso">' + ic('cloud_off') + ' Offline — exibindo apenas o seu histórico competitivo. Quando o backend estiver conectado, você verá os jogadores reais.</p>';
  }

  // Pódio top 3
  if (!lista.length) {
    el.rankingPodio.innerHTML = '<div class="estado-vazio"><span class="emoji">' + ic('emoji_events') + '</span><p><strong>Sem registros ' + (rotuloPeriodo ? ' ' + rotuloPeriodo : '') + '.</strong><br>Jogue e volte para ver sua posição!</p></div>';
    el.rankingTabela.innerHTML = '';
  } else {
    var topo = lista.slice(0, 3);
    var med = ['1º', '2º', '3º'];
    el.rankingPodio.innerHTML = '<div class="podio">' + topo.map(function (p, i) {
      return '<div class="podio-item' + (i === 0 ? ' primeiro' : '') + '">' +
        '<span class="podio-medalha">' + med[i] + '</span>' +
        '<span class="podio-avatar">' + (p.icon || '🧑‍🚀') + '</span>' +
        '<span class="podio-nome">' + (p.nome || lerNome()) + '</span>' +
        '<span class="podio-valor">' + formatarValorRank(tipo, p) + '</span>' +
        '<span class="podio-pontos">' + p.pontos + ' pts</span>' +
      '</div>';
    }).join('') + '</div>';

    // Tabela completa
    var linhas = lista.slice(0, 30).map(function (p, i) {
      var destaque = i === 0;
      return '<li class="rank-linha' + (destaque ? ' destaque' : '') + '">' +
        '<span class="rank-pos">' + (i + 1) + 'º</span>' +
        '<span class="rank-avatar">' + (p.icon || '🧑‍🚀') + '</span>' +
        '<span class="rank-nome">' + (p.nome || lerNome()) +
          '<small>' + p.dataFmt + ' · ' + rotuloModoNome(p.modo) + '</small></span>' +
        '<span class="rank-nivel">Nv ' + (p.nivel || 1) + '</span>' +
        '<span class="rank-eff">' + formatarValorRank(tipo, p) + '</span>' +
        '<span class="rank-pontos rank-medida">' + p.pontos + ' pts</span>' +
      '</li>';
    });
    el.rankingTabela.innerHTML = '<h3 class="titulo-bloco">' + rotuloTipo + '</h3>' + aviso +
      '<ul class="lista-ranking lista-grid">' + linhas.join('') + '</ul>';
  }

  // Posição do próprio jogador
  renderizarMinhaPosicao(lista);
}
function formatarValorRank(tipo, p) {
  if (tipo === 'xp') return (p.xp || 0) + ' XP';
  if (tipo === 'sequencia') return (p.maiorCombo || 0) + ' seq.';
  if (tipo === 'quizzes') return (p.streakParcial || '1') + '';
  if (tipo === 'taxa') return (p.taxa || 0) + '%';
  return p.pontos + ' pts';
}
function rotuloModoNome(modo) {
  var m = buscarModo(modo);
  return m ? m.nome : modo === 'desafio' ? 'Desafio do Dia' : 'Quiz';
}
function renderizarMinhaPosicao(lista) {
  if (!el.rankingMinhaPosicao) return;
  if (!lista.length) {
    el.rankingMinhaPosicao.innerHTML = '<div class="card suave minhapos"><span>' + ic('account_circle') + ' Sua posição: <strong>—</strong></span></div>';
    return;
  }
  // Melhor resultado é sempre o 1º da lista local (todos os registros são seus).
  var melhor = lista[0];
  var nv = calcularNivel(lerXpValido());
  el.rankingMinhaPosicao.innerHTML =
    '<div class="card suave minhapos">' +
      '<span class="minhapos-icone">' + (melhor.icon || '🧑‍🚀') + '</span>' +
      '<div class="minhapos-info">' +
        '<strong>Você está em 1º lugar</strong>' +
        '<small>Nível ' + nv.nivel + ' · ' + lerXpValido() + ' XP · Melhor pontuação: ' + lerRecorde() + '</small>' +
      '</div>' +
    '</div>';
}

/* ---------- 19) MULTIPLAYER / SALAS (Fase 3, arquitetura) ----------
   Preparado para WebSocket. NADA é simulado: enquanto a conexão não
   existir (BACKEND.conectado = false), a UI explica o fluxo e o botão
   fica desabilitado. Quando o backend for plugado, basta implementar
   os métodos de SalaTempoReal abaixo e ligar BACKEND.conectar(). */
var SalaTempoReal = {
  emPartida: false,
  sala: null,
  /* Fluxo previsto:
     criarSala(quizId) -> gera código (ex.: AKE492)
     entrarSala(codigo)
     iniciarHost()     -> distribui mesmas perguntas para todos
     responder(idx)    -> envia resposta com timestamp
     rankingPorRodada() -> tabela parcial após cada pergunta */
  criarSala: function (quizId) {
    if (!BACKEND.conectado) return Promise.reject(new Error('Backend não conectado.'));
    // Quando houver servidor: POST /salas -> { codigo, jogadorId }
    return Promise.resolve({ codigo: 'AKE492' });
  },
  entrarSala: function (codigo) {
    if (!BACKEND.conectado) return Promise.reject(new Error('Backend não conectado.'));
    return Promise.resolve(true);
  },
  enviarResposta: function (indice, pct) {
    if (!BACKEND.conectado) return false;
    return true;
  },
  rankingPorRodada: function () {
    if (!BACKEND.conectado) return null;
    return [];
  }
};
function renderizarCardSalas(container, resumido) {
  if (!container) return;
  if (BACKEND.conectado) {
    container.innerHTML = '<div class="estado-vazio"><span class="emoji">' + ic('hub') + '</span><p>Backend conectado! A tela de salas será habilitada aqui.</p></div>';
    return;
  }
  container.innerHTML =
    '<div class="sala-offline">' +
      '<span class="sala-offline-icone">' + ic('hub') + '</span>' +
      '<h3>Salas multiplayer em breve</h3>' +
      '<p>' + (resumido ? 'Crie uma sala, compartilhe o código e dispute a mesma partida em tempo real.' : '') + '</p>' +
      '<ol class="sala-fluxo">' +
        '<li><strong>Criar sala</strong> — um código como <em>SALA #AKE492</em> é gerado.</li>' +
        '<li><strong>Compartilhar código</strong> — convide outros jogadores.</li>' +
        '<li><strong>Host inicia</strong> — todos recebem as mesmas perguntas.</li>' +
        '<li><strong>Responder simultaneamente</strong> — pontos por velocidade e acerto.</li>' +
        '<li><strong>Ranking após cada rodada</strong> — tabela parcial ao vivo.</li>' +
        '<li><strong>Resultado final</strong> — pódio da sala.</li>' +
      '</ol>' +
      '<p class="sala-aviso">' + ic('construction') + ' Este modo precisa de um servidor WebSocket. A arquitetura está pronta em <code>BACKEND</code> e <code>SalaTempoReal</code> — basta plugar o servidor para ativar. Sem fake: nenhuma sala é simulada offline.</p>' +
      (BACKEND.conectado ? '' : '<p class="sala-exemplo">Exemplo de sala (aguardando backend):</p><pre class="sala-pre">SALA #AKE492\n1. Willian — 920 pts\n2. João — 810 pts\n3. Pedro — 760 pts</pre>') +
    '</div>';
}
function renderizarSalas() {
  if (!el.salasCard) return;
  renderizarCardSalas(el.salasCard, false);
}

/* ---------- 20) COMPARTILHAR RESULTADO (Fase 3) ---------- */
function textoCompartilhamento() {
  var p = ultimaPartida;
  if (!p) return '';
  var nome = lerNome();
  var tx = (p.taxa || 0);
  return 'Nivora\n\n' +
    nome + ' conseguiu ' + p.acertos + '/' + p.total + ' (' + tx + '%)!\n\n' +
    'Combo máximo: ' + (p.maiorCombo || 0) + '\n' +
    'Pontuação: ' + p.pontos.toLocaleString('pt-BR') + ' pts\n\n' +
    'Será que você consegue superar?';
}
function desenharShareCard() {
  if (!el.shareConteudo || !ultimaPartida) return;
  el.shareConteudo.innerHTML =
    '<div class="share-head"><span>' + ic('quiz') + '</span> Nivora</div>' +
    '<div class="share-score">' + ultimaPartida.acertos + '/' + (ultimaPartida.total || 0) + '</div>' +
    '<div class="share-linha">' + ic('local_fire_department') + ' Combo máximo: <strong>' + (ultimaPartida.maiorCombo || 0) + '</strong></div>' +
    '<div class="share-linha">' + ic('emoji_events') + ' Pontuação: <strong>' + ultimaPartida.pontos.toLocaleString('pt-BR') + '</strong></div>' +
    '<div class="share-challenge">Será que você consegue superar?</div>';
}
function compartilharResultado() {
  var texto = textoCompartilhamento();
  if (!texto) return;
  if (el.shareCard) {
    desenharShareCard();
    el.shareCard.classList.remove('hidden');
  }
  // Web Share API
  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({ title: 'Nivora', text: texto, url: location.href })
      .catch(function () { copiarParaAreaDeTransferencia(texto); });
    return;
  }
  copiarParaAreaDeTransferencia(texto);
}
function copiarParaAreaDeTransferencia(texto) {
  var feito = function () { mostrarMensagem(ic('content_copy') + ' Resultado copiado!', 'var(--ok)'); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(feito).catch(function () { areaDeTransferenciaFallback(texto); feito(); });
    return;
  }
  areaDeTransferenciaFallback(texto);
  feito();
}
function areaDeTransferenciaFallback(texto) {
  var ta = document.createElement('textarea');
  ta.value = texto;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  if (ta.parentNode) ta.parentNode.removeChild(ta);
}
function baixarImagemShare() {
  if (!ultimaPartida) return;
  var canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1920;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Fundo
  var g = ctx.createLinearGradient(0, 0, 0, 1920);
  g.addColorStop(0, '#151833'); g.addColorStop(1, '#0e1020');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1920);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#7c6cf0';
  ctx.font = 'bold 96px Segoe UI, sans-serif';
  ctx.fillText('🧠 Nivora', 540, 260);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 200px Segoe UI, sans-serif';
  ctx.fillText(ultimaPartida.acertos + '/' + (ultimaPartida.total || 0), 540, 560);

  ctx.fillStyle = '#a9b0d8';
  ctx.font = '40px Segoe UI, sans-serif';
  ctx.fillText('🔥 Combo máximo: ' + (ultimaPartida.maiorCombo || 0), 540, 720);
  ctx.fillText('🏆 Pontuação: ' + ultimaPartida.pontos.toLocaleString('pt-BR') + ' pts', 540, 800);
  ctx.fillText('🎯 Aproveitamento: ' + (ultimaPartida.taxa || 0) + '%', 540, 880);

  ctx.fillStyle = '#4aa8ff';
  ctx.font = 'bold 56px Segoe UI, sans-serif';
  ctx.fillText('Será que você consegue superar?', 540, 1100);

  var a = document.createElement('a');
  a.download = 'nivora-resultado.png';
  a.href = canvas.toDataURL('image/png');
  document.body.appendChild(a);
  a.click();
  if (a.parentNode) a.parentNode.removeChild(a);
}

/* ---------- 21) CONQUISTAS ---------- */
function lerConquistas() { return lerLista(CHAVE.conquistas); }
function desbloquear(id) {
  var lista = lerConquistas();
  if (lista.indexOf(id) >= 0) return false;
  lista.push(id); gravarTexto(CHAVE.conquistas, JSON.stringify(lista)); return true;
}
function progressoConquista(def) {
  var s = lerStats(), xp = lerXpValido(), seq = calcularStreak();
  var v = 0;
  switch (def.tipo) {
    case 'jogos': v = s.jogos; break;
    case 'maiorCombo': v = s.maiorCombo; break;
    case 'rapidas': v = s.rapidas; break;
    case 'perfeitos': v = s.perfeitos; break;
    case 'nivel': v = calcularNivel(xp).nivel; break;
    case 'pontos': v = s.maiorPontos; break;
    case 'recorde': v = lerRecorde() > 0 ? 1 : 0; break;
    case 'desafios': v = s.desafios; break;
    case 'streak': v = seq.maior; break;
    case 'sobSeq': v = s.sobrevSeq || 0; break;
    case 'blitzPontos': v = s.blitzPontos || 0; break;
    case 'contraPontos': v = s.contraPontos || 0; break;
    case 'modosJogados': v = s.modosDistintos || 0; break;
  }
  return { valor: v, alvo: def.alvo };
}
function lerXpValido() { return lerNumero(CHAVE.xp); }
function renderizarConquistas() {
  if (!el.conquistas) return;
  var ganhas = lerConquistas();
  el.conquistas.innerHTML = '';
  CONQUISTAS_DEF.forEach(function (def) {
    var ok = ganhas.indexOf(def.id) >= 0;
    var p = progressoConquista(def);
    var pct = ok ? 100 : Math.min(100, Math.round((p.valor / p.alvo) * 100));
    var d = document.createElement('div');
    d.className = 'conquista' + (ok ? '' : ' bloqueada');
    d.innerHTML =
      '<div class="icone">' + (ok ? def.icone : ic('lock')) + '</div>' +
      '<div class="nome">' + def.nome + '</div>' +
      '<div class="desc">' + def.desc + '</div>' +
      '<div class="conq-prog"><div class="conq-bar"><div class="conq-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="conq-count">' + (ok ? ic('check_circle') : p.valor + '/' + p.alvo) + '</span></div>';
    el.conquistas.appendChild(d);
  });
  if (el.conquistasProgresso)
    el.conquistasProgresso.textContent = ganhas.length + ' de ' + CONQUISTAS_DEF.length + ' conquistas';
}
function checarConquistas() {
  var novas = [];
  CONQUISTAS_DEF.forEach(function (def) {
    var p = progressoConquista(def);
    if (p.valor >= p.alvo && desbloquear(def.id)) novas.push(def.id);
  });
  return novas;
}

/* ---------- 22) PERFIL (competição, Fase 3) ---------- */
function renderizarPerfil() {
  var s = lerStats();
  var xp = lerXpValido();
  var nv = calcularNivel(xp);
  var seq = calcularStreak();

  el.perfilNome.textContent = lerNome();
  el.perfilNivel.textContent = nv.nivel;
  el.perfilXp.textContent = xp + ' XP (' + nv.xpNoNivel + ' para o nível ' + (nv.nivel + 1) + ')';
  el.barraXp.style.width = nv.progresso + '%';

  var respondidas = (s.acertos || 0) + (s.erros || 0);
  var taxa = respondidas ? Math.round(((s.acertos || 0) / respondidas) * 100) : 0;
  var divStats = [
    ['🎮', s.jogos, 'Quizzes'],
    ['❓', respondidas, 'Perguntas'],
    ['✅', s.acertos, 'Acertos'],
    ['❌', s.erros, 'Erros'],
    ['🎯', taxa + '%', 'Taxa de acerto'],
    ['🌈', s.maiorCombo, 'Maior combo'],
    ['🏆', lerRecorde(), 'Melhor'],
    ['📅', seq.atual, 'Streak']
  ];
  el.perfilStats.innerHTML = '';
  divStats.forEach(function (c) {
    var d = document.createElement('div');
    d.className = 'stat-card';
    d.innerHTML = '<span class="stat-valor">' + c[1] + '</span><span class="stat-rotulo">' + c[2] + '</span>';
    el.perfilStats.appendChild(d);
  });
  renderizarCompeticao();
  renderizarRecordes();
  renderizarCompetitivo();
  renderizarHistorico();
  renderizarCalendarioStreak();
}

function renderizarCompeticao() {
  if (!el.perfilCompeticao) return;
  var s = lerStats();
  var partes = lerPartidas();
  var ganhas = lerConquistas();
  var melhorPos = '1º';
  var melhorPontos = partes.length ? partes[0].pontos : lerRecorde();
  var mediaPontos = partes.length ? Math.round(partes.reduce(function (a, p) { return a + p.pontos; }, 0) / partes.length) : 0;

  el.perfilCompeticao.innerHTML =
    '<div class="competicao-grid">' +
      '<div class="stat-card"><span class="stat-valor">' + melhorPos + '</span><span class="stat-rotulo">Melhor posição (ranking)</span></div>' +
      '<div class="stat-card"><span class="stat-valor">' + melhorPontos + '</span><span class="stat-rotulo">Melhor pontuação</span></div>' +
      '<div class="stat-card"><span class="stat-valor">' + mediaPontos + '</span><span class="stat-rotulo">Média de pontos</span></div>' +
      '<div class="stat-card"><span class="stat-valor">' + ganhas.length + '/' + CONQUISTAS_DEF.length + '</span><span class="stat-rotulo">Medalhas desbloqueadas</span></div>' +
    '</div>' +
    (BACKEND.conectado ? '' : '<p class="descricao-bloco comp-aviso">' + ic('cloud_off') + ' Offline — posição e média consideram apenas o seu histórico local.</p>');
}

function renderizarRecordes() {
  if (!el.perfilRecordes) return;
  var s = lerStats();
  var partes = lerPartidas();
  var modosJogados = MODOS.map(function (m) {
    var ms = sDeModo(m.id);
    var qtd = partes.filter(function (p) { return p.modo === m.id; }).length;
    return '<div class="recorde-linha" style="--modo-cor:' + m.cor + '">' +
      '<span class="recorde-icone">' + iconeModoHTML(m.id) + '</span>' +
      '<div class="recorde-info">' +
        '<strong>' + m.nome + '</strong>' +
        '<small>' + qtd + ' partida(s) · melhor ' + (ms ? ms.pontos : 0) + ' pts</small>' +
      '</div>' +
    '</div>';
  }).join('');
  var chunks2 = [
    ['🌳', 'Sobrevivência (maior sequência)', s.sobrevSeq || 0],
    ['⚡', 'Blitz (melhor pontuação)', s.blitzPontos || 0],
    ['⏰', 'Contra o Tempo (melhor pontuação)', s.contraPontos || 0]
  ].map(function (c) {
    return '<div class="stat-card"><span class="stat-valor">' + c[2] + '</span><span class="stat-rotulo">' + c[1] + '</span></div>';
  }).join('');
  el.perfilRecordes.innerHTML = '<div class="grade-stats">' + chunks2 + '</div>' + modosJogados;
}

function renderizarCompetitivo() {
  if (!el.perfilCompetitivo) return;
  var partes = lerPartidas();
  if (partes.length === 0) {
    el.perfilCompetitivo.innerHTML = '<div class="estado-vazio"><p>Nenhuma partida competitiva ainda. Explore os modos!</p></div>';
    return;
  }
  el.perfilCompetitivo.innerHTML = partes.slice(0, 8).map(function (p) {
    var m = buscarModo(p.modo);
    return '<li class="hist-item">' +
      '<span class="hist-icon">' + (m ? iconeModoHTML(m.id) : iconeModoHTML(p.modo)) + '</span>' +
      '<span class="hist-info"><strong>' + (m ? m.nome : 'Quiz') + '</strong><small>' + p.dataFmt + '</small></span>' +
      '<span class="hist-pct">' + (p.taxa || 0) + '%</span>' +
      '<span class="pts">' + p.pontos + ' pts</span></li>';
  }).join('');
}

function renderizarHistorico() {
  if (!el.perfilHistorico) return;
  var lista = lerHistorico();
  if (lista.length === 0) {
    el.perfilHistorico.innerHTML = '<div class="estado-vazio"><p>Nenhuma partida ainda. Vá jogar!</p></div>';
    return;
  }
  el.perfilHistorico.innerHTML = lista.slice(0, 8).map(function (h, i) {
    return '<li class="hist-item"><span class="hist-icon">' + (h.icon || iconeModoHTML('normal')) + '</span>' +
      '<span class="hist-info"><strong>' + h.titulo + '</strong><small>' + h.quando + '</small></span>' +
      '<span class="hist-pct">' + h.pct + '%</span>' +
      '<span class="pts">' + h.pontos + ' pts</span></li>';
  }).join('');
}

function renderizarCalendarioStreak() {
  if (!el.perfilStreak) return;
  var seq = calcularStreak();
  var dias = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var dIso = iso(d);
    dias.push({
      rotulo: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()],
      iso: dIso,
      ativo: seq.dias.indexOf(dIso) >= 0,
      hoje: dIso === hojeISO()
    });
  }
  el.perfilStreak.innerHTML =
    '<div class="streak-topo">' + ic('local_fire_department') + ' Desde ontem: <strong>' + seq.atual + '</strong> dias · Recorde: <strong>' + seq.maior + '</strong></div>' +
    '<div class="streak-semana">' + dias.map(function (d) {
      return '<div class="streak-dia' + (d.ativo ? ' ativo' : '') + (d.hoje ? ' hoje' : '') + '">' +
        '<small>' + d.rotulo + '</small><b>' + (d.ativo ? ic('local_fire_department') : d.iso.slice(8)) + '</b></div>';
    }).join('') + '</div>';
}

/* ---------- 23) MOTOR DO QUIZ ---------- */
function entrarNoQuiz(id) {
  var quiz = buscarQuiz(id) || QUIZZES[0];
  var pool = perguntasDoQuiz(quiz);
  if (!pool.length) return;
  pararTudo();
  modoAtual = 'normal';
  quizAtual = quiz;
  if (el.modoChip) el.modoChip.classList.add('hidden');
  prepararPartida(pool.slice(0, Math.min(QUANTAS_PERGUNTAS, pool.length)));
}
function prepararPartida(pool) {
  var copia = pool.slice();
  for (var i = copia.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = copia[i]; copia[i] = copia[j]; copia[j] = t;
  }
  perguntasSorteio = copia;

  indiceAtual = 0; pontuacao = 0; sequenciaCerta = 0; maiorCombo = 0;
  acertos = 0; erros = 0; rapidas = 0; respondeu = false; tempoTotalUsado = 0;
  fimSobrev = false;

  if (modoAtual === 'contra-tempo') {
    tempoGeral = tempoGeralMax;
  }

  el.pontuacao.textContent = '0';
  el.acertosTela.textContent = '0';
  el.errosTela.textContent = '0';

  mostrarTela('quiz');
  mostrarPergunta();
}

function perguntaAtual() {
  if (modoAtual === 'sobrevivencia') {
    // Dificuldade sobe conforme os acertos da partida.
    var difMeta = dificuldadeSobrevivencia(acertos);
    var candidatas = PERGUNTAS.concat(perguntasSorteio).filter(function (p) {
      return p.dificuldade === difMeta;
    });
    if (!candidatas.length) candidatas = perguntasSorteio;
    return candidatas[Math.floor(Math.random() * candidatas.length)];
  }
  if (perguntasSorteio.length) {
    return perguntasSorteio[indiceAtual % perguntasSorteio.length];
  }
  return PERGUNTAS[Math.floor(Math.random() * PERGUNTAS.length)];
}
function dificuldadeSobrevivencia(acertosPartida) {
  if (acertosPartida < 4) return 'facil';
  if (acertosPartida < 9) return 'medio';
  if (acertosPartida < 14) return 'dificil';
  return 'insano';
}

function mostrarPergunta() {
  pararTimer();
  var pergunta = perguntaAtual();
  var total = totalPerguntasPartida();
  var infinito = (modoAtual === 'sobrevivencia' || modoAtual === 'contra-tempo');

  el.textoProgresso.innerHTML = rotuloProgresso(total, infinito);
  el.numeroPergunta.textContent = 'Pergunta ' + (indiceAtual + 1);
  if (infinito) {
    el.barraProgresso.style.width = Math.min(100, ((acertos) % 50) * 2) + '%';
  } else {
    el.barraProgresso.style.width = (indiceAtual / total) * 100 + '%';
  }

  var tipo = buscarTipo(pergunta.tipo || 'multipla');
  el.tipoPergunta.textContent = '· ' + tipo.nome;

  if (pergunta.valor > 1) {
    el.seloBonus.classList.remove('hidden');
    el.chipPremio.classList.remove('hidden');
    el.chipPremio.innerHTML = ic('stars') + ' x' + pergunta.valor;
  } else {
    el.seloBonus.classList.add('hidden');
    el.chipPremio.classList.add('hidden');
  }

  el.textoPergunta.textContent = pergunta.pergunta;
  el.areaRespostas.innerHTML = '';
  pergunta.alternativas.forEach(function (alt, i) {
    var b = document.createElement('button');
    b.className = 'answer-btn';
    b.textContent = alt;
    b.addEventListener('click', function () { responder(i, b, pergunta.valor); });
    el.areaRespostas.appendChild(b);
  });

  el.areaExplicacao.innerHTML = '';
  el.areaExplicacao.classList.add('hidden');

  respondeu = false;
  contarPergunta();
}
function totalPerguntasPartida() {
  if (modoAtual === 'sobrevivencia' || modoAtual === 'contra-tempo') return Infinity;
  if (modoAtual === 'blitz') return QUANTAS_BLITZ;
  return perguntasSorteio.length || QUANTAS_PERGUNTAS;
}
function rotuloProgresso(total, infinito) {
  if (modoAtual === 'sobrevivencia') return ic('shield_moon') + ' Sobrevivência · Acerto ' + (indiceAtual + 1);
  if (modoAtual === 'blitz') return ic('bolt') + ' Blitz · Pergunta ' + (indiceAtual + 1) + ' de ' + QUANTAS_BLITZ;
  if (modoAtual === 'contra-tempo') return ic('timer') + ' Contra o Tempo · Pergunta ' + (indiceAtual + 1);
  return 'Pergunta ' + (indiceAtual + 1) + ' de ' + total;
}

function contarPergunta() {
  pararTimer();

  // Contra o Tempo usa relógio contínuo global (não por pergunta).
  if (modoAtual === 'contra-tempo') {
    if (tempoGeralMax <= 0) tempoGeralMax = TEMPO_CONTRA_INICIAL;
    tempoGeral = (tempoGeral <= 0) ? tempoGeralMax : tempoGeral;
    el.numTimer.textContent = tempoGeral;
    el.barraTimer.style.width = Math.max(0, Math.min(100, (tempoGeral / tempoGeralMax) * 100)) + '%';
    el.numTimer.classList.remove('warning', 'danger');
    el.barraTimer.style.background = 'var(--ok)';
    cronometroGlobal = setInterval(function () {
      tempoGeral--;
      el.numTimer.textContent = Math.max(0, tempoGeral);
      el.barraTimer.style.width = Math.max(0, (tempoGeral / tempoGeralMax) * 100) + '%';
      if (tempoGeral <= 5) { el.numTimer.classList.add('danger'); el.barraTimer.style.background = 'var(--erro)'; }
      else if (tempoGeral <= 9) { el.numTimer.classList.add('warning'); el.barraTimer.style.background = 'var(--aviso)'; }
      if (tempoGeral <= 0) { pararTudo(); finalizarPartida(); }
    }, 1000);
    return;
  }

  var tempo = tempoDaPergunta();
  segundosPorPergunta = tempo;
  tempoRestante = tempo;
  el.numTimer.textContent = tempoRestante;
  el.barraTimer.style.width = '100%';
  el.numTimer.classList.remove('warning', 'danger');
  el.barraTimer.style.background = 'var(--ok)';

  cronometro = setInterval(function () {
    tempoRestante--;
    el.numTimer.textContent = tempoRestante;
    var porc = Math.max(0, (tempoRestante / segundosPorPergunta) * 100);
    el.barraTimer.style.width = porc + '%';
    if (tempoRestante <= 5) { el.numTimer.classList.add('danger'); el.barraTimer.style.background = 'var(--erro)'; }
    else if (tempoRestante <= 9) { el.numTimer.classList.add('warning'); el.barraTimer.style.background = 'var(--aviso)'; }
    if (tempoRestante <= 0) { pararTimer(); tempoEsgotado(); }
  }, 1000);
}
function tempoDaPergunta() {
  if (modoAtual === 'blitz') return TEMPO_BLITZ;
  if (modoAtual === 'sobrevivencia') {
    var d = dificuldadeSobrevivencia(acertos);
    return TEMPO_POR_DIFICULDADE[d] || 15;
  }
  var dif = quizAtual ? quizAtual.dificuldade : 'medio';
  return TEMPO_POR_DIFICULDADE[dif] || 20;
}

function pararTimer() {
  if (cronometro !== null) { clearInterval(cronometro); cronometro = null; }
}
function pararTudo() {
  pararTimer();
  if (cronometroGlobal !== null) { clearInterval(cronometroGlobal); cronometroGlobal = null; }
}

function tempoEsgotado() {
  if (respondeu) return;
  respondeu = true;
  erros++;
  el.errosTela.textContent = erros;
  tempoTotalUsado += segundosPorPergunta;

  var botoes = el.areaRespostas.querySelectorAll('.answer-btn');
  botoes.forEach(function (b) { b.disabled = true; });
  var pergunta = perguntaAtual();
  var okIdx = pergunta.correta;
  if (botoes[okIdx]) botoes[okIdx].classList.add('correct');

  sequenciaCerta = 0;
  el.chipCombo.style.display = 'none';
  el.numeroSeq.textContent = '0';

  tocarSom(false);
  mostrarExplicacao(false, pergunta);

  // Sobrevivência: erro (ou tempo) encerra imediatamente.
  if (modoAtual === 'sobrevivencia') {
    fimSobrev = true;
    setTimeout(function () { finalizarPartida(); }, 2600);
    return;
  }
  if (modoAtual === 'contra-tempo') {
    // Erro por tempo no contra-tempo já tratado pelo relógio global; se chegar aqui (defensivo) encerra.
    finalizarPartida();
    return;
  }
  mostrarMensagem('⏰ Tempo esgotado!', 'var(--erro)');
  proximaPergunta();
}

function responder(idx, botao, valor) {
  if (respondeu) return;
  respondeu = true;
  pararTimer();

  var tempoUsado = segundosPorPergunta - tempoRestante;
  if (modoAtual === 'contra-tempo') tempoUsado = 1; // sem cronômetro por pergunta
  tempoTotalUsado += tempoUsado;

  var todos = el.areaRespostas.querySelectorAll('.answer-btn');
  todos.forEach(function (b) { b.disabled = true; });

  var pergunta = perguntaAtual();
  var certa = pergunta.correta;

  if (idx === certa) {
    acertos++; el.acertosTela.textContent = acertos;
    sequenciaCerta++;
    if (sequenciaCerta > maiorCombo) maiorCombo = sequenciaCerta;
    el.chipCombo.style.display = 'inline-flex';
    el.numeroSeq.textContent = sequenciaCerta;
    if (tempoUsado <= 4 && modoAtual !== 'contra-tempo') rapidas++;

    var pontosBase = PONTOS_CERTA + BONUS_COMBO * (sequenciaCerta - 1);
    var ganho = pontosBase * (valor || 1);
    if (modoAtual === 'blitz') {
      // Pontos por velocidade: quanto mais rápido, mais pontos (até 2x).
      ganho = Math.round(pontosBase * (1 + tempoRestante / (tempoDaPergunta() || 1)));
    }
    if (modoAtual === 'contra-tempo') {
      tempoGeral = Math.min(tempoGeralMax, tempoGeral + CONTRA_ACERTO);
      el.numTimer.textContent = tempoGeral;
    }
    pontuacao += ganho;
    el.pontuacao.textContent = pontuacao;

    botao.classList.add('correct');
    tocarSom(true);
    criarConfete();
    mostrarMensagem('+ ' + ganho + ' pts', 'var(--ok)');
    mostrarExplicacao(true, pergunta);
  } else {
    botao.classList.add('wrong');
    if (todos[certa]) todos[certa].classList.add('correct');
    erros++;
    el.errosTela.textContent = erros;
    sequenciaCerta = 0;
    el.numeroSeq.textContent = '0';
    el.chipCombo.style.display = 'none';

    if (modoAtual === 'contra-tempo') {
      tempoGeral = Math.max(1, tempoGeral - CONTRA_PENALIDADE);
      el.numTimer.textContent = tempoGeral;
      pararTudo();
      if (tempoGeral <= 0) {
        setTimeout(function () { finalizarPartida(); }, 1200);
        return;
      }
    }
    tocarSom(false);
    mostrarExplicacao(false, pergunta);
    if (modoAtual === 'sobrevivencia') {
      fimSobrev = true;
      setTimeout(function () { finalizarPartida(); }, 1200);
      return;
    }
  }

  proximaPergunta();
}

function mostrarExplicacao(acertou, pergunta) {
  el.areaExplicacao.innerHTML = '';
  el.areaExplicacao.classList.remove('hidden');
  el.areaExplicacao.className = 'area-explicacao ' + (acertou ? 'certo' : 'erro');
  el.areaExplicacao.innerHTML =
    '<div class="explicacao-status">' + (acertou ? ic('check_circle') + ' Resposta correta!' : ic('cancel') + ' Você errou.') + '</div>' +
    '<div class="explicacao-resposta">Resposta certa: <strong>' + pergunta.alternativas[pergunta.correta] + '</strong></div>' +
    (pergunta.explicacao ? '<div class="explicacao-texto">' + ic('lightbulb') + ' ' + pergunta.explicacao + '</div>' : '');
}

function proximaPergunta() {
  setTimeout(function () {
    if (fimSobrev) { return; }
    indiceAtual++;
    if (modoAtual === 'sobrevivencia' || modoAtual === 'contra-tempo') {
      mostrarPergunta(); // infinito
      return;
    }
    if (indiceAtual < perguntasSorteio.length) mostrarPergunta();
    else finalizarPartida();
  }, 2600);
}

/* ---------- 24) FINAL DA PARTIDA (competitiva) ---------- */

/* Total final considerado (Infinity vira acertos contados para exibição) */
function totalInfinito() {
  if (modoAtual === 'sobrevivencia' || modoAtual === 'contra-tempo') return acertos + (modoAtual === 'sobrevivencia' ? 1 : erros);
  return perguntasSorteio.length || QUANTAS_PERGUNTAS;
}

function finalizarPartida() {
  pararTudo();
  var total = totalPerguntasPartida();
  var respondidas = acertos + erros;
  var percentual = Math.round((acertos / Math.max(1, respondidas)) * 100);

  var tempoMedio = tempoTotalUsado && Math.round(tempoTotalUsado / Math.max(1, respondidas));
  if (modoAtual === 'contra-tempo') tempoMedio = Math.max(0, tempoGeralMax - tempoGeral);

  var novoRecorde = pontuacao > lerRecorde();
  if (novoRecorde) gravarTexto(CHAVE.recorde, pontuacao);

  var xpGanho = acertos * XP_ACERTO + maiorCombo * XP_COMBO + XP_COMPLETAR;
  if (percentual === 100) xpGanho += XP_PERFEITO;
  if (modoAtual === 'desafio') xpGanho += XP_DESAFIO;
  if (modoAtual === 'sobrevivencia' || modoAtual === 'blitz' || modoAtual === 'contra-tempo') xpGanho += XP_DESAFIO;

  var s = lerStats();
  s.jogos++; s.acertos += acertos; s.erros += erros; s.rapidas += rapidas;
  if (maiorCombo > s.maiorCombo) s.maiorCombo = maiorCombo;
  if (percentual === 100) s.perfeitos++;
  if (pontuacao > s.maiorPontos) s.maiorPontos = pontuacao;
  if (modoAtual === 'desafio') s.desafios++;
  if (modoAtual === 'sobrevivencia') s.sobrevSeq = Math.max(s.sobrevSeq || 0, acertos);
  if (modoAtual === 'blitz') s.blitzPontos = Math.max(s.blitzPontos || 0, pontuacao);
  if (modoAtual === 'contra-tempo') s.contraPontos = Math.max(s.contraPontos || 0, pontuacao);

  // Conta modos distintos jogados (para conquista 'modosJogados')
  var modosSet = {};
  lerPartidas().forEach(function (p) { modosSet[p.modo] = true; });
  modosSet[modoAtual] = true;
  s.modosDistintos = Object.keys(modosSet).filter(function (k) { return k !== 'normal'; }).length;
  salvarStats(s);

  var xpAntes = lerXpValido();
  var novas = checarConquistas();
  xpGanho += novas.length * XP_CONQUISTA;
  gravarTexto(CHAVE.xp, xpAntes + xpGanho);

  var nivelAntes = calcularNivel(xpAntes);
  var nivelDepois = calcularNivel(xpAntes + xpGanho);
  if (nivelDepois.nivel > nivelAntes.nivel)
    setTimeout(function () { mostrarNivelUp(nivelDepois.nivel); }, 400);

  var seq = registrarAtividade();

  registrarHistorico({
    quiz: quizAtual ? quizAtual.id : 'modo-' + modoAtual,
    titulo: tituloPartida(),
    icon: iconePartida(),
    quando: new Date().toLocaleDateString('pt-BR'),
    pontos: pontuacao,
    pct: percentual
  });

  var dataFmt = new Date().toLocaleDateString('pt-BR');
  ultimaPartida = {
    ts: Date.now(),
    dataISO: hojeISO(),
    dataFmt: dataFmt,
    modo: modoAtual,
    nome: lerNome(),
    icon: iconePartida(),
    pontos: pontuacao,
    xp: xpGanho,
    acertos: acertos,
    erros: erros,
    total: Math.min(Math.max(total, respondidas), acertos + erros + acertos || 1),
    percentual: percentual,
    taxa: percentual,
    maiorCombo: maiorCombo,
    nivel: nivelDepois.nivel
  };
  registrarPartida(ultimaPartida);

  var ranking = lerLista(CHAVE.ranking);
  ranking.push({ nome: lerNome() + ' · ' + tituloPartida(), pontos: pontuacao });
  ranking.sort(function (a, b) { return b.pontos - a.pontos; });
  gravarTexto(CHAVE.ranking, JSON.stringify(ranking.slice(0, LIMITE_RANKING)));

  if (modoAtual === 'desafio') {
    var d = lerObjeto(CHAVE.desafio, { hoje: '', melhor: -1 });
    var venceuRecorde = d.hoje === hojeISO() ? (pontuacao >= d.melhor) : true;
    if (venceuRecorde) {
      gravarTexto(CHAVE.desafio, JSON.stringify({ hoje: hojeISO(), melhor: pontuacao, acertos: acertos, total: PERGUNTAS_DESAFIO }));
    }
    enviarDesafioGlobal();
  }

  montarResultado(percentual, tempoMedio, xpGanho, seq, novas, novoRecorde);
}

function tituloPartida() {
  if (modoAtual === 'sobrevivencia') return 'Sobrevivência';
  if (modoAtual === 'blitz') return 'Blitz';
  if (modoAtual === 'contra-tempo') return 'Contra o Tempo';
  if (modoAtual === 'desafio') return 'Desafio do Dia';
  return quizAtual ? quizAtual.titulo : 'Quiz';
}
function iconePartida() {
  if (modoAtual === 'sobrevivencia') return '⚔️';
  if (modoAtual === 'blitz') return '⚡';
  if (modoAtual === 'contra-tempo') return '⏰';
  if (modoAtual === 'desafio') return '🎯';
  return quizAtual && quizAtual.capa ? quizAtual.capa.emoji : '🧠';
}
function iconeModoHTML(modo) {
  var mapa = {
    sobrevivencia: 'shield_moon',
    blitz: 'bolt',
    'contra-tempo': 'timer',
    desafio: 'flag',
    normal: 'quiz',
    competitivo: 'emoji_events'
  };
  return ic(mapa[modo] || 'quiz');
}

function montarResultado(percentual, tempoMedio, xpGanho, seq, novas, novoRecorde) {
  var totalFinal = totalInfinito();
  el.pontuacaoFinal.textContent = pontuacao + ' pontos';
  el.rAcertos.textContent = acertos;
  el.rErros.textContent = erros;
  el.rPercentual.textContent = percentual + '%';
  el.rCombo.textContent = 'x' + maiorCombo;
  el.rTempo.textContent = (tempoMedio || 0) + 's';
  el.rXp.textContent = '+' + xpGanho + ' XP';
  el.melhorPontuacao.innerHTML = ic('emoji_events') + ' Melhor pontuação: ' + lerRecorde();

  // Nota competitiva (Fase 3)
  if (!BACKEND.conectado) {
    if (el.resultadoNota) {
      el.resultadoNota.classList.remove('hidden');
      el.resultadoNota.innerHTML =
        '<div class="nota-linha"><span>' + ic('sports_esports') + ' Modo:</span><strong>' + tituloPartida() + '</strong></div>' +
        '<div class="nota-linha"><span>' + ic('leaderboard') + ' Posição no ranking (local):</span><strong>1º</strong></div>' +
        (modoAtual === 'sobrevivencia' || modoAtual === 'blitz' || modoAtual === 'contra-tempo'
          ? '<div class="nota-linha"><span>Recorde do modo:</span><strong>' + (sRecordeModoDoJogador(modoAtual)) + ' pts</strong></div>'
          : '') +
        '<p class="descricao-bloco comp-aviso">' + ic('cloud_off') + ' Offline — posição e recorde consideram apenas o seu histórico local.</p>';
    }
  } else if (el.resultadoNota) {
    if (modoAtual === 'desafio') {
      el.resultadoNota.classList.remove('hidden');
      el.resultadoNota.innerHTML =
        '<div class="nota-linha"><span>' + ic('flag') + ' Desafio do Dia</span><strong>calculando posição…</strong></div>';
    } else {
      el.resultadoNota.classList.add('hidden');
    }
  }

  var nv = calcularNivel(lerXpValido());
  el.rNivel.textContent = 'Nível ' + nv.nivel;
  el.rBarraXp.style.width = nv.progresso + '%';
  el.rProgresso.textContent = nv.xpNoNivel + ' / ' + nv.xpNecessario + ' XP';

  if (el.rConquistas) {
    if (novas.length) {
      el.rConquistas.innerHTML = '<h3>' + ic('workspace_premium') + ' Novas conquistas!</h3><div class="resultado-conq">' +
        novas.map(function (id) {
          var def = CONQUISTAS_DEF.find(function (x) { return x.id === id; });
          return '<span class="resultado-medalha">' + def.icone + ' ' + def.nome + '</span>';
        }).join('') + '</div>';
    } else {
      el.rConquistas.innerHTML = '<h3>' + ic('workspace_premium') + ' Conquistas</h3><p class="descricao-bloco">Complete objetivos para desbloquear medalhas.</p>';
    }
  }

  if (el.rStreak) el.rStreak.innerHTML = '<span>' + ic('local_fire_department') + ' Sequência atual: <strong>' + seq.atual + '</strong> · Recorde: <strong>' + seq.maior + '</strong></span>';

  // Card de compartilhamento pronto para uso
  desenharShareCard();
  if (el.shareCard) el.shareCard.classList.remove('hidden');

  var emoji = 'emoji_events', titulo = 'Perfeito!', sub = '100% de acerto, que gênio!';
  if (percentual >= 80) { emoji = 'celebration'; titulo = 'Excelente!'; sub = 'Você arrasou!'; }
  else if (percentual >= 60) { emoji = 'sentiment_very_satisfied'; titulo = 'Muito bom!'; sub = 'Continue treinando!'; }
  else if (percentual >= 40) { emoji = 'sentiment_satisfied'; titulo = 'Bom começo'; sub = 'Esforço sempre ajuda!'; }
  else if (percentual >= 20) { emoji = 'fitness_center'; titulo = 'Não desista'; sub = 'Todo mestre já foi iniciante.'; }
  else { emoji = 'replay'; titulo = 'Tente de novo'; sub = 'Você consegue evoluir!'; }
  if (novoRecorde) sub += ' — Novo recorde!';

  el.emojiResultado.innerHTML = ic(emoji);
  el.tituloResultado.textContent = titulo;
  el.subtituloResultado.textContent = sub;

  if (percentual >= 60) criarConfete();
  mostrarTela('resultado');
  renderizarEstatisticas();
  renderizarRanking();
  renderizarConquistas();
}
function sRecordeModoDoJogador(modoId) {
  var m = sDeModo(modoId);
  return m ? m.pontos : 0;
}

function mostrarNivelUp(nivel) {
  if (!el.overlayNivel) return;
  el.overlayNivelTexto.textContent = 'Você subiu para o nível ' + nivel + '!';
  el.overlayNivel.classList.remove('hidden');
  criarConfete();
  setTimeout(function () { el.overlayNivel.classList.add('hidden'); }, 3500);
}

/* ---------- 25) MENSAGENS, CONFETE, SOM ---------- */
function mostrarMensagem(texto, cor) {
  var m = document.createElement('div');
  m.className = 'floating-msg';
m.innerHTML = texto;
  m.style.color = cor;
  document.body.appendChild(m);
  setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, 900);
}

function criarConfete() {
  var cores = ['#7c6cf0', '#4aa8ff', '#ff5b6a', '#ffb020', '#2ed573'];
  for (var i = 0; i < 26; i++) {
    var ped = document.createElement('div');
    ped.className = 'confetti-piece';
    ped.style.left = Math.random() * 100 + 'vw';
    ped.style.top = -12 + 'px';
    ped.style.animationDuration = (1.6 + Math.random() * 1.4) + 's';
    ped.style.backgroundColor = cores[i % cores.length];
    ped.style.width = (8 + Math.random() * 8) + 'px';
    ped.style.height = ped.style.width;
    ped.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(ped);
    (function (p) {
      setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 2800);
    })(ped);
  }
}

function tocarSom(acertou) {
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var ganho = ctx.createGain();
    osc.connect(ganho); ganho.connect(ctx.destination);
    osc.frequency.value = acertou ? 760 : 220;
    ganho.gain.value = 0.15;
    osc.start(); osc.stop(ctx.currentTime + 0.22);
  } catch (e) {}
}

/* ---------- 26) INICIAR ---------- */
function iniciar() {
  aplicarTema();
  iniciarNavegacao();
  iniciarMenuMobile();

  if (el.heroTotalPerguntas) el.heroTotalPerguntas.textContent = PERGUNTAS.length;
  if (el.heroTotalCats) el.heroTotalCats.textContent = CATEGORIAS.length;

  renderizarHome();
  renderizarModos();
  renderizarConquistas();
  renderizarPaginaQuizzes();
  renderizarRanking();
  renderizarSalas();
  renderizarAreaConta();
  iniciarBackend();
  mostrarTela('inicio');

  // Garantia: remove a tela de carregamento mesmo se alguma animação CSS falhar.
  var pre = q('preloader');
  if (pre) setTimeout(function () { pre.classList.add('done'); }, 3000);
}

/* ==========================================================
   FASE 4 - INTEGRAÇÃO COM BACKEND
   Conecta o front ao Pages Functions (/api/*) via js/api.js.
   Defensivo: sem backend conectado, o jogo funciona offline.
   ========================================================== */

/* ---------- 27) BACKEND: CONEXÃO ---------- */
function backendConectado() {
  return !!(window.API && window.API.conectado);
}

function iniciarBackend() {
  if (!window.API) return;
  window.API.iniciar().then(function (estadoApi) {
    renderizarAreaConta();
    if (estadoApi.usuario) {
      gravarTexto(CHAVE.nome, estadoApi.usuario.nome || '');
      window.API.sincronizar();
    }
    mostrarLinkAdmin(!!(estadoApi.usuario && estadoApi.usuario.papel === 'admin'));
  }).catch(function () { renderizarAreaConta(); });

  window.addEventListener('qake:sessao', function () {
    renderizarAreaConta();
    var u = window.API ? window.API.usuario : null;
    mostrarLinkAdmin(!!(u && u.papel === 'admin'));
    // Reflete o novo usuário no ranking do desafio (minha posição).
    var inicioVisivel = !document.getElementById(TELAS.inicio).classList.contains('hidden');
    carregarDesafioGlobal(true).then(function () {
      if (inicioVisivel && el.desafioCard) renderizarDesafio();
    }).catch(function () {});
  });
}

function mostrarLinkAdmin(visivel) {
  var link = q('nav-admin');
  if (link) link.classList.toggle('hidden', !visivel);
}

/* ---------- 28) CONTA NA NAVBAR ---------- */
function renderizarAreaConta() {
  var area = q('area-conta');
  if (!area) return;
  var u = window.API ? window.API.usuario : null;
  if (!u) {
    area.innerHTML = '<a href="#" class="btn btn-ghost btn-nav" data-navegar="conta">Entrar</a>';
    return;
  }
  area.innerHTML = '<a href="#" class="btn btn-ghost btn-nav" data-navegar="conta">' + ic('account_circle') + ' ' + esc(u.nome || u.email || 'Conta') + '</a>';
}

/* ---------- 29) TELA DE CONTA ---------- */
function renderizarConta() {
  var card = q('conta-card');
  if (!card) return;
  var sub = q('conta-subtitulo');
  var u = window.API ? window.API.usuario : null;

  if (!backendConectado()) {
    if (sub) sub.textContent = 'Backend indisponível. Você joga offline com o progresso salvo neste dispositivo.';
    card.innerHTML = '<div class="estado-vazio"><span class="emoji">' + ic('cloud_off') + '</span>' +
      '<p>Não conseguimos conectar ao servidor.</p>' +
      '<p>Jogue normalmente: tudo continua salvo aqui e será sincronizado quando o servidor voltar.</p></div>';
    return;
  }

  if (u) {
    if (sub) sub.textContent = 'Conectado. Seu progresso é sincronizado automaticamente entre dispositivos.';
    card.innerHTML =
      '<div style="display:grid;gap:10px;">' +
        '<p class="conta-intro">' + ic('account_circle') + ' <strong>' + esc(u.nome || 'Anônimo') + '</strong></p>' +
        '<p class="descricao-bloco">' + esc(u.email || '') + '</p>' +
        '<p class="descricao-bloco">XP, recorde, conquistas, favoritos e partidas ficam sincronizados.</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">' +
          '<button type="button" class="btn btn-ghost" data-conta="nome">' + ic('edit') + ' Editar nome</button>' +
          '<button type="button" class="btn btn-ghost" data-conta="sair">Sair</button>' +
        '</div>' +
      '</div>';
  } else {
    if (sub) sub.textContent = 'Entre para sincronizar seu progresso entre dispositivos.';
    card.innerHTML = htmlFormConta();
  }
  anexarAcoesConta(card, u);
}

function entradaEstilo() {
  return 'width:100%;padding:10px;border-radius:10px;border:1px solid rgba(127,127,127,.3);background:transparent;color:inherit;box-sizing:border-box;margin-top:4px;';
}

function htmlFormConta() {
  return '<form id="form-conta" data-modo="registro" novalidate>' +
    '<div style="display:grid;gap:10px;max-width:460px;">' +
      '<label class="descricao-bloco">Nome de exibição' +
        '<input type="text" id="conta-nome" placeholder="Como os outros vão te ver" style="' + entradaEstilo() + '"></label>' +
      '<label class="descricao-bloco">E-mail' +
        '<input type="email" id="conta-email" required placeholder="voce@email.com" style="' + entradaEstilo() + '"></label>' +
      '<label class="descricao-bloco">Senha' +
        '<input type="password" id="conta-senha" required minlength="8" placeholder="Mínimo 8 caracteres" style="' + entradaEstilo() + '"></label>' +
    '</div>' +
    '<p id="conta-msg" class="descricao-bloco" style="color:#e05a4f;display:none;"></p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">' +
      '<button type="submit" class="btn btn-primary">Criar conta e entrar</button>' +
      '<button type="button" class="btn btn-ghost" data-conta="logar">Já tenho conta</button>' +
    '</div>' +
  '</form>';
}

function anexarAcoesConta(card, u) {
  var bSair = card.querySelector('[data-conta="sair"]');
  if (bSair) bSair.addEventListener('click', function () {
    window.API.logout().then(function () {
      renderizarAreaConta(); mostrarLinkAdmin(false); renderizarConta();
      mostrarMensagem('Você saiu da conta.');
    });
  });

  var bNome = card.querySelector('[data-conta="nome"]');
  if (bNome) bNome.addEventListener('click', function () {
    var nome = prompt('Seu nome de exibição:', (u && u.nome) || '');
    if (nome === null) return;
    nome = nome.trim();
    if (!nome) { mostrarMsgConta('O nome não pode ser vazio.'); return; }
    window.API.atualizarMe({ nome: nome }).then(function () {
      renderizarAreaConta(); renderizarConta(); mostrarMensagem('Nome atualizado!');
    }).catch(function () { mostrarMsgConta('Não foi possível atualizar. Tente de novo.'); });
  });

  var form = card.querySelector('#form-conta');
  if (form) {
    var bLogar = form.querySelector('[data-conta="logar"]');
    if (bLogar) bLogar.addEventListener('click', function () {
      form.setAttribute('data-modo', 'login');
      var nome = form.querySelector('#conta-nome');
      if (nome) nome.parentNode.style.display = 'none';
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.textContent = 'Entrar na minha conta';
      var rotulo = form.querySelector('#conta-msg');
      if (rotulo) { rotulo.textContent = 'Digite e-mail e senha para entrar.'; rotulo.style.display = 'block'; rotulo.style.color = 'inherit'; }
      bLogar.remove();
      var extra = document.createElement('button');
      extra.type = 'button'; extra.className = 'btn btn-ghost'; extra.textContent = 'Criar nova conta';
      if (bLogar.parentNode) bLogar.parentNode.appendChild(extra);
      extra.addEventListener('click', renderizarConta);
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var modo = form.getAttribute('data-modo') || 'registro';
      var emailEl = form.querySelector('#conta-email');
      var senhaEl = form.querySelector('#conta-senha');
      var dados = { email: emailEl.value.trim(), senha: senhaEl.value };
      if (modo === 'registro') {
        var nomeEl = form.querySelector('#conta-nome');
        dados.nome = (nomeEl && nomeEl.value.trim()) || 'Estudante Nivora';
      }
      var acao = modo === 'login' ? window.API.login(dados) : window.API.registrar(dados);
      acao.then(function (d) {
        if (d && d.erro) { mostrarMsgConta(d.erro); return; }
        gravarTexto(CHAVE.nome, (d.usuario && d.usuario.nome) || '');
        renderizarAreaConta();
        mostrarLinkAdmin(!!(d.usuario && d.usuario.papel === 'admin'));
        renderizarConta();
        mostrarMensagem('Conta conectada!');
        if (window.API.sincronizar) window.API.sincronizar();
      }).catch(function (err) {
        mostrarMsgConta((err && err.erro) || 'Falha ao conectar. Confira os dados.');
      });
    });
  }
}

function mostrarMsgConta(texto) {
  var m = q('conta-msg');
  if (m) { m.textContent = texto; m.style.display = 'block'; return; }
  alert(texto);
}

/* ---------- 29b) UTILITÁRIOS DE HTML ---------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Ícone Material de interface (emojis ficam só para conteúdo/dados).
function ic(nome, ext) {
  return '<span class="material-symbols-rounded icone' + (ext ? ' ' + ext : '') + '" aria-hidden="true">' + nome + '</span>';
}

/* ---------- 30) CRIAR QUIZ (MANUAL + IA) ---------- */
var rascunhoPerguntas = [];
var rascunhoIAAtual = null;

function opcoesComboItens(lista, campo, sel) {
  return lista.map(function (item) {
    return '<option value="' + item.id + '"' + (item.id === (sel || '') ? ' selected' : '') + '>' + esc(item[campo] || item.id) + '</option>';
  }).join('');
}

function opcoesCategorias(sel) {
  return opcoesComboItens(CATEGORIAS, 'nome', sel || 'geral');
}

function opcoesDificuldades(sel) {
  return opcoesComboItens(DIFICULDADES, 'nome', sel || 'medio');
}

function renderizarCriar() {
  var card = q('criar-card');
  if (!card) return;
  card.innerHTML =
    '<div style="display:grid;gap:12px;max-width:560px;">' +
      '<button type="button" class="card suave" data-criar="manual" style="text-align:left;cursor:pointer;border:0;width:100%;">' +
        '<strong>' + ic('edit_note') + ' Criar manualmente</strong>' +
        '<p class="descricao-bloco" style="margin:0;">Escolha categoria e dificuldade e escreva suas próprias perguntas.</p></button>' +
      '<button type="button" class="card suave" data-criar="ia" style="text-align:left;cursor:pointer;border:0;width:100%;">' +
        '<strong>' + ic('auto_awesome') + ' Gerar com IA</strong>' +
        '<p class="descricao-bloco" style="margin:0;">Peça à IA perguntas sobre um tema. Você revisa antes de salvar.</p></button>' +
    '</div>' +
    '<div id="meus-quizzes" style="margin-top:24px;"></div>';
  card.querySelector('[data-criar="manual"]').addEventListener('click', renderizarCriarManual);
  card.querySelector('[data-criar="ia"]').addEventListener('click', renderizarCriarIA);
  renderizarMeusQuizzes();
}

function renderizarMeusQuizzes() {
  var area = q('meus-quizzes');
  if (!area) return;
  var meus = QUIZZES.filter(function (qz) { return qz.autor && qz.autor !== 'Equipe Nivora'; });
  if (!meus.length) { area.innerHTML = ''; return; }
  area.innerHTML = '<h3 class="titulo-bloco">Meus quizzes</h3>' +
    '<div style="display:grid;gap:10px;">' +
    meus.map(function (qz) {
      return '<div class="card suave" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;">' +
        '<div><strong>' + esc(qz.titulo) + '</strong>' +
        '<p class="descricao-bloco" style="margin:0;">' + qz.quantidade + ' perguntas · ' + esc(qz.categoria) + '</p></div>' +
        '<button type="button" class="btn btn-primary btn-nav" data-jogar="' + esc(qz.id) + '">Jogar</button>' +
      '</div>';
    }).join('') + '</div>';
  Array.prototype.forEach.call(area.querySelectorAll('[data-jogar]'), function (b) {
    b.addEventListener('click', function () { entrarNoQuiz(b.getAttribute('data-jogar')); });
  });
}

function renderizarCriarManual() {
  var card = q('criar-card');
  if (!card) return;
  card.innerHTML =
    '<button type="button" class="btn btn-ghost btn-nav" data-voltar-criar>← Voltar</button>' +
    '<h3 style="margin:10px 0;">' + ic('edit_note') + ' Criar quiz manual</h3>' +
    '<form id="form-criar-manual" novalidate>' +
      '<div style="display:grid;gap:10px;max-width:520px;">' +
        '<label class="descricao-bloco">Título' +
          '<input type="text" id="cm-titulo" required placeholder="Ex.: Quiz de Futebol" style="' + entradaEstilo() + '"></label>' +
        '<label class="descricao-bloco">Descrição' +
          '<textarea id="cm-descricao" rows="2" placeholder="Uma frase sobre o quiz" style="' + entradaEstilo() + '"></textarea></label>' +
        '<label class="descricao-bloco">Categoria' +
          '<select id="cm-categoria" style="' + entradaEstilo() + '">' + opcoesCategorias('geral') + '</select></label>' +
        '<label class="descricao-bloco">Dificuldade' +
          '<select id="cm-dificuldade" style="' + entradaEstilo() + '">' + opcoesDificuldades('medio') + '</select></label>' +
      '</div>' +
      '<div id="cm-lista" style="margin-top:16px;"></div>' +
      '<button type="button" class="btn btn-ghost" id="cm-adicionar" style="margin-top:6px;">+ Adicionar pergunta</button>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">' +
        '<button type="submit" class="btn btn-primary">Salvar e jogar</button>' +
      '</div>' +
    '</form>';
  card.querySelector('[data-voltar-criar]').addEventListener('click', renderizarCriar);
  q('cm-adicionar').addEventListener('click', function () {
    rascunhoPerguntas.push({ pergunta: '', alt: ['', '', '', ''], correta: 0 });
    renderizarListaPerguntas();
  });
  q('form-criar-manual').addEventListener('submit', salvarQuizManual);
  renderizarListaPerguntas();
}

function renderizarListaPerguntas() {
  var area = q('cm-lista');
  if (!area) return;
  area.innerHTML = rascunhoPerguntas.map(function (p, i) {
    var selOpcoes = (p.alt || []).map(function (alt, j) {
      return '<option value="' + j + '"' + (p.correta === j ? ' selected' : '') + '>' + (j + 1) + '</option>';
    }).join('');
    return '<div class="card suave" style="padding:12px;margin-bottom:10px;" data-qid="' + i + '">' +
      '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">' +
        '<strong>Pergunta ' + (i + 1) + '</strong>' +
        '<button type="button" class="btn btn-ghost btn-nav" data-remover="' + i + '">✕</button>' +
      '</div>' +
      '<div style="display:grid;gap:8px;margin-top:8px;">' +
        '<input type="text" placeholder="Escreva a pergunta" data-campo="pergunta" value="' + esc(p.pergunta) + '" style="' + entradaEstilo() + '">' +
        (p.alt || []).map(function (alt, j) {
          return '<input type="text" placeholder="Alternativa ' + (j + 1) + '" data-campo="alt_' + j + '" value="' + esc(alt) + '" style="' + entradaEstilo() + '">';
        }).join('') +
        '<label class="descricao-bloco">Correta: <select data-campo="correta" style="' + entradaEstilo() + '">' + selOpcoes + '</select></label>' +
      '</div>' +
    '</div>';
  }).join('') ||
    '<div class="estado-vazio"><span class="emoji">' + ic('quiz') + '</span><p>Nenhuma pergunta ainda. Adicione a primeira!</p></div>';

  Array.prototype.forEach.call(area.querySelectorAll('[data-remover]'), function (b) {
    b.addEventListener('click', function () {
      rascunhoPerguntas.splice(Number(b.getAttribute('data-remover')), 1);
      renderizarListaPerguntas();
    });
  });
  Array.prototype.forEach.call(area.querySelectorAll('[data-campo]'), function (inp) {
    inp.addEventListener('input', function () {
      var host = inp.closest('[data-qid]');
      if (!host) return;
      var idx = Number(host.getAttribute('data-qid'));
      var campo = inp.getAttribute('data-campo');
      if (campo === 'correta') { rascunhoPerguntas[idx].correta = Number(inp.value); return; }
      if (campo === 'pergunta') { rascunhoPerguntas[idx].pergunta = inp.value; return; }
      rascunhoPerguntas[idx].alt[Number(campo.split('_')[1])] = inp.value;
    });
  });
}

function salvarQuizManual(ev) {
  ev.preventDefault();
  var titulo = q('cm-titulo').value.trim();
  var descricao = q('cm-descricao').value.trim();
  var categoria = q('cm-categoria').value;
  var dificuldade = q('cm-dificuldade').value;
  if (!titulo) { mostrarMensagem('Dê um título ao quiz.'); return; }
  var boas = rascunhoPerguntas.filter(function (p) {
    return p.pergunta.trim() && (p.alt || []).every(function (a) { return a.trim(); });
  });
  if (!boas.length) { mostrarMensagem('Complete todas as alternativas de pelo menos uma pergunta.'); return; }
  var quiz = {
    id: 'local_' + Date.now(),
    titulo: titulo,
    descricao: descricao || 'Criado no Nivora.',
    categoria: categoria,
    dificuldade: dificuldade,
    emoji: '✍️',
    cor: '#7c6cf0',
    tags: [categoria, 'criado'],
    autor: lerNome(),
    dataCriacao: iso(new Date()),
    quantidade: boas.length,
    duracao: Math.max(60, boas.length * 20),
    status: 'ativo',
    perguntas: boas.map(function (p) {
      return {
        tipo: 'multipla',
        pergunta: p.pergunta.trim(),
        alternativas: p.alt.map(function (a) { return a.trim(); }),
        correta: p.correta,
        explicacao: '',
        dificuldade: dificuldade,
        valor: 1
      };
    })
  };
  adicionarQuizLocal(quiz);
  rascunhoPerguntas = [];
  mostrarMensagem('Quiz criado!');
  if (backendConectado() && window.API.criarQuiz) {
    window.API.criarQuiz(quiz).then(function (d) {
      if (d && d.id) {
        quiz.id = d.id;
        renderizarMeusQuizzes();
      }
    }).catch(function () {});
  }
  entrarNoQuiz(quiz.id);
}

function adicionarQuizLocal(quiz) {
  var existente = buscarQuiz(quiz.id);
  if (existente) {
    QUIZZES[QUIZZES.indexOf(existente)] = quiz;
  } else {
    QUIZZES.push(quiz);
  }
  return quiz;
}

function renderizarCriarIA() {
  var card = q('criar-card');
  if (!card) return;
  if (!backendConectado()) {
    card.innerHTML =
      '<button type="button" class="btn btn-ghost btn-nav" data-voltar-criar>← Voltar</button>' +
      '<div class="estado-vazio"><span class="emoji">' + ic('cloud_off') + '</span>' +
      '<p>Gerar com IA precisa do backend conectado.</p>' +
      '<p>Entre com uma conta e tente de novo.</p></div>';
    card.querySelector('[data-voltar-criar]').addEventListener('click', renderizarCriar);
    return;
  }
  card.innerHTML =
    '<button type="button" class="btn btn-ghost btn-nav" data-voltar-criar>← Voltar</button>' +
    '<h3 style="margin:10px 0;">' + ic('auto_awesome') + ' Gerar quiz com IA</h3>' +
    '<form id="form-criar-ia" novalidate>' +
      '<div style="display:grid;gap:10px;max-width:520px;">' +
        '<label class="descricao-bloco">Tema' +
          '<input type="text" id="ia-tema" required maxlength="60" placeholder="Ex.: Futebol brasileiro" style="' + entradaEstilo() + '"></label>' +
        '<label class="descricao-bloco">Categoria' +
          '<select id="ia-categoria" style="' + entradaEstilo() + '">' + opcoesCategorias('geral') + '</select></label>' +
        '<label class="descricao-bloco">Dificuldade' +
          '<select id="ia-dificuldade" style="' + entradaEstilo() + '">' + opcoesDificuldades('medio') + '</select></label>' +
        '<label class="descricao-bloco">Quantidade' +
          '<select id="ia-quantidade" style="' + entradaEstilo() + '">' +
            '<option value="5" selected>5 perguntas</option>' +
            '<option value="8">8 perguntas</option>' +
            '<option value="10">10 perguntas</option>' +
          '</select></label>' +
      '</div>' +
      '<p id="ia-aviso" class="descricao-bloco" style="display:none;"></p>' +
      '<button type="submit" class="btn btn-primary" id="ia-gerar-btn" style="margin-top:12px;">Gerar perguntas</button>' +
    '</form>' +
    '<div id="ia-resultado" style="margin-top:20px;"></div>';
  card.querySelector('[data-voltar-criar]').addEventListener('click', renderizarCriar);
  q('form-criar-ia').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var btn = q('ia-gerar-btn');
    var aviso = q('ia-aviso');
    btn.disabled = true;
    btn.textContent = 'Gerando…';
    aviso.style.display = 'none';
    window.API.gerarQuizIA({
      tema: q('ia-tema').value.trim(),
      categoria: q('ia-categoria').value,
      dificuldade: q('ia-dificuldade').value,
      quantidade: Number(q('ia-quantidade').value)
    }).then(function (d) {
      btn.disabled = false;
      btn.textContent = 'Gerar perguntas';
      if (d && d.rascunho) {
        if (d.aviso) { aviso.textContent = d.aviso; aviso.style.display = 'block'; }
        renderizarRascunhoIA(d.rascunho);
      } else if (d && d.erro) {
        mostrarMensagem(d.erro);
      } else {
        mostrarMensagem('Não foi possível gerar. Tente de novo.');
      }
    }).catch(function (err) {
      btn.disabled = false;
      btn.textContent = 'Gerar perguntas';
      mostrarMensagem((err && err.erro) || 'Falha na geração. Tente de novo.');
    });
  });
}

function renderizarRascunhoIA(rascunho) {
  var area = q('ia-resultado');
  if (!area) return;
  var perg = rascunho.perguntas || [];
  area.innerHTML =
    '<div class="card suave" style="padding:16px;">' +
      '<h3>' + esc(rascunho.titulo || 'Quiz gerado') + '</h3>' +
      '<p class="descricao-bloco">' + perg.length + ' perguntas para você revisar.</p>' +
      '<div style="display:grid;gap:10px;margin-top:10px;">' +
        perg.map(function (p, i) {
          return '<div style="padding:10px;border:1px solid rgba(127,127,127,.25);border-radius:10px;">' +
            '<strong>' + (i + 1) + '. ' + esc(p.pergunta) + '</strong>' +
            '<p style="margin:4px 0 0;">' + (p.alternativas || []).map(function (alt, j) {
              return (j === p.correta ? ic('check_circle') + ' ' : '• ') + esc(alt);
            }).join('<br>') + '</p>' +
            (p.explicacao ? '<p class="descricao-bloco" style="margin-top:4px;">' + esc(p.explicacao) + '</p>' : '') +
          '</div>';
        }).join('') +
      '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">' +
        '<button type="button" class="btn btn-primary" data-ia-salvar>Salvar quiz</button>' +
        '<button type="button" class="btn btn-ghost" data-ia-refazer>Gerar de novo</button>' +
      '</div>' +
    '</div>';
  rascunhoIAAtual = rascunho;
  area.querySelector('[data-ia-salvar]').addEventListener('click', salvarRascunhoIA);
  area.querySelector('[data-ia-refazer]').addEventListener('click', renderizarCriarIA);
}

function salvarRascunhoIA() {
  var r = rascunhoIAAtual;
  if (!r) return;
  var promessa = window.API.salvarQuizIA ? window.API.salvarQuizIA({ quiz: r }) : Promise.reject({ erro: 'API indisponível' });
  promessa.then(function (d) {
    if (d && d.erro) { mostrarMensagem(d.erro); return; }
    if (r.perguntas && r.perguntas.length) {
      var id = (d && d.id) ? ('q_' + d.id) : ('local_' + Date.now());
      adicionarQuizLocal({
        id: id,
        titulo: r.titulo || 'Quiz gerado',
        descricao: r.descricao || 'Gerado com IA no Nivora.',
        categoria: r.categoria || 'geral',
        dificuldade: r.dificuldade || 'medio',
        emoji: r.emoji || '🤖',
        cor: r.cor || '#7c6cf0',
        tags: (r.tags && r.tags.length) ? r.tags : ['IA', 'gerado'],
        autor: lerNome(),
        dataCriacao: iso(new Date()),
        quantidade: r.perguntas.length,
        duracao: Math.max(60, r.perguntas.length * 12),
        status: 'ativo',
        perguntas: r.perguntas
      });
    }
    rascunhoIAAtual = null;
    mostrarMensagem('Quiz salvo!');
    renderizarCriar();
  }).catch(function (err) {
    mostrarMensagem((err && err.erro) || 'Falha ao salvar.');
  });
}

/* ---------- 31) ADMIN ---------- */
function renderizarAdmin() {
  var avisos = q('admin-avisos');
  var dash = q('admin-dashboard');
  if (!dash) return;
  var u = window.API ? window.API.usuario : null;
  if (!window.API || !u) {
    if (avisos) avisos.innerHTML = '<div class="descricao-bloco">Para usar o painel, entre com uma conta de administrador.</div>';
    dash.innerHTML = '';
    return;
  }
  if (u.papel !== 'admin') {
    if (avisos) avisos.innerHTML = '<div class="descricao-bloco" style="color:#e05a4f;">Você não tem permissão para o painel administrativo.</div>';
    dash.innerHTML = '';
    mostrarLinkAdmin(false);
    return;
  }
  if (avisos) avisos.innerHTML = '';
  dash.innerHTML = '<p id="admin-carregando" class="descricao-bloco">Carregando painel…</p>';
  window.API.adminDashboard().then(function (d) {
    renderizarAdminDashboard(d);
  }).catch(function () {
    dash.innerHTML = '<div class="estado-vazio"><span class="emoji">' + ic('cloud_off') + '</span><p>Não foi possível carregar o painel.</p></div>';
  });
}

function renderizarAdminDashboard(d) {
  var dash = q('admin-dashboard');
  if (!dash) return;
  var cards = [
    ['groups', 'Usuários', d.totalUsuarios],
    ['sports_esports', 'Partidas', d.totalPartidas],
    ['quiz', 'Quizzes', d.totalQuizzes],
    ['add_box', 'Criados', d.criados],
    ['bolt', 'Novos hoje', d.usuariosHoje],
    ['check_circle', 'Acerto médio', (d.taxaMedia || 0) + '%']
  ];
  var mais = (d.maisJogados || []).slice(0, 5).map(function (m) {
    return '<li>' + esc(m.titulo || m.id) + ' — ' + m.vezes + 'x</li>';
  }).join('');
  dash.innerHTML =
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;">' +
      cards.map(function (c) {
        return '<div class="card" style="text-align:center;padding:14px;">' +
          '<div style="font-size:22px;">' + ic(c[0]) + '</div>' +
          '<div style="font-size:20px;font-weight:bold;">' + c[2] + '</div>' +
          '<div class="descricao-bloco">' + c[1] + '</div></div>';
      }).join('') +
    '</div>' +
    (mais ? '<h3 class="titulo-bloco" style="margin-top:20px;">Mais jogados</h3><ul style="display:grid;gap:6px;padding-left:20px;">' + mais + '</ul>' : '') +
    '<div style="margin-top:16px;">' +
      '<button type="button" class="btn btn-ghost" id="admin-ver-usuarios">Ver usuários</button>' +
    '</div>' +
    '<div id="admin-usuarios" style="margin-top:12px;"></div>';
  q('admin-ver-usuarios').addEventListener('click', renderizarAdminUsuarios);
}

function renderizarAdminUsuarios() {
  var area = q('admin-usuarios');
  if (!area) return;
  area.innerHTML = '<p class="descricao-bloco" id="admin-usr-carregando">Carregando usuários…</p>';
  window.API.adminUsuarios().then(function (d) {
    var lista = d && d.usuarios ? d.usuarios : [];
    area.innerHTML =
      '<h3 class="titulo-bloco">Usuários</h3>' +
      '<div style="display:grid;gap:8px;">' +
        (lista.map(function (usr) {
          return '<div class="card suave" style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;flex-wrap:wrap;">' +
            '<div><strong>' + esc(usr.nome) + '</strong>' +
            '<p class="descricao-bloco" style="margin:0;">' + esc(usr.email) + ' · ' + esc(usr.papel) + ' · ' + esc(usr.status) + '</p></div>' +
            (usr.id !== (window.API.usuario && window.API.usuario.id) ?
              '<button type="button" class="btn btn-ghost btn-nav" data-usr="toggle" data-id="' + esc(usr.id) + '">' + (usr.status === 'bloqueado' ? 'Ativar' : 'Bloquear') + '</button>' : '') +
          '</div>';
        }).join('') ||
        '<div class="estado-vazio"><span class="emoji">' + ic('group_off') + '</span><p>Nenhum usuário encontrado.</p></div>') +
      '</div>';
    Array.prototype.forEach.call(area.querySelectorAll('[data-usr="toggle"]'), function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-id');
        var proximo = b.textContent.trim() === 'Bloquear' ? 'bloqueado' : 'ativo';
        window.API.adminEditarUsuario(id, { status: proximo }).then(function (r2) {
          if (r2 && r2.erro) { mostrarMensagem(r2.erro); return; }
          mostrarMensagem(proximo === 'bloqueado' ? 'Usuário bloqueado.' : 'Usuário ativado.');
          renderizarAdminUsuarios();
        }).catch(function () { mostrarMensagem('Falha ao atualizar.'); });
      });
    });
  }).catch(function () {
    area.innerHTML = '<div class="descricao-bloco">Não foi possível carregar os usuários.</div>';
  });
}

document.addEventListener('DOMContentLoaded', iniciar);