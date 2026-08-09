/* ==========================================================
   QUIZ AKE - CAMADA DE DADOS (data.js)
   Arquivo separado de dados, organizado para migração futura
   para um backend. Contém: categorias, dificuldades, tipos de
   pergunta, banco de perguntas, quizzes e conquistas.
   ========================================================== */

/* ----------------------------------------------------------
   1) CATEGORIAS
   ---------------------------------------------------------- */
const CATEGORIAS = [
  { id: 'geral',      nome: 'Conhecimentos Gerais', emoji: '🧠', cor: '#7c6cf0' },
  { id: 'historia',   nome: 'História',             emoji: '📜', cor: '#e0a33a' },
  { id: 'geografia',  nome: 'Geografia',            emoji: '🌎', cor: '#2aa1d9' },
  { id: 'ciencia',    nome: 'Ciência',              emoji: '🔬', cor: '#35c08a' },
  { id: 'tecnologia', nome: 'Tecnologia',           emoji: '💻', cor: '#4aa8ff' },
  { id: 'games',      nome: 'Games',                emoji: '🎮', cor: '#9b6cf0' },
  { id: 'filmes',     nome: 'Filmes e Séries',      emoji: '🎬', cor: '#d94b6f' },
  { id: 'musica',     nome: 'Música',               emoji: '🎵', cor: '#e04b9b' },
  { id: 'esportes',   nome: 'Esportes',             emoji: '⚽', cor: '#e05a4f' },
  { id: 'matematica', nome: 'Matemática',           emoji: '➗', cor: '#8fa83c' },
  { id: 'portugues',  nome: 'Português',            emoji: '📚', cor: '#d08a3c' },
  { id: 'brasil',     nome: 'Brasil',               emoji: '🇧🇷', cor: '#2fc05f' },
  { id: 'logica',     nome: 'Lógica',               emoji: '🧩', cor: '#6366f1' }
];

/* ----------------------------------------------------------
   2) NÍVEIS DE DIFICULDADE
   ---------------------------------------------------------- */
const DIFICULDADES = [
  { id: 'facil',   nome: 'Fácil',    icone: '🟢', ordem: 0 },
  { id: 'medio',   nome: 'Médio',    icone: '🟡', ordem: 1 },
  { id: 'dificil', nome: 'Difícil',  icone: '🟠', ordem: 2 },
  { id: 'insano',  nome: 'Insano',   icone: '🔴', ordem: 3 }
];

function buscarDif(id) {
  const d = DIFICULDADES.find(function (e) { return e.id === id; });
  return d || DIFICULDADES[0];
}

/* ----------------------------------------------------------
   3) TIPOS DE PERGUNTA
   multipla = múltipla escolha (implementado)
   vf       = verdadeiro ou falso (implementado)
   Os demais estão preparados para futuras expansões.
   ---------------------------------------------------------- */
const TIPOS_PERGUNTA = [
  { id: 'multipla',    nome: 'Múltipla escolha',    implementado: true },
  { id: 'vf',          nome: 'Verdadeiro ou Falso', implementado: true },
  { id: 'imagem',      nome: 'Imagem',              implementado: false },
  { id: 'digitada',    nome: 'Resposta digitada',   implementado: false },
  { id: 'ordenacao',   nome: 'Ordenação',           implementado: false },
  { id: 'associacao',  nome: 'Associação',          implementado: false }
];

function buscarTipo(id) {
  const t = TIPOS_PERGUNTA.find(function (e) { return e.id === id; });
  return t || TIPOS_PERGUNTA[0];
}

/* ==========================================================
   4) BANCO DE PERGUNTAS
   Cada pergunta suporta:
   - tipo          : multipla ou vf (outros preparados para expansão)
   - dificuldade   : facil | medio | dificil | insano
   - categoria     : id da categoria
   - pergunta      : texto da pergunta
   - alternativas  : opções de resposta
   - correta       : índice da resposta certa
   - explicacao    : texto educativo exibido após responder
   - valor         : peso de pontos (1 normal, 2/3 prêmio)
   Obs.: perguntas antigas sem 'tipo' são tratadas como múltipla escolha.
   ========================================================== */
