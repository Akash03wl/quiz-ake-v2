/* ==========================================================
   QUIZ AKE - LÓGICA DO SITE (JavaScript)
   Fase 2: XP/níveis progressivos, favoritos, histórico,
   streak diário, desafio do dia, busca/filtros em quizzes,
   conquistas com progresso, explicações e suporte a V/F.
   ========================================================== */

/* ---------- 1) CONFIGURAÇÕES DO JOGO ---------- */
const TEMPO_POR_DIFICULDADE = { facil: 25, medio: 20, dificil: 15, insano: 12 };
const QUANTAS_PERGUNTAS = 10;
const PONTOS_CERTA = 10;
const BONUS_COMBO = 5;
const LIMITE_HISTORICO = 12;
const LIMITE_RANKING = 5;
const PERGUNTAS_DESAFIO = 6;

const XP_ACERTO = 10;
const XP_COMBO = 5;
const XP_COMPLETAR = 25;
const XP_PERFEITO = 40;
const XP_CONQUISTA = 15;
const XP_DESAFIO = 30;

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
  quizzes: 'tela-quizzes',
  quiz: 'tela-quiz',
  resultado: 'tela-resultado',
  ranking: 'tela-ranking',
  conquistas: 'tela-conquistas',
  perfil: 'tela-perfil'
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
var modoDesafio = false;
var categoriaAtual = 'geral';
var tempoRestante = 0;
var cronometro = null;
var tempoTotalUsado = 0;
var segundosPorPergunta = 20;
var nomeAnterior = '';

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
  rankingCompleto: q('ranking-completo'),
  favoritosGrade: q('favoritos-grade'),
  desafioCard: q('desafio-card'),

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

  conquistas: q('conquistas-grade'),
  conquistasProgresso: q('conquistas-progresso'),

  perfilNome: q('perfil-nome'),
  perfilNivel: q('perfil-nivel'),
  perfilXp: q('perfil-xp'),
  barraXp: q('barra-xp'),
  perfilStats: q('perfil-stats'),
  perfilHistorico: q('perfil-historico'),
  perfilStreak: q('perfil-streak'),

  overlayNivel: q('overlay-nivel'),
  overlayNivelTexto: q('overlay-nivel-texto')
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
  tema: 'quizAKE_tema',
  nome: 'quizAKE_nome'
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
  return lerObjeto(CHAVE.stats, { jogos: 0, acertos: 0, erros: 0, rapidas: 0, maiorCombo: 0, perfeitos: 0, desafios: 0, maiorPontos: 0 });
}
function salvarStats(s) { gravarTexto(CHAVE.stats, JSON.stringify(s)); }
function lerNome() { var n = lerTexto(CHAVE.nome); return (n && n.trim()) ? n : 'Jogador AKE'; }

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

