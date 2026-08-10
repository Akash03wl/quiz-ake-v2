/* ============================================================
   QUIZ AKE BACKEND - lib/validacao.js
   Validação e saneamento de entradas. Todas as funções retornam
   { ok: true, valor } ou { ok: false, erro }.
   Segurança: remove tags HTML/scripts e limita tamanho.
   ============================================================ */

const TAM_MAX = {
  nome: 40,
  email: 120,
  senha: 72,
  titulo: 80,
  descricao: 300,
  pergunta: 500,
  alternativa: 200,
  explicacao: 500,
  categoria: 30,
  tags: 12,
  quizCor: 20,
  autor: 40
};

// Remove tags e scripts; preserva acentos e emojis.
function limparTexto(texto, max) {
  if (typeof texto !== 'string') return '';
  let t = texto.replace(/<[^>]*>/g, ' ').replace(/<\/?script[^>]*>/gi, ' ');
  t = t.replace(/[<>]/g, ' ').replace(/["'`]/g, "'").trim();
  if (max) t = t.slice(0, max);
  return t;
}

function validarTexto(campo, texto, min, max, obrigatorio) {
  const t = limparTexto(texto, max);
  if (obrigatorio && !t) return { ok: false, erro: campo + ' é obrigatório.' };
  if (min && t.length < min) return { ok: false, erro: campo + ' deve ter pelo menos ' + min + ' caracteres.' };
  if (t.length > max) return { ok: false, erro: campo + ' é muito longo.' };
  return { ok: true, valor: t };
}

function validarEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!e || e.length > TAM_MAX.email) return { ok: false, erro: 'E-mail inválido.' };
  if (!re.test(e)) return { ok: false, erro: 'E-mail inválido.' };
  return { ok: true, valor: e };
}

function validarSenha(senha) {
  if (typeof senha !== 'string' || senha.length < 6) return { ok: false, erro: 'A senha deve ter pelo menos 6 caracteres.' };
  if (senha.length > TAM_MAX.senha) return { ok: false, erro: 'Senha muito longa.' };
  return { ok: true, valor: senha };
}

function validarId(id) {
  const s = String(id || '').trim();
  if (!s || s.length > 64 || /[^a-zA-Z0-9_-]/.test(s)) return { ok: false, erro: 'Identificador inválido.' };
  return { ok: true, valor: s };
}

const CATEGORIAS_VALIDAS = [
  'geral', 'historia', 'geografia', 'ciencia', 'tecnologia', 'games',
  'filmes', 'musica', 'esportes', 'matematica', 'portugues', 'brasil', 'logica'
];
const DIFICULDADES_VALIDAS = ['facil', 'medio', 'dificil', 'insano'];

function validarCategoria(cat) {
  if (!CATEGORIAS_VALIDAS.includes(cat)) return { ok: false, erro: 'Categoria inválida.' };
  return { ok: true, valor: cat };
}

function validarDificuldade(dif) {
  if (!DIFICULDADES_VALIDAS.includes(dif)) return { ok: false, erro: 'Dificuldade inválida.' };
  return { ok: true, valor: dif };
}

// Valida uma pergunta completa (multipla escolha ou verdadeiro/falso).
function validarPergunta(p, idx) {
  const base = 'Pergunta ' + (idx + 1) + ': ';
  if (!p || typeof p !== 'object') return { ok: false, erro: base + 'dados inválidos.' };

  const pergunta = limparTexto(p.pergunta, TAM_MAX.pergunta);
  if (!pergunta) return { ok: false, erro: base + 'o enunciado é obrigatório.' };

  const tipo = p.tipo === 'vf' ? 'vf' : 'multipla';
  let alternativas = Array.isArray(p.alternativas) ? p.alternativas : [];
  alternativas = alternativas.map(function (a) { return limparTexto(a, TAM_MAX.alternativa); }).filter(Boolean);

  if (tipo === 'vf') {
    alternativas = ['Verdadeiro', 'Falso'];
  }
  if (alternativas.length < 2) return { ok: false, erro: base + 'informe pelo menos 2 alternativas.' };

  let correta = Number(p.correta);
  if (!Number.isInteger(correta) || correta < 0 || correta >= alternativas.length) {
    return { ok: false, erro: base + 'a alternativa correta é inválida.' };
  }

  return {
    ok: true,
    valor: {
      pergunta: pergunta,
      tipo: tipo,
      alternativas: alternativas.slice(0, 6),
      correta: correta,
      explicacao: limparTexto(p.explicacao, TAM_MAX.explicacao),
      dificuldade: p.dificuldade || 'medio'
    }
  };
}