const PERGUNTAS = [
  /* ============ CIÊNCIA ============ */
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'ciencia', pergunta: "Qual é o maior planeta do Sistema Solar?", alternativas: ["Terra", "Júpiter", "Saturno", "Marte"], correta: 1, valor: 1, explicacao: "Júpiter é o maior planeta, com mais de 2,5x a massa de todos os outros juntos." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'ciencia', pergunta: "Qual é o símbolo químico do ouro?", alternativas: ["Au", "Ag", "Fe", "O"], correta: 0, valor: 1, explicacao: "Au vem do latim 'aurum'. Ag é prata, Fe é ferro e O é oxigênio." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'ciencia', pergunta: "Qual gás os seres humanos respiram para sobreviver?", alternativas: ["Oxigênio", "Hidrogênio", "Gás carbônico", "Hélio"], correta: 0, valor: 1, explicacao: "O oxigênio (O2) é absorvido pelos pulmões e usado pelas células para produzir energia." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'ciencia', pergunta: "Qual destes animais é um mamífero?", alternativas: ["Tubarão", "Golfinho", "Polvo", "Tartaruga"], correta: 1, valor: 2, explicacao: "O golfinho é mamífero: respira ar, tem sangue quente e amamenta os filhotes." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'ciencia', pergunta: "Quantos ossos tem (aprox.) o corpo humano adulto?", alternativas: ["106", "206", "306", "406"], correta: 1, valor: 1, explicacao: "Um adulto tem em média 206 ossos; bebês nascem com cerca de 300." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'ciencia', pergunta: "O que a fotossíntese produz nas plantas?", alternativas: ["Oxigênio", "Carbono", "Nitrogênio", "Hidrogênio"], correta: 0, valor: 1, explicacao: "Na fotossíntese, a planta usa luz e CO2 e libera oxigênio." },
  { tipo: 'multipla', dificuldade: 'dificil', categoria: 'ciencia', pergunta: "Quantos estados físicos básicos da matéria existem?", alternativas: ["2", "3", "4", "5"], correta: 1, valor: 3, explicacao: "São 3 clássicos: sólido, líquido e gasoso. Física moderna discute outros estados." },
  { tipo: 'vf',       dificuldade: 'facil',   categoria: 'ciencia', pergunta: "A água ferve a 100°C ao nível do mar.", alternativas: ["Verdadeiro", "Falso"], correta: 0, valor: 1, explicacao: "Ao nível do mar a água ferve a 100°C; em altitudes maiores ferve antes." },
  { tipo: 'vf',       dificuldade: 'medio',   categoria: 'ciencia', pergunta: "Os seres humanos têm dois corações.", alternativas: ["Verdadeiro", "Falso"], correta: 1, valor: 1, explicacao: "Temos um coração com quatro câmaras. O polvo é que tem três corações." },

  /* ============ GEOGRAFIA ============ */
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'geografia', pergunta: "Qual é o maior oceano do mundo?", alternativas: ["Atlântico", "Índico", "Pacífico", "Ártico"], correta: 2, valor: 1, explicacao: "O Pacífico cobre cerca de 1/3 da superfície da Terra." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'geografia', pergunta: "Qual é a capital da França?", alternativas: ["Londres", "Paris", "Roma", "Berlim"], correta: 1, valor: 1, explicacao: "Paris é a capital da França, banhada pelo rio Sena." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'geografia', pergunta: "Qual é o maior país do mundo em território?", alternativas: ["China", "EUA", "Brasil", "Rússia"], correta: 3, valor: 1, explicacao: "A Rússia é o maior país, com mais de 17 milhões de km²." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'geografia', pergunta: "Quantos continentes existem no planeta?", alternativas: ["5", "6", "7", "8"], correta: 2, valor: 1, explicacao: "Modelo mais usado: 7 continentes. Alguns contam 6 (América única)." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'geografia', pergunta: "Em que continente fica o Egito?", alternativas: ["Ásia", "África", "Europa", "América"], correta: 1, valor: 1, explicacao: "O Egito fica no nordeste da África, ligado à Ásia pelo Sinai." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'geografia', pergunta: "Qual é o maior deserto (não polar) do mundo?", alternativas: ["Saara", "Gobi", "Kalahari", "Atacama"], correta: 0, valor: 2, explicacao: "O Saara, no norte da África, é o maior deserto quente do planeta." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'geografia', pergunta: "Qual planeta é chamado de 'Planeta Vermelho'?", alternativas: ["Vênus", "Marte", "Mercúrio", "Netuno"], correta: 1, valor: 1, explicacao: "Marte tem coloração avermelhada por causa do óxido de ferro no solo." },
  { tipo: 'vf',       dificuldade: 'medio',   categoria: 'geografia', pergunta: "O rio Amazonas nasce no Brasil.", alternativas: ["Verdadeiro", "Falso"], correta: 1, valor: 1, explicacao: "O Amazonas nasce nos Andes peruanos e segue pela floresta brasileira até o Atlântico." },

  /* ============ HISTÓRIA ============ */
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'historia', pergunta: "Quando o homem pisou na Lua pela primeira vez?", alternativas: ["1965", "1969", "1972", "1979"], correta: 1, valor: 2, explicacao: "Em 20 de julho de 1969 a Apollo 11 chegou à Lua com Neil Armstrong." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'historia', pergunta: "Em qual ano o Brasil comemorou 500 anos de descobrimento?", alternativas: ["1998", "2000", "2002", "2005"], correta: 1, valor: 3, explicacao: "O descobrimento foi em 1500, então os 500 anos foram comemorados em 2000." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'historia', pergunta: "Quem pintou a Mona Lisa?", alternativas: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo"], correta: 2, valor: 2, explicacao: "A Mona Lisa foi pintada por Leonardo da Vinci no início do século XVI." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'historia', pergunta: "Qual país conquistou a primeira Copa do Mundo de futebol?", alternativas: ["Brasil", "Itália", "Uruguai", "Argentina"], correta: 2, valor: 1, explicacao: "O Uruguai venceu a primeira Copa do Mundo, em 1930, jogando em casa." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'historia', pergunta: "Em que década caiu o Muro de Berlim?", alternativas: ["1960", "1970", "1980", "1990"], correta: 2, valor: 1, explicacao: "O Muro de Berlim caiu em 1989, no fim da década de 1980." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'historia', pergunta: "Quem descobriu/começou a colonização do Brasil em 1500?", alternativas: ["Pedro Álvares Cabral", "Cristóvão Colombo", "Américo Vespúcio", "Vasco da Gama"], correta: 0, valor: 1, explicacao: "Pedro Álvares Cabral liderou a esquadra que chegou ao Brasil em abril de 1500." },

  /* ============ ESPORTES ============ */
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'esportes', pergunta: "Quantos jogadores compõem um time de futebol em campo?", alternativas: ["9", "10", "11", "12"], correta: 2, valor: 1, explicacao: "Cada time entra com 11 jogadores em campo, incluindo o goleiro." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'esportes', pergunta: "Em que país surgiram as Olimpíadas da era moderna?", alternativas: ["França", "Grécia", "Itália", "EUA"], correta: 1, valor: 2, explicacao: "O primeiro Jogos Olímpicos moderno aconteceu em Atenas, Grécia, em 1896." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'esportes', pergunta: "Qual piloto tem mais títulos de Fórmula 1?", alternativas: ["Schumacher", "Hamilton", "Senna", "Verstappen"], correta: 1, valor: 3, explicacao: "Lewis Hamilton tem 7 títulos, empatado com Michael Schumacher." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'esportes', pergunta: "Quantos pontos vale uma cesta comum no basquete?", alternativas: ["1", "2", "3", "4"], correta: 1, valor: 1, explicacao: "Uma cesta da quadra vale 2 pontos (lance livre vale 1, além do arco vale 3)." },
  { tipo: 'vf',       dificuldade: 'medio',   categoria: 'esportes', pergunta: "O tênis de mesa é conhecido como pingue-pongue.", alternativas: ["Verdadeiro", "Falso"], correta: 0, valor: 1, explicacao: "Ping-pong é o nome popular do tênis de mesa, esporte de raquete e bolinha leve." },

  /* ============ GAMES ============ */
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'games', pergunta: "Quem é o criador do Super Mario?", alternativas: ["Shigeru Miyamoto", "Hideo Kojima", "Gabe Newell", "John Carmack"], correta: 0, valor: 2, explicacao: "Shigeru Miyamoto, da Nintendo, criou Mario, Zelda e Donkey Kong." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'games', pergunta: "Qual jogo é famoso por construir com blocos?", alternativas: ["Tetris", "Pac-Man", "Minecraft", "Angry Birds"], correta: 2, valor: 1, explicacao: "Minecraft é o sandbox de construção por blocos mais vendido do mundo." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'games', pergunta: "Qual é o protagonista do Resident Evil 1?", alternativas: ["Chris Redfield", "Jill Valentine", "Albert Wesker", "Barry Burton"], correta: 0, valor: 3, explicacao: "No RE1 você pode escolher jogar com Chris ou Jill; Chris é o protagonista padrão." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'games', pergunta: "Quem é o mascote da Nintendo?", alternativas: ["Sonic", "Mario", "Crash", "Knuckles"], correta: 1, valor: 1, explicacao: "Mario (ou seu atum 'Jumpman') é o mascote da Nintendo." },
  { tipo: 'vf',       dificuldade: 'medio',   categoria: 'games', pergunta: "Pac-Man foi criado no Japão.", alternativas: ["Verdadeiro", "Falso"], correta: 0, valor: 1, explicacao: "Pac-Man foi criado em 1980 por Toru Iwatani, na empresa japonesa Namco." },

  /* ============ FILMES E SÉRIES ============ */
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'filmes', pergunta: "Qual saga de filmes tem o personagem Darth Vader?", alternativas: ["Senhor dos Anéis", "Star Wars", "Harry Potter", "Jurassic Park"], correta: 1, valor: 1, explicacao: "Darth Vader é o vilão icônico da saga Star Wars." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'filmes', pergunta: "Quem interpretou Tony Stark no cinema?", alternativas: ["Chris Evans", "Robert Downey Jr.", "Chris Hemsworth", "Scarlett Johansson"], correta: 1, valor: 2, explicacao: "Robert Downey Jr. deu vida ao Homem de Ferro a partir de 2008." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'filmes', pergunta: "Qual filme tem a frase 'Que a força esteja com você'?", alternativas: ["Star Trek", "Star Wars", "Matrix", "Guardiões da Galáxia"], correta: 1, valor: 1, explicacao: "'Que a força esteja com você' é a frase clássica de Star Wars." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'filmes', pergunta: "Qual deixa é a casa do Mickey Mouse?", alternativas: ["Nova York", "Orlando", "São Paulo", "Bahia"], correta: 1, valor: 2, explicacao: "O personagem da Disney habita a Disney World, em Orlando, Flórida." },
  { tipo: 'vf',       dificuldade: 'medio',   categoria: 'filmes', pergunta: "O filme 'Titanic' foi lançado no ano 2000.", alternativas: ["Verdadeiro", "Falso"], correta: 1, valor: 1, explicacao: "Titanic estreou em 1997 e ganhou 11 Oscars." },

  /* ============ MÚSICA ============ */
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'musica', pergunta: "Qual artista é conhecido como o 'Rei do Pop'?", alternativas: ["Elvis Presley", "Freddie Mercury", "Michael Jackson", "Bob Dylan"], correta: 2, valor: 1, explicacao: "Michael Jackson é mundialmente conhecido como o Rei do Pop." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'musica', pergunta: "Qual é a nacionalidade do compositor Ludwig van Beethoven?", alternativas: ["Francês", "Alemão", "Italiano", "Austríaco"], correta: 1, valor: 1, explicacao: "Beethoven nasceu em Aron, na atual Alemanha." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'musica', pergunta: "Quantas cordas tem um violão comum?", alternativas: ["4", "5", "6", "7"], correta: 2, valor: 1, explicacao: "O violão padrão tem 6 cordas (mi, lá, ré, sol, si, mi)." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'musica', pergunta: "Qual banda gravou o álbum 'The Dark Side of the Moon'?", alternativas: ["The Beatles", "Pink Floyd", "Queen", "Led Zeppelin"], correta: 1, valor: 3, explicacao: "Pink Floyd lançou 'The Dark Side of the Moon' em 1973, álbum super vendido." },
  { tipo: 'vf',       dificuldade: 'medio',   categoria: 'musica', pergunta: "A escala musical padrão tem 7 notas naturais.", alternativas: ["Verdadeiro", "Falso"], correta: 0, valor: 1, explicacao: "Dó, ré, mi, fá, sol, lá e si: sete notas naturais." },

  /* ============ TECNOLOGIA ============ */
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'tecnologia', pergunta: "Qual destes é um navegador de internet?", alternativas: ["Photoshop", "Chrome", "Windows", "Word"], correta: 1, valor: 1, explicacao: "Google Chrome é um navegador. Photoshop é editor de imagens, Windows é sistema e Word é editor de texto." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'tecnologia', pergunta: "O que significa a sigla HTML?", alternativas: ["Hiper Texto de Marcas", "Linguagem de Marcação de Hipertexto", "Linguagem de Máquina Total", "Hora de Melhorar os Textos"], correta: 1, valor: 3, explicacao: "HTML = HyperText Markup Language, a linguagem que estrutura as páginas web." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'tecnologia', pergunta: "Qual destes é um sistema operacional?", alternativas: ["Linux", "Intel", "NVIDIA", "RAM"], correta: 0, valor: 2, explicacao: "Linux é um sistema operacional. Os outros itens são componentes de hardware." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'tecnologia', pergunta: "A ‘CPU’ de um computador é o(a):", alternativas: ["Memória permanente", "Unidade de processamento central", "Placa de vídeo", "Disco rígido"], correta: 1, valor: 1, explicacao: "CPU (Central Processing Unit) é o 'cérebro' que executa as instruções." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'tecnologia', pergunta: "Qual empresa criou o iPhone?", alternativas: ["Google", "Microsoft", "Apple", "Samsung"], correta: 2, valor: 1, explicacao: "O iPhone foi lançado pela Apple em 2007." },
  { tipo: 'multipla', dificuldade: 'dificil', categoria: 'tecnologia', pergunta: "Qual protocolo é seguro para acessar sites?", alternativas: ["FTP", "HTTP", "HTTPS", "SMTP"], correta: 2, valor: 2, explicacao: "HTTPS adiciona criptografia (SSL/TLS) ao HTTP, protegendo os dados da conexão." },

  /* ============ PORTUGUÊS ============ */
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'portugues', pergunta: "Qual é o plural de 'pão'?", alternativas: ["pãos", "pães", "painçes", "pãis"], correta: 1, valor: 1, explicacao: "A maioria das palavras terminadas em ão faz plural em ões, mas 'pão' faz 'pães'." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'portugues', pergunta: "Qual é a forma correta: 'eles ...'?", alternativas: ["fizero", "fizeram", "fazem", "fez"], correta: 1, valor: 2, explicacao: "'Eles fizeram' é a forma correta no pretérito perfeito." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'portugues', pergunta: "Quantas letras tem a palavra 'paralelepípedo'?", alternativas: ["11", "12", "13", "14"], correta: 2, valor: 1, explicacao: "Paralelepípedo tem 12 letras." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'portugues', pergunta: "Qual destas palavras é um substantivo?", alternativas: ["Bonito", "Coragem", "Rapidamente", "Cantando"], correta: 1, valor: 1, explicacao: "'Coragem' é substantivo; 'bonito' é adjetivo, 'rapidamente' é advérbio e 'cantando' é verbo no gerúndio." },
  { tipo: 'vf',       dificuldade: 'medio',   categoria: 'portugues', pergunta: "'Aonde' é usado para indicar movimento com verbos de lugar.", alternativas: ["Verdadeiro", "Falso"], correta: 0, valor: 1, explicacao: "'Aonde' indica movimento (ex.: aonde você vai) e 'onde' indica permanência." },

  /* ============ MATEMÁTICA ============ */
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'matematica', pergunta: "Quantos lados tem um hexágono?", alternativas: ["4", "5", "6", "7"], correta: 2, valor: 1, explicacao: "Hexágono = hex (seis) + gono (ângulo): seis lados." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'matematica', pergunta: "Qual é o resultado de 7 x 8?", alternativas: ["48", "54", "56", "64"], correta: 2, valor: 1, explicacao: "7 x 8 = 56." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'matematica', pergunta: "Qual é o único número primo par?", alternativas: ["0", "1", "2", "4"], correta: 2, valor: 2, explicacao: "O único primo par é o 2; todo outro par é divisível por 2." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'matematica', pergunta: "Quanto é a raiz quadrada de 144?", alternativas: ["10", "11", "12", "14"], correta: 2, valor: 1, explicacao: "12 x 12 = 144, logo a raiz de 144 é 12." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'matematica', pergunta: "Quantos graus tem um círculo completo?", alternativas: ["180", "270", "360", "90"], correta: 2, valor: 1, explicacao: "Um círculo completo tem 360 graus." },
  { tipo: 'vf',       dificuldade: 'facil',   categoria: 'matematica', pergunta: "Todo número que termina em 0 ou 5 é divisível por 5.", alternativas: ["Verdadeiro", "Falso"], correta: 0, valor: 1, explicacao: "Critério de divisibilidade por 5: o último algarismo deve ser 0 ou 5." },

  /* ============ BRASIL ============ */
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'brasil', pergunta: "Qual é a capital do Brasil?", alternativas: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"], correta: 2, valor: 1, explicacao: "Brasília é a capital federal desde 1960." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'brasil', pergunta: "Quem foi o primeiro presidente do Brasil?", alternativas: ["Deodoro da Fonseca", "Getúlio Vargas", "Juscelino Kubitschek", "Washington Luís"], correta: 0, valor: 1, explicacao: "Deodoro da Fonseca assumiu após a Proclamação da República, em 1889." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'brasil', pergunta: "Qual foi a primeira capital do Brasil?", alternativas: ["Salvador", "Rio de Janeiro", "Recife", "São Paulo"], correta: 0, valor: 2, explicacao: "O Brasil e Salvador, capital de 1549 a 1763." },
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'brasil', pergunta: "Qual é o idioma oficial do Brasil?", alternativas: ["Espanhol", "Português", "Inglês", "Tupi-guarani"], correta: 1, valor: 1, explicacao: "O português é o idioma oficial do Brasil." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'brasil', pergunta: "Qual é a moeda oficial do Brasil?", alternativas: ["Peso", "Real", "Dólar Brasileiro", "Cruzeiro: moeda atual"], correta: 1, valor: 1, explicacao: "O professor de moeda atual é o Real, vigente desde 1994." },
  { tipo: 'vf',       dificuldade: 'medio',   categoria: 'brasil', pergunta: "A Amazônia fica inteiramente em território brasileiro.", alternativas: ["Verdadeiro", "Falso"], correta: 1, valor: 2, explicacao: "A Amazônia se estende também por Peru, Colômbia, Venezuela, Bolívia e outros países." },

  /* ============ LÓGICA ============ */
  { tipo: 'multipla', dificuldade: 'facil',   categoria: 'logica', pergunta: "Qual número completa a sequência: 2, 4, 6, ...?", alternativas: ["7", "8", "9", "10"], correta: 1, valor: 1, explicacao: "A sequência soma 2 a cada termo: 2, 4, 6, 8." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'logica', pergunta: "Se A > B e B > C, então:", alternativas: ["A < C", "A > C", "A = C", "É impossível saber"], correta: 1, valor: 2, explicacao: "Pela transitividade, se A > B e B > C, então A > C." },
  { tipo: 'multipla', dificuldade: 'medio',   categoria: 'logica', pergunta: "Quantas pernas têm 2 cachorros e 3 gatos?", alternativas: ["16", "18", "20", "24"], correta: 2, valor: 3, explicacao: "5 animais x 4 pernas = 20 pernas." },
  { tipo: 'multipla', dificuldade: 'dificil', categoria: 'logica', pergunta: "Se todas as rosas são flores e todas as flores são seres vivos, concluímos que:", alternativas: ["Todas as rosas são seres vivos", "Todas as flores são rosas", "Nenhuma rosa é ser vivo", "Rosa não é flor"], correta: 0, valor: 2, explicacao: "Rosa ⊂ Flor ⊂ Ser vivo, portanto todas as rosas são seres vivos." },
  { tipo: 'vf',       dificuldade: 'medio',   categoria: 'logica', pergunta: "2 é par e 2 é primo.", alternativas: ["Verdadeiro", "Falso"], correta: 0, valor: 1, explicacao: "2 é par e é o único número primo par." }
];