/* ---------- 7) TEMA ---------- */
var TEMAS = ['dark', 'light', 'system'];
var ICONES_TEMA = { dark: '🌙', light: '☀️', system: '🖥️' };
function temaAtual() { var t = lerTexto(CHAVE.tema); return TEMAS.indexOf(t) >= 0 ? t : 'system'; }
function aplicarTema() {
  var t = temaAtual();
  document.documentElement.setAttribute('data-theme', t);
  var b = q('botao-tema');
  if (b) { b.textContent = ICONES_TEMA[t]; b.setAttribute('aria-label', 'Tema: ' + t); }
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
  if (nomeTela === 'ranking') renderizarRanking();
  if (nomeTela === 'conquistas') renderizarConquistas();
  if (nomeTela === 'perfil') renderizarPerfil();
  if (nomeTela === 'inicio') renderizarHome();

  fecharMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function iniciarNavegacao() {
  document.querySelectorAll('[data-navegar]').forEach(function (elem) {
    elem.addEventListener('click', function (ev) {
      ev.preventDefault();
      var alvo = this.getAttribute('data-navegar');
      if (alvo === 'quiz-dia') { iniciarDesafioDoDia(); return; }
      mostrarTela(alvo);
    });
  });

  q('botao-comecar').addEventListener('click', function () { entrarNoQuiz('quiz-geral'); });
  q('botao-jogar-hero').addEventListener('click', function () { entrarNoQuiz('quiz-geral'); });
  q('botao-reiniciar').addEventListener('click', function () {
    entrarNoQuiz(quizAtual ? quizAtual.id : 'quiz-geral');
  });
  q('botao-tema').addEventListener('click', alternarTema);

  if (el.busca) el.busca.addEventListener('input', debounce(renderizarTodos, 180));
  if (el.filtroCat) el.filtroCat.addEventListener('change', renderizarTodos);
  if (el.filtroDif) el.filtroDif.addEventListener('change', renderizarTodos);
  if (el.ordem) el.ordem.addEventListener('change', renderizarTodos);
  if (el.soFavoritos) el.soFavoritos.addEventListener('change', renderizarTodos);

  // Perfil: nome editável
  var inputNome = q('input-nome');
  if (inputNome) inputNome.addEventListener('change', function () {
    var nome = inputNome.value.trim();
    if (nome) { gravarTexto(CHAVE.nome, nome); inputNome.value = nome; }
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
  if (i >= 0) { lista.splice(i, 1); gravarTexto(CHAVE.favoritos, JSON.stringify(lista)); return false; }
  lista.push(id); gravarTexto(CHAVE.favoritos, JSON.stringify(lista)); return true;
}

/* ---------- 11) HISTÓRICO ---------- */
function lerHistorico() { return lerLista(CHAVE.historico); }
function registrarHistorico(reg) {
  var lista = lerHistorico();
  lista.unshift(reg);
  gravarTexto(CHAVE.historico, JSON.stringify(lista.slice(0, 12)));
}
function vezesJogado(id) { return lerHistorico().filter(function (h) { return h.quiz === id; }).length; }
function ultimoJogoData(id) {
  var lista = lerHistorico();
  for (var i = 0; i < lista.length; i++) if (lista[i].quiz === id) return lista[i].quando;
  return '';
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

/* ---------- 13) DESAFIO DO DIA ---------- */
function sementeDia(texto) {
  var h = 0;
  for (var i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return h;
}
function perguntasDesafioHoje() {
  var semente = sementeDia(hojeISO());
  var pool = PERGUNTAS.slice();
  for (var i = pool.length - 1; i > 0; i--) {
    semente = (semente * 1103515245 + 12345) >>> 0;
    var j = semente % (i + 1);
    var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }
  return pool.slice(0, PERGUNTAS_DESAFIO);
}
function iniciarDesafioDoDia() {
  perguntasSorteio = perguntasDesafioHoje();
  iniciarPartidaPerguntas(perguntasSorteio, 'desafio');
}
function renderizarDesafio() {
  if (!el.desafioCard) return;
  var desafio = lerObjeto(CHAVE.desafio, { hoje: '', melhor: 0 });
  var jogouHoje = desafio.hoje === hojeISO();
  el.desafioCard.innerHTML =
    '<div class="destaque-badge">🎯 Desafio do Dia</div>' +
    '<h3>' + new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) + '</h3>' +
    '<p>' + PERGUNTAS_DESAFIO + ' perguntas sorteadas de toda a biblioteca. Todo mundo recebe o mesmo desafio.</p>' +
    '<div class="destaque-meta"><span>❓ ' + PERGUNTAS_DESAFIO + ' perguntas</span>' +
    (jogouHoje ? '<span>⭐ Melhor hoje: ' + desafio.melhor + ' pts</span>' : '<span>Você ainda não jogou hoje</span>') + '</div>' +
    '<button class="btn btn-primary" id="btn-desafio-card">Jogar Desafio</button>';
  var b = q('btn-desafio-card');
  if (b) b.addEventListener('click', iniciarDesafioDoDia);
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
        '<span>❓ ' + quiz.quantidade + ' questões</span>' +
        '<span>⏱ ' + minutos + ' min</span>' +
        '<span>👤 ' + quiz.autor + '</span>' +
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
    var rec_ = QUIZZES.slice().sort(function (a, b) { return vezesJogado(a.id) - vezesJogado(b.id); }).slice(0, 3);
    renderizarCards(el.gradeRecomendados, rec_);
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
        '<span class="emoji">🎯</span>' +
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
    ['🌈', s.maiorCombo || 0, 'Maior combo'],
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
    el.favoritosGrade.innerHTML = '<div class="estado-vazio"><span class="emoji">❤️</span><p>Nenhum favorito ainda. Toque no coração de um quiz!</p></div>';
    return;
  }
  renderizarCards(el.favoritosGrade, quizes);
}
function renderizarRankingResumo() {
  if (!el.rankingResumo) return;
  var lista = lerLista(CHAVE.ranking);
  if (lista.length === 0) {
    el.rankingResumo.innerHTML = '<div class="estado-vazio"><span class="emoji">🏆</span><p><strong>Nenhum registro ainda.</strong><br>Jogue para entrar no ranking.</p></div>';
    return;
  }
  var itens = lista.slice(0, 3).map(function (r, i) {
    return '<li><span class="pos">' + (i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉') + '</span><span class="nome">' + r.nome + '</span><span class="pts">' + r.pontos + ' pts</span></li>';
  });
  el.rankingResumo.innerHTML = '<ul class="lista-ranking">' + itens.join('') + '</ul>';
}

/* ---------- 17) RANKING COMPLETO ---------- */
function renderizarRanking() {
  if (!el.rankingCompleto) return;
  var lista = lerLista(CHAVE.ranking);
  if (lista.length === 0) {
    el.rankingCompleto.innerHTML = '<div class="estado-vazio"><span class="emoji">🏆</span><p>Nenhum registro ainda. Jogue para entrar no ranking.</p></div>';
    return;
  }
  el.rankingCompleto.innerHTML = '<ul class="lista-ranking">' + lista.map(function (r, i) {
    return '<li><span class="pos">' + (i + 1) + 'º</span><span class="nome">' + r.nome + '</span><span class="pts">' + r.pontos + ' pts</span></li>';
  }).join('') + '</ul>';
}

/* ---------- 18) CONQUISTAS ---------- */
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
      '<div class="icone">' + (ok ? def.icone : '🔒') + '</div>' +
      '<div class="nome">' + def.nome + '</div>' +
      '<div class="desc">' + def.desc + '</div>' +
      '<div class="conq-prog"><div class="conq-bar"><div class="conq-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="conq-count">' + (ok ? '✅' : p.valor + '/' + p.alvo) + '</span></div>';
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

/* ---------- 19) PERFIL ---------- */
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
  renderizarHistorico();
  renderizarCalendarioStreak();
}

function renderizarHistorico() {
  if (!el.perfilHistorico) return;
  var lista = lerHistorico();
  if (lista.length === 0) {
    el.perfilHistorico.innerHTML = '<div class="estado-vazio"><p>Nenhuma partida ainda. Vá jogar!</p></div>';
    return;
  }
  el.perfilHistorico.innerHTML = lista.slice(0, 8).map(function (h, i) {
    return '<li class="hist-item"><span class="hist-icon">' + (h.icon || '🧠') + '</span>' +
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
    '<div class="streak-topo">🔥 Desde ontem: <strong>' + seq.atual + '</strong> dias · Recorde: <strong>' + seq.maior + '</strong></div>' +
    '<div class="streak-semana">' + dias.map(function (d) {
      return '<div class="streak-dia' + (d.ativo ? ' ativo' : '') + (d.hoje ? ' hoje' : '') + '">' +
        '<small>' + d.rotulo + '</small><b>' + (d.ativo ? '🔥' : d.iso.slice(8)) + '</b></div>';
    }).join('') + '</div>';
}

/* ---------- 20) MOTOR DO QUIZ ---------- */
function entrarNoQuiz(id) {
  var quiz = buscarQuiz(id) || QUIZZES[0];
  var pool = perguntasDoQuiz(quiz);
  if (!pool.length) return;
  pararTimer();
  quizAtual = quiz;
  modoDesafio = false;
  prepararPartida(pool);
}
function iniciarPartidaPerguntas(pool, tipo) {
  pararTimer();
  modoDesafio = tipo === 'desafio';
  prepararPartida(pool);
}
function prepararPartida(pool) {
  var copia = pool.slice();
  for (var i = copia.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = copia[i]; copia[i] = copia[j]; copia[j] = t;
  }
  perguntasSorteio = copia.slice(0, QUANTAS_PERGUNTAS);
  if (modoDesafio) perguntasSorteio = copia.slice(0, PERGUNTAS_DESAFIO);

  indiceAtual = 0; pontuacao = 0; sequenciaCerta = 0; maiorCombo = 0;
  acertos = 0; erros = 0; rapidas = 0; respondeu = false; tempoTotalUsado = 0;

  var dif = quizAtual ? quizAtual.dificuldade : 'medio';
  segundosPorPergunta = TEMPO_POR_DIFICULDADE[dif] || 20;

  el.pontuacao.textContent = '0';
  el.acertosTela.textContent = '0';
  el.errosTela.textContent = '0';

  mostrarTela('quiz');
  mostrarPergunta();
}

function mostrarPergunta() {
  pararTimer();
  var pergunta = perguntasSorteio[indiceAtual];
  var total = perguntasSorteio.length;

  el.textoProgresso.textContent = 'Pergunta ' + (indiceAtual + 1) + ' de ' + total;
  el.numeroPergunta.textContent = 'Pergunta ' + (indiceAtual + 1);
  el.barraProgresso.style.width = (indiceAtual / total) * 100 + '%';

  var tipo = buscarTipo(pergunta.tipo || 'multipla');
  el.tipoPergunta.textContent = '· ' + tipo.nome;

  if (pergunta.valor > 1) {
    el.seloBonus.classList.remove('hidden');
    el.chipPremio.classList.remove('hidden');
    el.chipPremio.textContent = '⭐ x' + pergunta.valor;
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

function contarPergunta() {
  segundosPorPergunta = TEMPO_POR_DIFICULDADE[quizAtual ? quizAtual.dificuldade : 'medio'] || 20;
  tempoRestante = segundosPorPergunta;
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

function pararTimer() {
  if (cronometro !== null) { clearInterval(cronometro); cronometro = null; }
}

function tempoEsgotado() {
  if (respondeu) return;
  respondeu = true;
  erros++;
  el.errosTela.textContent = erros;
  tempoTotalUsado += segundosPorPergunta;

  var botoes = el.areaRespostas.querySelectorAll('.answer-btn');
  botoes.forEach(function (b) { b.disabled = true; });
  var pergunta = perguntasSorteio[indiceAtual];
  var okIdx = pergunta.correta;
  if (botoes[okIdx]) botoes[okIdx].classList.add('correct');

  sequenciaCerta = 0;
  el.chipCombo.style.display = 'none';
  el.numeroSeq.textContent = '0';

  tocarSom(false);
  mostrarMensagem('⏰ Tempo esgotado!', 'var(--erro)');
  mostrarExplicacao(false, pergunta);
  proximaPergunta();
}

function responder(idx, botao, valor) {
  if (respondeu) return;
  respondeu = true;
  pararTimer();

  var tempoUsado = segundosPorPergunta - tempoRestante;
  tempoTotalUsado += tempoUsado;

  var todos = el.areaRespostas.querySelectorAll('.answer-btn');
  todos.forEach(function (b) { b.disabled = true; });

  var pergunta = perguntasSorteio[indiceAtual];
  var certa = pergunta.correta;

  if (idx === certa) {
    acertos++; el.acertosTela.textContent = acertos;
    sequenciaCerta++;
    if (sequenciaCerta > maiorCombo) maiorCombo = sequenciaCerta;
    el.chipCombo.style.display = 'inline-flex';
    el.numeroSeq.textContent = sequenciaCerta;
    if (tempoUsado <= 4) rapidas++;

    var pontosBase = PONTOS_CERTA + BONUS_COMBO * (sequenciaCerta - 1);
    var ganho = pontosBase * (valor || 1);
    pontuacao += ganho;
    el.pontuacao.textContent = pontuacao;

    botao.classList.add('correct');
    tocarSom(true);
    criarConfete();
    mostrarMensagem(valor > 1 ? '+ ' + ganho + ' pts (x' + valor + ')' : '+ ' + ganho + ' pts', 'var(--ok)');
    mostrarExplicacao(true, pergunta);
  } else {
    botao.classList.add('wrong');
    if (todos[certa]) todos[certa].classList.add('correct');
    erros++;
    el.errosTela.textContent = erros;
    sequenciaCerta = 0;
    el.numeroSeq.textContent = '0';
    el.chipCombo.style.display = 'none';
    tocarSom(false);
    mostrarMensagem('✖ Errou', 'var(--erro)');
    mostrarExplicacao(false, pergunta);
  }
  proximaPergunta();
}

function mostrarExplicacao(acertou, pergunta) {
  el.areaExplicacao.innerHTML = '';
  el.areaExplicacao.classList.remove('hidden');
  el.areaExplicacao.className = 'area-explicacao ' + (acertou ? 'certo' : 'erro');
  el.areaExplicacao.innerHTML =
    '<div class="explicacao-status">' + (acertou ? '✅ Resposta correta!' : '❌ Você errou.') + '</div>' +
    '<div class="explicacao-resposta">Resposta certa: <strong>' + pergunta.alternativas[pergunta.correta] + '</strong></div>' +
    (pergunta.explicacao ? '<div class="explicacao-texto">💡 ' + pergunta.explicacao + '</div>' : '');
}

function proximaPergunta() {
  setTimeout(function () {
    indiceAtual++;
    if (indiceAtual < perguntasSorteio.length) mostrarPergunta();
    else finalizarPartida();
  }, 2600);
}

/* ---------- 21) FINAL DA PARTIDA ---------- */
function finalizarPartida() {
  pararTimer();
  var total = perguntasSorteio.length || 1;
  var percentual = Math.round((acertos / total) * 100);
  var tempoMedio = Math.round(tempoTotalUsado / total);

  var novoRecorde = pontuacao > lerRecorde();
  if (novoRecorde) gravarTexto(CHAVE.recorde, pontuacao);

  var xpGanho = acertos * XP_ACERTO + maiorCombo * XP_COMBO + XP_COMPLETAR;
  if (percentual === 100) xpGanho += XP_PERFEITO;
  if (modoDesafio) xpGanho += XP_DESAFIO;

  var s = lerStats();
  s.jogos++; s.acertos += acertos; s.erros += erros; s.rapidas += rapidas;
  if (maiorCombo > s.maiorCombo) s.maiorCombo = maiorCombo;
  if (percentual === 100) s.perfeitos++;
  if (pontuacao > s.maiorPontos) s.maiorPontos = pontuacao;
  if (modoDesafio) s.desafios++;
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
    quiz: quizAtual ? quizAtual.id : 'desafio-dia',
    titulo: quizAtual ? quizAtual.titulo : 'Desafio do Dia',
    icon: quizAtual ? quizAtual.capa.emoji : '🎯',
    quando: new Date().toLocaleDateString('pt-BR'),
    pontos: pontuacao,
    pct: percentual
  });

  var ranking = lerLista(CHAVE.ranking);
  ranking.push({ nome: lerNome() + ' · ' + (quizAtual ? quizAtual.titulo : 'Desafio'), pontos: pontuacao });
  ranking.sort(function (a, b) { return b.pontos - a.pontos; });
  gravarTexto(CHAVE.ranking, JSON.stringify(ranking.slice(0, LIMITE_RANKING)));

  if (modoDesafio) {
    var d = lerObjeto(CHAVE.desafio, { hoje: '', melhor: -1 });
    var venceuRecorde = d.hoje === hojeISO() ? (pontuacao >= d.melhor) : true;
    if (venceuRecorde) {
      gravarTexto(CHAVE.desafio, JSON.stringify({ hoje: hojeISO(), melhor: pontuacao, acertos: acertos, total: total }));
    }
  }

  montarResultado(percentual, tempoMedio, xpGanho, seq, novas, novoRecorde);
}

function montarResultado(percentual, tempoMedio, xpGanho, seq, novas, novoRecorde) {
  el.pontuacaoFinal.textContent = pontuacao + ' pontos';
  el.rAcertos.textContent = acertos;
  el.rErros.textContent = erros;
  el.rPercentual.textContent = percentual + '%';
  el.rCombo.textContent = 'x' + maiorCombo;
  el.rTempo.textContent = tempoMedio + 's';
  el.rXp.textContent = '+' + xpGanho + ' XP';
  el.melhorPontuacao.textContent = '🏅 Melhor pontuação: ' + lerRecorde();

  var nv = calcularNivel(lerXpValido());
  el.rNivel.textContent = 'Nível ' + nv.nivel;
  el.rBarraXp.style.width = nv.progresso + '%';
  el.rProgresso.textContent = nv.xpNoNivel + ' / ' + nv.xpNecessario + ' XP';

  if (el.rConquistas) {
    if (novas.length) {
      el.rConquistas.innerHTML = '<h3>🏅 Novas conquistas!</h3><div class="resultado-conq">' +
        novas.map(function (id) {
          var def = CONQUISTAS_DEF.find(function (x) { return x.id === id; });
          return '<span class="resultado-medalha">' + def.icone + ' ' + def.nome + '</span>';
        }).join('') + '</div>';
    } else {
      el.rConquistas.innerHTML = '<h3>🏅 Conquistas</h3><p class="descricao-bloco">Complete objetivos para desbloquear medalhas.</p>';
    }
  }

  if (el.rStreak) el.rStreak.innerHTML = '<span>🔥 Sequência atual: <strong>' + seq.atual + '</strong> · Recorde: <strong>' + seq.maior + '</strong></span>';

  var emoji = '🏆', titulo = 'Perfeito!', sub = '100% de acerto, que gênio!';
  if (percentual >= 80) { emoji = '🎉'; titulo = 'Excelente!'; sub = 'Você arrasou!'; }
  else if (percentual >= 60) { emoji = '😄'; titulo = 'Muito bom!'; sub = 'Continue treinando!'; }
  else if (percentual >= 40) { emoji = '🙂'; titulo = 'Bom começo'; sub = 'Esforço sempre ajuda!'; }
  else if (percentual >= 20) { emoji = '💪'; titulo = 'Não desista'; sub = 'Todo mestre já foi iniciante.'; }
  else { emoji = '🔁'; titulo = 'Tente de novo'; sub = 'Você consegue evoluir!'; }
  if (novoRecorde) sub += ' 🎊 Novo recorde!';

  el.emojiResultado.textContent = emoji;
  el.tituloResultado.textContent = titulo;
  el.subtituloResultado.textContent = sub;

  if (percentual >= 60) criarConfete();
  mostrarTela('resultado');
  renderizarEstatisticas();
  renderizarRanking();
  renderizarConquistas();
}

function mostrarNivelUp(nivel) {
  if (!el.overlayNivel) return;
  el.overlayNivelTexto.textContent = 'Você subiu para o nível ' + nivel + '!';
  el.overlayNivel.classList.remove('hidden');
  criarConfete();
  setTimeout(function () { el.overlayNivel.classList.add('hidden'); }, 3500);
}

/* ---------- 22) MENSAGENS, CONFETE, SOM ---------- */
function mostrarMensagem(texto, cor) {
  var m = document.createElement('div');
  m.className = 'floating-msg';
  m.textContent = texto;
  m.style.color = cor;
  document.body.appendChild(m);
  setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, 900);
}

function criarConfete() {
  var emojis = ['🎉', '💥', '✨', '🎊', '🌟'];
  for (var i = 0; i < 24; i++) {
    var ped = document.createElement('div');
    ped.className = 'confetti-piece';
    ped.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    ped.style.left = Math.random() * 100 + 'vw';
    ped.style.animationDuration = (1.5 + Math.random()) + 's';
    ped.style.fontSize = (16 + Math.random() * 22) + 'px';
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

/* ---------- 23) INICIAR ---------- */
function iniciar() {
  aplicarTema();
  iniciarNavegacao();
  iniciarMenuMobile();

  if (el.heroTotalPerguntas) el.heroTotalPerguntas.textContent = PERGUNTAS.length;
  if (el.heroTotalCats) el.heroTotalCats.textContent = CATEGORIAS.length;

  renderizarHome();
  renderizarConquistas();
  renderizarPaginaQuizzes();
  mostrarTela('inicio');
}

document.addEventListener('DOMContentLoaded', iniciar);