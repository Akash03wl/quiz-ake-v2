-- ============================================================
-- QUIZ AKE - Migração 0002: seed de metadados
-- Conteúdo OBTIDO do frontend (js/data.js), mantido em sincronia.
-- As PERGUNTAS dos quizzes oficiais continuam no navegador;
-- aqui ficam só os metadados p/ listagens, ranking e painel admin.
-- Padrão híbrido acordado na Fase 4.
-- ============================================================

-- ---------- QUIZZES OFICIAIS (montarQuizzes do data.js) ----------
INSERT INTO quizzes (id, titulo, descricao, categoria, dificuldade, emoji, cor, autor, tags, quantidade, duracao, status, destaque, origem) VALUES
('quiz-geral', 'Conhecimentos Gerais', 'O desafio completo do Quiz AKE, com perguntas de todas as áreas.', 'geral', 'medio', '🧠', '#7c6cf0', 'Equipe Quiz AKE', '["gerais","variedades","todas as áreas"]', 71, 852, 'ativo', 1, 'oficial'),

('quiz-ciencia', 'Ciência', 'Quiz oficial de ciência do Quiz AKE. Teste seus conhecimentos!', 'ciencia', 'medio', '🔬', '#35c08a', 'Equipe Quiz AKE', '["Ciência","Médio","quiz oficial"]', 9, 108, 'ativo', 0, 'oficial'),
('quiz-geografia', 'Geografia', 'Quiz oficial de geografia do Quiz AKE. Teste seus conhecimentos!', 'geografia', 'facil', '🗺️', '#2aa1d9', 'Equipe Quiz AKE', '["Geografia","Fácil","quiz oficial"]', 8, 96, 'ativo', 0, 'oficial'),
('quiz-historia', 'História', 'Quiz oficial de história do Quiz AKE. Teste seus conhecimentos!', 'historia', 'medio', '📜', '#e0a33a', 'Equipe Quiz AKE', '["História","Médio","quiz oficial"]', 6, 72, 'ativo', 0, 'oficial'),
('quiz-esportes', 'Esportes', 'Quiz oficial de esportes do Quiz AKE. Teste seus conhecimentos!', 'esportes', 'medio', '⚽', '#e05a4f', 'Equipe Quiz AKE', '["Esportes","Médio","quiz oficial"]', 5, 60, 'ativo', 0, 'oficial'),
('quiz-games', 'Games', 'Quiz oficial de games do Quiz AKE. Teste seus conhecimentos!', 'games', 'medio', '🎮', '#9b6cf0', 'Equipe Quiz AKE', '["Games","Médio","quiz oficial"]', 5, 60, 'ativo', 0, 'oficial'),
('quiz-filmes', 'Filmes e Séries', 'Quiz oficial de filmes e séries do Quiz AKE. Teste seus conhecimentos!', 'filmes', 'facil', '🎬', '#d94b6f', 'Equipe Quiz AKE', '["Filmes e Séries","Fácil","quiz oficial"]', 5, 60, 'ativo', 0, 'oficial'),
('quiz-musica', 'Música', 'Quiz oficial de música do Quiz AKE. Teste seus conhecimentos!', 'musica', 'medio', '🎵', '#e04b9b', 'Equipe Quiz AKE', '["Música","Médio","quiz oficial"]', 5, 60, 'ativo', 0, 'oficial'),
('quiz-tecnologia', 'Tecnologia', 'Quiz oficial de tecnologia do Quiz AKE. Teste seus conhecimentos!', 'tecnologia', 'medio', '💻', '#4aa8ff', 'Equipe Quiz AKE', '["Tecnologia","Médio","quiz oficial"]', 6, 72, 'ativo', 0, 'oficial'),
('quiz-portugues', 'Português', 'Quiz oficial de português do Quiz AKE. Teste seus conhecimentos!', 'portugues', 'medio', '📚', '#d08a3c', 'Equipe Quiz AKE', '["Português","Médio","quiz oficial"]', 5, 60, 'ativo', 0, 'oficial'),
('quiz-matematica', 'Matemática', 'Quiz oficial de matemática do Quiz AKE. Teste seus conhecimentos!', 'matematica', 'medio', '➗', '#8fa83c', 'Equipe Quiz AKE', '["Matemática","Médio","quiz oficial"]', 6, 72, 'ativo', 0, 'oficial'),
('quiz-brasil', 'Brasil', 'Quiz oficial de brasil do Quiz AKE. Teste seus conhecimentos!', 'brasil', 'medio', '🇧🇷', '#2fc05f', 'Equipe Quiz AKE', '["Brasil","Médio","quiz oficial"]', 6, 72, 'ativo', 0, 'oficial'),
('quiz-logica', 'Lógica', 'Quiz oficial de lógica do Quiz AKE. Teste seus conhecimentos!', 'logica', 'medio', '🧩', '#6366f1', 'Equipe Quiz AKE', '["Lógica","Médio","quiz oficial"]', 5, 60, 'ativo', 0, 'oficial'),

('quiz-dif-facil', 'Desafio Fácil', 'Um quiz-chegada com perguntas fáceis de todas as categorias.', 'geral', 'facil', '🟢', '#ffffff', 'Equipe Quiz AKE', '["Fácil","desafio","misturado"]', 35, 420, 'ativo', 0, 'oficial'),
('quiz-dif-medio', 'Desafio Médio', 'Um quiz-chegada com perguntas médias de todas as categorias.', 'geral', 'medio', '🟡', '#ffffff', 'Equipe Quiz AKE', '["Médio","desafio","misturado"]', 33, 396, 'ativo', 0, 'oficial');

-- ---------- CATÁLOGO DE CONQUISTAS (espelha CONQUISTAS_DEF do data.js) ----------
INSERT INTO conquistas (id, icone, nome, desc, tipo, alvo) VALUES
('primeiro', '🎯', 'Primeiro Passo', 'Complete seu primeiro quiz.', 'jogos', 1),
('emchamas', '🔥', 'Em Chamas', 'Acerte 10 perguntas seguidas.', 'maiorCombo', 10),
('velocista', '⚡', 'Velocista', 'Responda rápido uma pergunta.', 'rapidas', 1),
('genio', '🧠', 'Gênio', 'Consiga 100% em um quiz.', 'perfeitos', 1),
('estudioso', '📚', 'Estudioso', 'Complete 50 quizzes.', 'jogos', 50),
('mestre', '👑', 'Mestre', 'Alcance o nível 5.', 'nivel', 5),
('pontos100', '💯', 'Centenário', 'Faça 100 pontos em uma partida.', 'pontos', 100),
('recordista', '🏅', 'Recordista', 'Bata seu próprio recorde.', 'recorde', 1),
('desafiante', '🗓️', 'Desafiante', 'Complete o Desafio do Dia.', 'desafios', 1),
('streak3', '🔥', 'Constância', 'Jogue 3 dias seguidos.', 'streak', 3),
('cincoJogos', '🎮', 'Veterano', 'Jogue pelo menos 5 partidas.', 'jogos', 5),
('sobrevivente', '💪', 'Duro de Matar', 'Acerte 10 perguntas seguidas em Sobrevivência.', 'sobSeq', 10),
('blitz100', '⚡', 'Relâmpago', 'Faça 100 pontos em uma partida Blitz.', 'blitzPontos', 100),
('contraTempo300', '⏱️', 'Contra o Relógio', 'Faça 300 pontos em Contra o Tempo.', 'contraPontos', 300),
('cincoModos', '🎲', 'Completo', 'Jogue nos 3 modos especiais.', 'modosJogados', 3);