/* Compatibilidade: mantém a referência antiga funcionando com a Fase 1 */
const BANCO_DE_PERGUNTAS = PERGUNTAS;

/* ============================================================
   5) GERAÇÃO DINÂMICA DOS QUIZZES
   Cada quiz tem: titulo, descricao, capa(emoji+cor), categoria,
   dificuldade, quantidade de perguntas, duração, autor, data de
   criação, tags e status.
   - categoria 'geral' = mistura de todas as categorias
   - filtro.dificuldade opcional restringe por dificuldade
   ============================================================ */
const TEMPO_RELAMPAGO = 12;   // segundos estimados por pergunta

/* Retorna as perguntas de um quiz, respeitando categoria e filtros */
function perguntasDoQuiz(quiz) {
  let base;
  if (!quiz.filtro || !quiz.filtro.dificuldade || quiz.categoria === 'geral') {
    base = PERGUNTAS.slice();
  } else {
    base = PERGUNTAS.filter(function (p) { return p.categoria === quiz.categoria; });
  }
  if (quiz.filtro && quiz.filtro.dificuldade) {
    base = base.filter(function (p) { return p.dificuldade === quiz.filtro.dificuldade; });
  }
  return base;
}

/* Calcula a dificuldade média das perguntas de uma categoria */
function cristalizarDificuldade(categoriaId) {
  const perg = PERGUNTAS.filter(function (p) { return p.categoria === categoriaId; });
  if (perg.length === 0) return DIFICULDADES[0];
  const pesos = { facil: 0, medio: 1, dificil: 2, insano: 3 };
  let soma = 0;
  perg.forEach(function (p) {
    soma += pesos[p.dificuldade] !== undefined ? pesos[p.dificuldade] : 1;
  });
  const media = soma / perg.length;
  return DIFICULDADES[Math.min(3, Math.round(media))];
}

