/* ==========================================================
   ARQUIVO DE LÓGICA (JavaScript) do Quiz
   Aqui fica o FUNCIONAMENTO do jogo.
   Este arquivo é carregado pelo HTML através da tag <script>.
   ========================================================== */

/* ------------------------------------------------------------
   1) O "banco de perguntas" (BANCO GRANDE)
   É uma lista (array) MUITO maior do que antes.
   Cada objeto tem:
     - pergunta       : o texto da pergunta
     - alternativas   : as 4 opções de resposta
     - correta        : o ÍNDICE (0,1,2,3) da resposta certa
     - valor          : o "peso" da pergunta
                        valor 1 = normal (pontos base)
                        valor 2 = PERGUNTA PRÊMIO (dobra os pontos)
                        valor 3 = PERGUNTA PRÊMIO (triplica os pontos)
   ------------------------------------------------------------ */
const bancoDePerguntas = [
  // --- Ciência / Natureza ---
  { pergunta: "Qual é o maior planeta do Sistema Solar?", alternativas: ["Terra", "Júpiter", "Saturno", "Marte"], correta: 1, valor: 1 },
  { pergunta: "Qual é o símbolo químico do ouro?", alternativas: ["Au", "Ag", "Fe", "O"], correta: 0, valor: 1 },
  { pergunta: "Qual é o maior oceano do mundo?", alternativas: ["Atlântico", "Índico", "Pacífico", "Ártico"], correta: 2, valor: 1 },
  { pergunta: "Qual destes animais é um mamífero?", alternativas: ["Tubarão", "Golfinho", "Polvo", "Tartaruga"], correta: 1, valor: 2 }, // PRÊMIO
  { pergunta: "Qual gás os seres humanos respiram para sobreviver?", alternativas: ["Oxigênio", "Hidrogênio", "Gás carbônico", "Hélio"], correta: 0, valor: 1 },
  { pergunta: "Quantos ossos tem (aproximadamente) o corpo humano adulto?", alternativas: ["106", "206", "306", "406"], correta: 1, valor: 2 }, // PRÊMIO
  { pergunta: "Qual planeta é conhecido como o 'Planeta Vermelho'?", alternativas: ["Vênus", "Marte", "Mercúrio", "Netuno"], correta: 1, valor: 1 },
  { pergunta: "O que a fotossíntese produz nas plantas?", alternativas: ["Oxigênio", "Carbono", "Nitrogênio", "Hidrogênio"], correta: 0, valor: 1 },
  { pergunta: "Quantos estados (estados físicos) básicos da matéria existem?", alternativas: ["2", "3", "4", "5"], correta: 1, valor: 3 }, // PRÊMIO
  { pergunta: "Qual é o planeta mais próximo do Sol?", alternativas: ["Vênus", "Mercúrio", "Terra", "Marte"], correta: 1, valor: 1 },

  // Matemática
  { pergunta: "Quantos lados tem um hexágono?", alternativas: ["4", "5", "6", "7"], correta: 2, valor: 1 },
  { pergunta: "Qual é o resultado de 7 x 8?", alternativas: ["48", "54", "56", "64"], correta: 2, valor: 1 },
  { pergunta: "Qual é o único número primo par?", alternativas: ["0", "1", "2", "4"], correta: 2, valor: 2 }, // PRÊMIO
  { pergunta: "Quanto é a raiz quadrada de 144?", alternativas: ["10", "11", "12", "14"], correta: 2, valor: 1 },
  { pergunta: "Qual é o ângulo de um triângulo retângulo em um dos seus cantos?", alternativas: ["45º", "60º", "90º", "120º"], correta: 2, valor: 2 }, // PRÊMIO

  // Geografia
  { pergunta: "Qual é a capital da França?", alternativas: ["Londres", "Paris", "Roma", "Berlim"], correta: 1, valor: 1 },
  { pergunta: "Qual é a capital do Brasil?", alternativas: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"], correta: 2, valor: 1 },
  { pergunta: "Qual é o maior país do mundo em território?", alternativas: ["China", "EUA", "Brasil", "Rússia"], correta: 3, valor: 1 },
  { pergunta: "Qual é a maior cidade da Europa em população?", alternativas: ["Paris", "Londres", "Moscou", "Madrid"], correta: 2, valor: 3 }, // PRÊMIO
  { pergunta: "Quantos continentes existem no planeta?", alternativas: ["5", "6", "7", "8"], correta: 2, valor: 1 },
  { pergunta: "Em que continente fica o Egito?", alternativas: ["Ásia", "África", "Europa", "América"], correta: 1, valor: 1 },
  { pergunta: "Qual o maior deserto do mundo (não contando o polar)?", alternativas: ["Saara", "Gobi", "Kalahari", "Atacama"], correta: 0, valor: 2 }, // PRÊMIO

  // Arte / Cultura
  { pergunta: "Quem pintou a Mona Lisa?", alternativas: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo"], correta: 2, valor: 2 }, // PRÊMIO
  { pergunta: "Qual artista é conhecido como o 'Rei do Pop'?", alternativas: ["Elvis Presley", "Freddie Mercury", "Michael Jackson", "Bob Dylan"], correta: 2, valor: 1 },
  { pergunta: "Quem escreveu 'Dom Casmurro'?", alternativas: ["José de Alencar", "Machado de Assis", "Clarice Lispector", "Graciliano Ramos"], correta: 1, valor: 2 }, // PRÊMIO
  { pergunta: "Qual é a nacionalidade de Beethoven?", alternativas: ["Francês", "Alemão", "Italiano", "Austríaco"], correta: 1, valor: 1 },
  { pergunta: "Em qual ano o Brasil comemorou 500 anos de descobrimento?", alternativas: ["1998", "2000", "2002", "2005"], correta: 1, valor: 3 },

  // História
  { pergunta: "Quem foi o primeiro presidente do Brasil?", alternativas: ["Getúlio Vargas", "Deodoro da Fonseca", "Juscelino Kubitschek", "Washington Luís"], correta: 1, valor: 1 },
  { pergunta: "Quando o homem pisou na Lua pela primeira vez?", alternativas: ["1965", "1969", "1972", "1979"], correta: 1, valor: 2 }, // PRÊMIO
  { pergunta: "Qual país foi o primeiro a conquistar uma Copa do Mundo?", alternativas: ["Brasil", "Itália", "Uruguai", "Argentina"], correta: 2, valor: 3 },
  { pergunta: "Qual cidade foi a primeira capital do Brasil em 1500?", alternativas: ["Salvador", "Rio de Janeiro", "Recife", "São Paulo"], correta: 0, valor: 2 }
];

/* ------------------------------------------------------------
   2) Configurações do jogo (as "regras")
   ------------------------------------------------------------ */
const TEMPO_POR_PERGUNTA = 20;    // segundos (pedido: aumentar para 20s)
const QUANTAS_PERGUNTAS = 10;     // quantas perguntas sorteamos por partida
const PONTOS_CERTA = 10;          // pontos base ao acertar
const BONUS_COMBO = 5;            // pontos extras por acerto SEGUIDO
const MAXIMO_PONTOS_POR_PERGUNTA = PONTOS_CERTA * 3; // usado no cálculo do perfil

/* ------------------------------------------------------------
   3) Variáveis de "estado" (valores que mudam durante o jogo)
   ------------------------------------------------------------ */
let perguntasSorteio = [];   // quais perguntas serão usadas NESTA partida
let indiceAtual = 0;         // qual pergunta estamos (0 = primeira)
let pontuacao = 0;           // total de pontos
let sequenciaCerta = 0;      // quantas certas SEGUIDAS
let respondeuJa = false;     // já respondeu esta pergunta? (evita clicar 2x)
let melhorPontuacao = 0;     // recorde salvo no navegador
let tempoRestante = 0;       // segundos que faltam no cronômetro
let cronometro = null;       // identifica o "setInterval" no cronômetro

/* ------------------------------------------------------------
   4) Pegando referências das partes da página (getElementById)
   Serve para podermos mexer (mostrar/alterar) cada elemento.
   ------------------------------------------------------------ */
const telaInicio = document.getElementById('tela-inicio');
const telaQuiz = document.getElementById('tela-quiz');
const telaResultado = document.getElementById('tela-resultado');

const barraProgresso = document.getElementById('barra-progresso');
const textoProgresso = document.getElementById('texto-progresso');

const numeroTimer = document.getElementById('numero-timer');
const barraTimer = document.getElementById('barra-timer');

const numeroPergunta = document.getElementById('numero-pergunta');
const seloBonus = document.getElementById('selo-bonus');
const textoPergunta = document.getElementById('texto-pergunta');
const areaRespostas = document.getElementById('area-respostas');

const textoPontuacao = document.getElementById('pontuacao');
const textoSeguencia = document.getElementById('sequencia');
const textoPontosFinal = document.getElementById('pontuacao-final');

const textoMelhorResultado = document.getElementById('melhor-pontuacao');
const textoMelhorInicio = document.getElementById('melhor-pontuacao-inicio');

const emojiResultado = document.getElementById('emoji-resultado');
const tituloResultado = document.getElementById('titulo-resultado');
const subtituloResultado = document.getElementById('subtitulo-resultado');

/* ------------------------------------------------------------
   5) Recuperar a melhor pontuação salva (localStorage)
   ------------------------------------------------------------ */
function carregarMelhorPontuacao() {
  const salvo = localStorage.getItem('melhorPontuacaoQuiz');
  if (salvo !== null) {
    melhorPontuacao = Number(salvo);   // transforma texto em número
  }
  // Usa texto simples (textContent) pois o HTML já tem o emoji 🏅
  textoMelhorInicio.textContent = '🏅 Melhor pontuação: ' + melhorPontuacao;
  textoMelhorResultado.textContent = '🏅 Melhor pontuação: ' + melhorPontuacao;
}

/* ------------------------------------------------------------
   6) Salvar a melhor pontuação (chamado no final do jogo)
   ------------------------------------------------------------ */
function salvarMelhorPontuacao() {
  if (pontuacao > melhorPontuacao) {
    melhorPontuacao = pontuacao;
    localStorage.setItem('melhorPontuacaoQuiz', melhorPontuacao);   // guarda no navegador
  }
  textoMelhorResultado.textContent = '🏅 Melhor pontuação: ' + melhorPontuacao;
  textoMelhorInicio.textContent = '🏅 Melhor pontuação: ' + melhorPontuacao;
}

/* ------------------------------------------------------------
   7) Mostrar uma tela e esconder as outras
   ------------------------------------------------------------ */
function mostrarTela(telaParaMostrar) {
  telaInicio.classList.add('hidden');
  telaQuiz.classList.add('hidden');
  telaResultado.classList.add('hidden');
  telaParaMostrar.classList.remove('hidden');
}

/* ------------------------------------------------------------
   8) SORTEAR as perguntas (embaralha o banco e escolhe algumas)
   ------------------------------------------------------------ */
function sortearPerguntas() {
  // Cria uma cópia do banco para não estragar o original
  const embaralhadas = bancoDePerguntas.slice();

  // Embaralha a cópia usando o algoritmo de mistura (Fisher-Yates)
  for (let i = embaralhadas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // índice aleatório
    const troca = embaralhadas[i];                 // guarda
    embaralhadas[i] = embaralhadas[j];             // troca posição i
    embaralhadas[j] = troca;                       // coloca na posição j
  }

  // Pega só as primeiras "QUANTAS_PERGUNTAS" da lista embaralhada
  perguntasSorteio = embaralhadas.slice(0, QUANTAS_PERGUNTAS);
}

/* ------------------------------------------------------------
   9) COMEÇAR o jogo (sorteia, zera tudo e mostra a 1ª pergunta)
   ------------------------------------------------------------ */
function comecarQuiz() {
  sortearPerguntas();        // escolhe as perguntas aleatórias
  indiceAtual = 0;
  pontuacao = 0;
  sequenciaCerta = 0;

  textoPontuacao.textContent = '0';
  textoSeguencia.textContent = '0';

  mostrarTela(telaQuiz);
  mostrarPergunta();
}

/* ------------------------------------------------------------
   10) MOSTRAR uma pergunta na tela e iniciar o cronômetro
   ------------------------------------------------------------ */
function mostrarPergunta() {
  const atual = perguntasSorteio[indiceAtual];   // pergunta sorteada atual

  numeroPergunta.textContent = 'Pergunta ' + (indiceAtual + 1);
  textoPergunta.textContent = atual.pergunta;

  // Barra de progresso (percentual concluído)
  const total = perguntasSorteio.length;
  const concluido = (indiceAtual / total) * 100;
  barraProgresso.style.width = concluido + '%';
  textoProgresso.textContent = 'Pergunta ' + (indiceAtual + 1) + ' de ' + total;

  // Mostra o "selo" somente se a pergunta for prêmio (valor > 1)
  if (atual.valor > 1) {
    seloBonus.classList.remove('hidden');
    // Troca o texto do selo para indicar 2x ou 3x
    seloBonus.textContent = '⭐ PERGUNTA PRÊMIO (x' + atual.valor + ')';
  } else {
    seloBonus.classList.add('hidden');
  }

  // Limpa as alternativas anteriores e cria as novas
  areaRespostas.innerHTML = '';

  for (let i = 0; i < atual.alternativas.length; i++) {
    const botao = document.createElement('button');
    botao.classList.add('answer-btn');
    botao.textContent = atual.alternativas[i];

    // Ao clicar, chama a função responder(índice, botao) e passa o valor
    botao.addEventListener('click', function() {
      responder(i, botao, atual.valor);
    });

    areaRespostas.appendChild(botao);
  }

  // Libera para responder esta pergunta
  respondeuJa = false;

  // Reinicia o cronômetro
  iniciarTimer();
}

/* ------------------------------------------------------------
   11) CRONÔMETRO (conta de 20 até 0, atualizando a cada segundo)
   ------------------------------------------------------------ */
function iniciarTimer() {
  pararTimer();   // garante que não há cronômetro anterior rodando

  tempoRestante = TEMPO_POR_PERGUNTA;
  numeroTimer.textContent = tempoRestante;

  barraTimer.style.width = '100%';
  numeroTimer.className = 'timer-number';
  barraTimer.style.background = '#28a745';

  // setInterval chama a função a cada 1000 ms (1 segundo)
  cronometro = setInterval(function() {
    tempoRestante--;
    numeroTimer.textContent = tempoRestante;

    const porcentagem = (tempoRestante / TEMPO_POR_PERGUNTA) * 100;
    barraTimer.style.width = porcentagem + '%';

    // Muda a cor conforme a pressa
    if (tempoRestante <= 5) {
      numeroTimer.className = 'timer-number danger';   // vermelho piscando
      barraTimer.style.background = '#e74c3c';
    } else if (tempoRestante <= 9) {
      numeroTimer.className = 'timer-number warning';  // laranja
      barraTimer.style.background = '#f39c12';
    }

    if (tempoRestante <= 0) {
      pararTimer();
      tempoEsgotado();
    }
  }, 1000);
}

/* Para (cancela) o cronômetro */
function pararTimer() {
  if (cronometro !== null) {
    clearInterval(cronometro);
    cronometro = null;
  }
}

/* ------------------------------------------------------------
   12) Quando o TEMPO acaba sem resposta
   ------------------------------------------------------------ */
function tempoEsgotado() {
  const botoes = areaRespostas.querySelectorAll('.answer-btn');
  botoes.forEach(function(botao) {
    botao.disabled = true;
  });

  // A resposta certa é destacada para o jogador aprender
  const indiceCerto = perguntasSorteio[indiceAtual].correta;
  botoes[indiceCerto].classList.add('correct');

  // Quebra o combo
  sequenciaCerta = 0;
  textoSeguencia.textContent = '0';

  proximaPergunta();
}

/* ------------------------------------------------------------
   13) O que acontece quando o usuário CLICA em uma alternativa
   Aqui entra a lógica da PERGUNTA PRÊMIO: se a pergunta tem
   "valor", os pontos ganhos são multiplicados por esse valor.
   ------------------------------------------------------------ */
function responder(indiceClicado, botaoClicado, valorPergunta) {
  // Proteção contra múltiplos cliques na mesma pergunta
  if (respondeuJa) return;
  respondeuJa = true;

  pararTimer();   // para o cronômetro

  const pergunta = perguntasSorteio[indiceAtual];
  const respostaCerta = pergunta.correta;

  // Desabilita todos os botões (não pode trocar a resposta)
  const todosBotoes = areaRespostas.querySelectorAll('.answer-btn');
  todosBotoes.forEach(function(botao) {
    botao.disabled = true;
  });

  // ---------------- ACERTOU ----------------
  if (indiceClicado === respostaCerta) {
    botaoClicado.classList.add('correct');

    sequenciaCerta++;

    // Pontos = base + bônus do combo, MULTIPLICADO pela "valor" da pergunta
    const pontosBase = PONTOS_CERTA + (BONUS_COMBO * (sequenciaCerta - 1));
    const pontosGanhos = pontosBase * valorPergunta;
    pontuacao += pontosGanhos;

    textoPontuacao.textContent = pontuacao;
    textoSeguencia.textContent = sequenciaCerta;

    tocarSom(true);
    criarConfete();

    // Mostra na mensagem se foi pergunta prêmio
    if (valorPergunta > 1) {
      mostrarMensagem('+ ' + pontosGanhos + ' pontos (x' + valorPergunta + ') ⭐', '#28a745');
    } else {
      mostrarMensagem('+ ' + pontosGanhos + ' pontos', '#28a745');
    }

  } else {
    // ---------------- ERROU ----------------
    botaoClicado.classList.add('wrong');
    todosBotoes[respostaCerta].classList.add('correct');   // mostra a certa

    sequenciaCerta = 0;
    textoSeguencia.textContent = '0';
    tocarSom(false);
    mostrarMensagem('✖ Errou...', '#e74c3c');
  }

  proximaPergunta();
}

/* ------------------------------------------------------------
   14) Mensagem flutuante (ex: "+15 pontos", "Errou...")
   ------------------------------------------------------------ */
function mostrarMensagem(texto, cor) {
  const msg = document.createElement('div');
  msg.classList.add('floating-msg');            // usa o estilo do CSS
  msg.textContent = texto;
  msg.style.color = cor;

  document.body.appendChild(msg);

  setTimeout(function() {
    if (msg.parentNode) msg.parentNode.removeChild(msg);
  }, 1000);
}

/* ------------------------------------------------------------
   15) Confete simples: emojis que "caem" pela tela (ao acertar)
   ------------------------------------------------------------ */
function criarConfete() {
  const emojis = ['🎉', '⭐', '✨', '🎊', '🌟'];
  for (let i = 0; i < 12; i++) {
    const pedaco = document.createElement('div');
    pedaco.classList.add('confetti-piece');
    pedaco.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    pedaco.style.left = Math.random() * 100 + 'vw';
    pedaco.style.animationDuration = (1.2 + Math.random() * 0.8) + 's';
    pedaco.style.fontSize = (14 + Math.random() * 18) + 'px';

    document.body.appendChild(pedaco);

    setTimeout(function(p) {
      return function() {
        if (p.parentNode) p.parentNode.removeChild(p);
      };
    }(pedaco), 2200);
  }
}

/* ------------------------------------------------------------
   16) SOM: usa a Web Audio API (não precisa arquivo externo)
   ------------------------------------------------------------ */
function tocarSom(acertou) {
  try {
    const contexto = new (window.AudioContext || window.webkitAudioContext)();
    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();

    oscilador.connect(ganho);
    ganho.connect(contexto.destination);

    oscilador.frequency.value = acertou ? 720 : 220;   // agudo ou grave
    ganho.gain.value = 0.2;
    oscilador.start();
    oscilador.stop(contexto.currentTime + 0.25);
  } catch (e) {
    // Se o navegador não suportar som, ignora silenciosamente
  }
}

/* ------------------------------------------------------------
   17) Passar para a Próxima pergunta (ou encerrar o quiz)
   ------------------------------------------------------------ */
function proximaPergunta() {
  setTimeout(function() {
    indiceAtual++;
    if (indiceAtual < perguntasSorteio.length) {
      mostrarPergunta();       // ainda há perguntas
    } else {
      finalizarQuiz();         // acabaram as perguntas
    }
  }, 1500);
}

/* ------------------------------------------------------------
   18) Fim do jogo: mostra o resultado com "perfil" personalizado
   ------------------------------------------------------------ */
function finalizarQuiz() {
  pararTimer();
  salvarMelhorPontuacao();

  textoPontosFinal.textContent = pontuacao + ' pontos';

  // Calcula um percentual de aproveitamento
  const total = perguntasSorteio.length;
  const maximoPossivel = total * MAXIMO_PONTOS_POR_PERGUNTA;
  const percentual = maximoPossivel > 0 ? (pontuacao / maximoPossivel) * 100 : 0;

  // Escolhe o perfil (emoji + título + frase) conforme o desempenho
  let emoji, titulo, subtitulo;
  if (sequenciaCerta >= 5) {
    emoji = '🐐';
    titulo = 'Você é um Gênio!';
    subtitulo = 'Manteve uma sequência incrível de acertos!';
  } else if (percentual >= 70) {
    emoji = '🏆';
    titulo = 'Excelente!';
    subtitulo = 'Você arrasou neste desafio!';
  } else if (percentual >= 40) {
    emoji = '😎';
    titulo = 'Muito bom!';
    subtitulo = 'Você sabe bastante coisa. Dá para melhorar!';
  } else if (percentual >= 10) {
    emoji = '🙂';
    titulo = 'Nada mal!';
    subtitulo = 'Continue treinando, você vai longe!';
  } else {
    emoji = '🐣';
    titulo = 'Tudo bem!';
    subtitulo = 'Todo mundo começa assim. Tente de novo!';
  }

  emojiResultado.textContent = emoji;
  tituloResultado.textContent = titulo;
  subtituloResultado.textContent = subtitulo;

  mostrarTela(telaResultado);
}

/* ------------------------------------------------------------
   19) Ações: ligar os "ouvintes" (eventos) aos botões
   ------------------------------------------------------------ */
// Botão "Começar!" -> começa o jogo
document.getElementById('botao-comecar').addEventListener('click', comecarQuiz);

// Botão "Jogar novamente" -> volta para a tela inicial
document.getElementById('botao-reiniciar').addEventListener('click', function () {
  mostrarTela(telaInicio);
});

/* ------------------------------------------------------------
   20) Iniciando a página
   ------------------------------------------------------------ */
carregarMelhorPontuacao();     // mostra o recorde salvo
mostrarTela(telaInicio);       // começa na tela inicial