// Valida a estrutura completa de um quiz (para criação/edição).
function validarQuizQuizz(data) {
  const titulo = validarTexto('Título', data.titulo, 3, TAM_MAX.titulo, true);
  if (!titulo.ok) return titulo;
  const categoria = validarCategoria(data.categoria || 'geral');
  if (!categoria.ok) return categoria;
  const dificuldade = validarDificuldade(data.dificuldade || 'medio');

  const perguntas = Array.isArray(data.perguntas) ? data.perguntas : [];
  if (perguntas.length < 1) return { ok: false, erro: 'Um quiz precisa de pelo menos 1 pergunta.' };
  if (perguntas.length > 40) return { ok: false, erro: 'Máximo de 40 perguntas por quiz.' };

  const perguntasValidas = [];
  for (let i = 0; i < perguntas.length; i++) {
    const p = validarPergunta(perguntas[i], i);
    if (!p.ok) return p;
    perguntasValidas.push(p.valor);
  }

  const tags = Array.isArray(data.tags)
    ? data.tags.map(function (t) { return limparTexto(t, 20); }).filter(Boolean).slice(0, TAM_MAX.tags)
    : [];

  return {
    ok: true,
    valor: {
      titulo: titulo.valor,
      descricao: limparTexto(data.descricao, TAM_MAX.descricao),
      categoria: categoria.valor,
      dificuldade: dificuldade.ok ? dificuldade.valor : 'medio',
      emoji: limparTexto(data.emoji, 8) || '🧠',
      cor: limparTexto(data.cor, TAM_MAX.quizCor) || '#7c6cf0',
      tags: tags,
      perguntas: perguntasValidas
    }
  };
}

// Nomes de jogadores de sala (permitem caracteres simples + emojis).
function validarJogadorNome(nome) {
  const t = limparTexto(nome, 24);
  if (!t) return { ok: false, erro: 'Informe seu nome.' };
  return { ok: true, valor: t };
}

// Filtra um objeto perfil recebido na migração, garantindo tipos.
function sanearPerfil(perfil) {
  const p = (perfil && typeof perfil === 'object') ? perfil : {};
  return {
    xp: Math.max(0, Math.floor(Number(p.xp) || 0)),
    recorde: Math.max(0, Math.floor(Number(p.recorde) || 0)),
    stats: (p.stats && typeof p.stats === 'object') ? p.stats : {},
    conquistas: Array.isArray(p.conquistas) ? p.conquistas.map(String).slice(0, 100) : [],
    favoritos: Array.isArray(p.favoritos) ? p.favoritos.map(String).slice(0, 100) : [],
    streak: (p.streak && typeof p.streak === 'object') ? p.streak : { dias: [] },
    desafio: (p.desafio && typeof p.desafio === 'object') ? p.desafio : {}
  };
}

export {
  TAM_MAX,
  limparTexto,
  validarTexto,
  validarEmail,
  validarSenha,
  validarId,
  validarCategoria,
  validarDificuldade,
  validarPergunta,
  validarQuizQuizz,
  validarJogadorNome,
  sanearPerfil,
  CATEGORIAS_VALIDAS,
  DIFICULDADES_VALIDAS
};

export default { TAM_MAX, CATEGORIAS_VALIDAS, DIFICULDADES_VALIDAS };