function montarQuizzes() {
  const lista = [];

  // Quiz geral: mistura de todas as categorias
  lista.push({
    id: 'quiz-geral',
    titulo: 'Conhecimentos Gerais',
    descricao: 'O desafio completo do Quiz AKE, com perguntas de todas as áreas.',
    capa: { emoji: '🧠', cor: '#7c6cf0' },
    categoria: 'geral',
    dificuldade: 'medio',
    quantidade: PERGUNTAS.length,
    duracao: Math.max(60, PERGUNTAS.length * TEMPO_RELAMPAGO),
    autor: 'Equipe Quiz AKE',
    dataCriacao: '2026-01-01',
    tags: ['gerais', 'variedades', 'todas as áreas'],
    status: 'ativo',
    filtro: null
  });

  // Um quiz por categoria
  CATEGORIAS.forEach(function (cat) {
    if (cat.id === 'geral') return;
    const perguntas = PERGUNTAS.filter(function (p) { return p.categoria === cat.id; });
    if (perguntas.length === 0) return;
    const dif = cristalizarDificuldade(cat.id);
    lista.push({
      id: 'quiz-' + cat.id,
      titulo: cat.nome,
      descricao: 'Quiz oficial de ' + cat.nome.toLowerCase() + ' do Quiz AKE. Teste seus conhecimentos!',
      capa: { emoji: cat.emoji, cor: cat.cor },
      categoria: cat.id,
      dificuldade: dif.id,
      quantidade: perguntas.length,
      duracao: Math.max(60, perguntas.length * TEMPO_RELAMPAGO),
      autor: 'Equipe Quiz AKE',
      dataCriacao: '2026-01-01',
      tags: [cat.nome, dif.nome, 'quiz oficial'],
      status: 'ativo',
      filtro: null
    });
  });

  // Quizzes por dificuldade (mistura todas as áreas) quando houver perguntas suficientes
  DIFICULDADES.forEach(function (dif) {
    const perguntas = PERGUNTAS.filter(function (p) { return p.dificuldade === dif.id; });
    if (perguntas.length < 4) return;
    lista.push({
      id: 'quiz-dif-' + dif.id,
      titulo: 'Desafio ' + dif.nome,
      descricao: 'Um quiz-chegada com perguntas ' + dif.nome.toLowerCase() + ' de todas as categorias.',
      capa: { emoji: dif.icone, cor: '#ffffff' },
      categoria: 'geral',
      dificuldade: dif.id,
      quantidade: perguntas.length,
      duracao: Math.max(60, perguntas.length * TEMPO_RELAMPAGO),
      autor: 'Equipe Quiz AKE',
      dataCriacao: '2026-01-01',
      tags: [dif.nome, 'desafio', 'misturado'],
      status: 'ativo',
      filtro: { dificuldade: dif.id }
    });
  });

  return lista;
}

