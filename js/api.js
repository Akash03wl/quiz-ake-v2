/* ============================================================
   QUIZ AKE - CLIENTE DA API (js/api.js)
   Camada de integração com o backend Cloudflare Pages (Fase 4).
   - /api/health, /api/auth/*, /api/migrate, /api/me/progresso
   - /api/quizzes, /api/ia/*, /api/ranking, /api/salas/*, /api/desafio
   - Admin: /api/admin/*
   Sincroniza o progresso local (localStorage) com a conta via
   POST /api/migrate (merge canônico, fonte de verdade no servidor).
   Segue o contrato de BACKEND do script.js: expõe window.API.
   ============================================================ */

(function () {
  'use strict';

  var API_URL = '/api';

  // Estado da sessão
  var estado = {
    conectado: false,
    usuario: null,
    aFazer: false
  };

  function repararUrl(caminho) {
    var url = caminho.charAt(0) === '/' ? caminho : '/' + caminho;
    return url.indexOf('/api/') === 0 ? url : API_URL + '/' + caminho;
  }

  // fetch com timeout e parsing JSON seguro
  function pedir(caminho, opcoes) {
    opcoes = opcoes || {};
    var url = repararUrl(caminho);
    var cfg = {
      method: opcoes.metodo || 'GET',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'same-origin',
      redirect: 'follow'
    };
    if (opcoes.corpo !== undefined) cfg.body = JSON.stringify(opcoes.corpo);

    var controlador;
    if (typeof AbortController !== 'undefined') {
      controlador = new AbortController();
      cfg.signal = controlador.signal;
    }

    var timers = null;
    var promessa = fetch(url, cfg).then(function (r) {
      return r.json().catch(function () { return { erro: 'Resposta inválida do servidor.' }; }).then(function (dados) {
        return { status: r.status, ok: r.ok, dados: dados, headers: r.headers };
      });
    });

    if (controlador) {
      timers = setTimeout(function () { controlador.abort(); }, 15000);
      promessa = promessa.finally(function () { clearTimeout(timers); });
    }
    return promessa;
  }

  // helper: dispara erro de API quando ok=false
  function garantir(resposta) {
    if (!resposta.ok) {
      var erroMsg = resposta.dados && resposta.dados.erro ? resposta.dados.erro : 'Falha na comunicação com o servidor.';
      var e = new Error(erroMsg);
      e.status = resposta.status;
      throw e;
    }
    return resposta.dados;
  }

  // ---------- SESSÃO ----------

  function usuarioLogado() { return estado.usuario; }

  // CONSULTA o backend; não lança se offline.
  async function verificarBackend() {
    try {
      const r = await pedir('health');
      if (r.ok) {
        estado.conectado = true;
        try { BACKEND.conectar({ tipo: 'api', apiUrl: API_URL }); } catch (e) { /* sem script.js conectado */ }
      } else {
        estado.conectado = false;
      }
    } catch (e) {
      estado.conectado = false;
      try { BACKEND.desconectar(); } catch (e2) {}
    }
    return estado.conectado;
  }

  async function buscarSessao() {
    try {
      const r = await pedir('auth/estado');
      const d = garantir(r);
      estado.usuario = d.usuario || null;
      return estado.usuario;
    } catch (e) {
      estado.usuario = null;
      return null;
    }
  }

  async function registrar(dados) {
    const r = await pedir('auth/registrar', { metodo: 'POST', corpo: dados });
    const d = garantir(r);
    estado.usuario = d.usuario || null;
    return d;
  }

  async function login(dados) {
    const r = await pedir('auth/login', { metodo: 'POST', corpo: dados });
    const d = garantir(r);
    estado.usuario = d.usuario || null;
    return d;
  }

  async function logout() {
    try { await pedir('auth/logout', { metodo: 'POST', corpo: {} }); } catch (e) {}
    estado.usuario = null;
  }

  async function atualizarMe(dados) {
    const r = await pedir('me', { metodo: 'PATCH', corpo: dados });
    const d = garantir(r);
    estado.usuario = d.usuario || estado.usuario;
    return d;
  }

  // ---------- SINCRONIZAÇÃO DE PROGRESSO ----------

  // Coleta o estado local inteiro (localStorage) no formato canônico.
  function montarSnapshot() {
    function ler(chave, padrao) {
      try {
        var v = localStorage.getItem(chave);
        return v === null ? padrao : JSON.parse(v);
      } catch (e) { return padrao; }
    }
    return {
      perfil: {
        xp: ler('quizAKE_xp', 0),
        recorde: ler('quizAKE_recorde', 0),
        stats: ler('quizAKE_stats', {}),
        conquistas: ler('quizAKE_conquistas', []),
        favoritos: ler('quizAKE_favoritos', []),
        streak: ler('quizAKE_streak', { dias: [] }),
        desafio: ler('quizAKE_desafio', {})
      },
      partidas: ler('quizAKE_partidas', [])
    };
  }

  // Aplica o estado canônico devolvido pelo servidor no localStorage.
  function aplicarCanonico(dados) {
    var p = dados.perfil;
    if (!p) return;
    localStorage.setItem('quizAKE_xp', JSON.stringify(p.xp));
    localStorage.setItem('quizAKE_recorde', JSON.stringify(p.recorde));
    localStorage.setItem('quizAKE_xp_nivel', JSON.stringify(p.nivel));
    localStorage.setItem('quizAKE_stats', JSON.stringify(p.stats || {}));
    localStorage.setItem('quizAKE_conquistas', JSON.stringify(p.conquistas || []));
    localStorage.setItem('quizAKE_favoritos', JSON.stringify(p.favoritos || []));
    localStorage.setItem('quizAKE_streak', JSON.stringify(p.streak || { dias: [] }));
    localStorage.setItem('quizAKE_desafio', JSON.stringify(p.desafio || {}));
    if (Array.isArray(dados.partidas)) {
      localStorage.setItem('quizAKE_partidas', JSON.stringify(dados.partidas.slice(0, 120)));
    }
  }

  // Envia o progresso local ao servidor e aplica a resposta canônica.
  async function sincronizar() {
    if (!estado.conectado || !estado.usuario) return false;
    try {
      const snapshot = montarSnapshot();
      const r = await pedir('migrate', { metodo: 'POST', corpo: snapshot });
      const d = garantir(r);
      aplicarCanonico(d);
      return true;
    } catch (e) {
      // offline: ignora silenciosamente, o próximo login re-sincroniza.
      return false;
    }
  }

  async function buscarProgresso() {
    if (!estado.usuario) return null;
    const r = await pedir('me/progresso');
    return garantir(r);
  }

  // ---------- QUIZZES / CONTEÚDO ----------

  async function listarQuizzes(opcoes) {
    opcoes = opcoes || {};
    var qs = [];
    if (opcoes.todos) qs.push('todos=1');
    if (opcoes.criados) qs.push('criados=1');
    if (opcoes.categoria) qs.push('categoria=' + encodeURIComponent(opcoes.categoria));
    var suf = qs.length ? '?' + qs.join('&') : '';
    const r = await pedir('quizzes' + suf);
    return garantir(r);
  }

  async function detalheQuiz(id) {
    const r = await pedir('quizzes/' + encodeURIComponent(id));
    return garantir(r);
  }

  async function criarQuiz(dados) {
    const r = await pedir('quizzes', { metodo: 'POST', corpo: dados });
    return garantir(r);
  }

  async function editarQuiz(id, dados) {
    const r = await pedir('quizzes/' + encodeURIComponent(id), { metodo: 'PATCH', corpo: dados });
    return garantir(r);
  }

  async function removerQuiz(id) {
    const r = await pedir('quizzes/' + encodeURIComponent(id), { metodo: 'DELETE' });
    return garantir(r);
  }

  async function gerarQuizIA(dados) {
    const r = await pedir('ia/gerar', { metodo: 'POST', corpo: dados });
    return garantir(r);
  }

  async function salvarQuizIA(dados) {
    const r = await pedir('ia/gerar/salvar', { metodo: 'POST', corpo: dados });
    return garantir(r);
  }

  // ---------- RANKING ----------

  async function ranking(opcoes) {
    opcoes = opcoes || {};
    var qs = [];
    if (opcoes.tipo) qs.push('tipo=' + encodeURIComponent(opcoes.tipo));
    if (opcoes.periodo) qs.push('periodo=' + encodeURIComponent(opcoes.periodo));
    var suf = qs.length ? '?' + qs.join('&') : '';
    const r = await pedir('ranking' + suf);
    return garantir(r);
  }

  // ---------- DESAFIO DO DIA ----------

  async function desafioHoje() {
    const r = await pedir('desafio');
    return garantir(r);
  }

  async function enviarDesafio(dados) {
    const r = await pedir('desafio/resultado', { metodo: 'POST', corpo: dados });
    return garantir(r);
  }

  // ---------- SALAS (multiplayer) ----------

  async function criarSala(quizId) {
    const r = await pedir('salas', { metodo: 'POST', corpo: { quizId: quizId } });
    return garantir(r);
  }

  async function entrarSala(codigo) {
    const r = await pedir('salas/' + encodeURIComponent(codigo) + '/entrar', { metodo: 'POST', corpo: {} });
    return garantir(r);
  }

  async function salaEstado(codigo) {
    const r = await pedir('salas/' + encodeURIComponent(codigo));
    return garantir(r);
  }

  async function iniciarSala(codigo) {
    const r = await pedir('salas/' + encodeURIComponent(codigo) + '/iniciar', { metodo: 'POST', corpo: {} });
    return garantir(r);
  }

  async function finalizarSala(codigo) {
    const r = await pedir('salas/' + encodeURIComponent(codigo) + '/finalizar', { metodo: 'POST', corpo: {} });
    return garantir(r);
  }

  async function salaResultado(codigo, dados) {
    const r = await pedir('salas/' + encodeURIComponent(codigo) + '/resultado', { metodo: 'POST', corpo: dados });
    return garantir(r);
  }

  // ---------- ADMIN ----------

  async function adminDashboard() {
    const r = await pedir('admin/dashboard');
    return garantir(r);
  }

  async function adminUsuarios(busca) {
    var suf = busca ? '?q=' + encodeURIComponent(busca) : '';
    const r = await pedir('admin/usuarios' + suf);
    return garantir(r);
  }

  async function adminEditarUsuario(id, dados) {
    const r = await pedir('admin/usuarios/' + encodeURIComponent(id), { metodo: 'PATCH', corpo: dados });
    return garantir(r);
  }

  // ---------- CICLO DE VIDA ----------

  // Chamado no start: consulta backend e (se logado) sincroniza.
  async function iniciar() {
    await verificarBackend();
    await buscarSessao();
    if (estado.conectado && estado.usuario) {
      await sincronizar();
      // força re-render da interface de conta
      if (typeof window !== 'undefined') {
        var ev = new CustomEvent('qake:sessao', { detail: { usuario: estado.usuario, conectado: estado.conectado } });
        window.dispatchEvent(ev);
      }
    }
    return estado;
  }

  // Ponto único para o script.js chamar após um jogo / mudança de favorito.
  function agendarSincronizacao() {
    if (estado.aFazer) return;
    estado.aFazer = true;
    setTimeout(async function () {
      estado.aFazer = false;
      await sincronizar();
    }, 700);
  }

  window.API = {
    // infra
    pedir: pedir,
    // sessão
    usuarioLogado: usuarioLogado,
    verificarBackend: verificarBackend,
    buscarSessao: buscarSessao,
    registrar: registrar,
    login: login,
    logout: logout,
    atualizarMe: atualizarMe,
    // sync
    sincronizar: sincronizar,
    agendarSincronizacao: agendarSincronizacao,
    buscarProgresso: buscarProgresso,
    // conteúdo
    listarQuizzes: listarQuizzes,
    detalheQuiz: detalheQuiz,
    criarQuiz: criarQuiz,
    editarQuiz: editarQuiz,
    removerQuiz: removerQuiz,
    gerarQuizIA: gerarQuizIA,
    salvarQuizIA: salvarQuizIA,
    // ranking
    ranking: ranking,
    // desafio do dia
    desafioHoje: desafioHoje,
    enviarDesafio: enviarDesafio,
    // salas
    criarSala: criarSala,
    entrarSala: entrarSala,
    salaEstado: salaEstado,
    iniciarSala: iniciarSala,
    finalizarSala: finalizarSala,
    salaResultado: salaResultado,
    // admin
    adminDashboard: adminDashboard,
    adminUsuarios: adminUsuarios,
    adminEditarUsuario: adminEditarUsuario,
    // ciclo de vida
    iniciar: iniciar,
    montarSnapshot: montarSnapshot,
    // estado
    get conectado() { return estado.conectado; },
    get usuario() { return estado.usuario; }
  };
})();