/* Lista os quizzes disponíveis */
const QUIZZES = montarQuizzes();

function buscarQuiz(id) {
  return QUIZZES.find(function (q) { return q.id === id; }) || null;
}

function buscarCategoria(id) {
  return CATEGORIAS.find(function (c) { return c.id === id; }) || null;
}

/* ==========================================================
   7) CONQUISTAS (com progresso real)
   ========================================================== */
const CONQUISTAS_DEF = [
  { id: 'primeiro',    icone: '🏆', nome: 'Primeiro Passo',           desc: 'Complete seu primeiro quiz.',         tipo: 'jogos',      alvo: 1 },
  { id: 'emchamas',    icone: '🔥', nome: 'Em Chamas',                desc: 'Acerte 10 perguntas seguidas.',       tipo: 'maiorCombo', alvo: 10 },
  { id: 'velocista',   icone: '⚡', nome: 'Velocista',                desc: 'Responda rápido uma pergunta.',       tipo: 'rapidas',    alvo: 1 },
  { id: 'genio',       icone: '🧠', nome: 'Gênio',                    desc: 'Consiga 100% em um quiz.',            tipo: 'perfeitos',  alvo: 1 },
  { id: 'estudioso',   icone: '📚', nome: 'Estudioso',                desc: 'Complete 50 quizzes.',                tipo: 'jogos',      alvo: 50 },
  { id: 'mestre',      icone: '👑', nome: 'Mestre',                   desc: 'Alcance o nível 5.',                 tipo: 'nivel',      alvo: 5 },
  { id: 'pontos100',   icone: '💯', nome: 'Centenário',               desc: 'Faça 100 pontos em uma partida.',    tipo: 'pontos',     alvo: 100 },
  { id: 'recordista',  icone: '🏅', nome: 'Recordista',               desc: 'Bata seu próprio recorde.',          tipo: 'recorde',    alvo: 1 },
  { id: 'desafiante',  icone: '🎯', nome: 'Desafiante',               desc: 'Complete o Desafio do Dia.',         tipo: 'desafios',   alvo: 1 },
  { id: 'streak3',     icone: '📅', nome: 'Constância',               desc: 'Jogue 3 dias seguidos.',              tipo: 'streak',     alvo: 3 },
  { id: 'cincoJogos',  icone: '🎮', nome: 'Veterano',                 desc: 'Jogue pelo menos 5 partidas.',       tipo: 'jogos',      alvo: 5 },
  /* Fase 3 - competição */
  { id: 'sobrevivente',  icone: '⚔️', nome: 'Duro de Matar',   desc: 'Acerte 10 perguntas seguidas em Sobrevivência.', tipo: 'sobSeq',       alvo: 10 },
  { id: 'blitz100',      icone: '⚡', nome: 'Relâmpago',        desc: 'Faça 100 pontos em uma partida Blitz.',        tipo: 'blitzPontos',   alvo: 100 },
  { id: 'contraTempo300',icone: '⏰', nome: 'Contra o Relógio', desc: 'Faça 300 pontos em Contra o Tempo.',           tipo: 'contraPontos',  alvo: 300 },
  { id: 'cincoModos',    icone: '🎯', nome: 'Completo',         desc: 'Jogue nos 3 modos especiais.',                tipo: 'modosJogados',  alvo: 3 }
];

/* ==========================================================
   8) MODOS ESPECIAIS (Fase 3)
   Cada modo altera as regras de tempo e de fim da partida.
   ========================================================== */
const MODOS = [
  {
    id: 'sobrevivencia',
    icone: '⚔️',
    nome: 'Sobrevivência',
    cor: '#ff5b6a',
    desc: 'Perguntas infinitas com dificuldade crescente. Um erro e a partida acaba.',
    regra: 'Errou, acabou.'
  },
  {
    id: 'blitz',
    icone: '⚡',
    nome: 'Blitz',
    cor: '#ffb020',
    desc: 'Tempo curtíssimo por pergunta. Quanto mais rápido, mais pontos.',
    regra: 'Velocidade vale pontos.'
  },
  {
    id: 'contra-tempo',
    icone: '⏰',
    nome: 'Contra o Tempo',
    cor: '#2aa1d9',
    desc: 'O relógio nunca para. Acertos aumentam seu tempo, erros o drenam.',
    regra: 'Tempo drenante.'
  }
];

function buscarModo(id) {
  return MODOS.find(function (m) { return m.id === id; }) || null;
}