-- Sementes iniciais para a Biblioteca de Atividades
INSERT INTO activity_materials (title, description, type, grade, subject, content, thumbnail_url, is_public, created_at)
VALUES 
(
  'Livro de Colorir: Animais da Floresta',
  'Um caderno com ilustrações fofas de animais silvestres, ideal para desenvolver a coordenação motora e associação de letras na educação infantil.',
  'COLORING_BOOK',
  'Educação Infantil',
  'Artes',
  '{"paginas": [{"numero": 1, "titulo_pagina": "O Urso Feliz", "descricao_desenho": "Um urso grande e amigável sentado na grama segurando um pote de mel e sorrindo.", "texto_apoio": "U de Urso"}, {"numero": 2, "titulo_pagina": "A Raposa Curiosa", "descricao_desenho": "Uma pequena raposa de cauda felpuda espiando por trás de um arbusto com flores.", "texto_apoio": "R de Raposa"}, {"numero": 3, "titulo_pagina": "O Esquilo Saltitante", "descricao_desenho": "Um esquilo fofo no galho de uma árvore segurando uma noz com as duas patinhas.", "texto_apoio": "E de Esquilo"}]}',
  '/images/thumbnails/coloring_forest.jpg',
  TRUE,
  NOW()
),
(
  'Contando Frutas - Matemática Infantil',
  'Ficha de exercícios práticos com ilustrações de contagem básica e somas simples de 1 a 10.',
  'WORKSHEET',
  '1º Ano',
  'Matemática',
  '{"exercicios": [{"numero": 1, "enunciado": "Quantas maçãs você vê na imagem? Conte e escreva o número correspondente.", "tipo": "resposta_escrita", "opcoes": [], "gabarito": "5"}, {"numero": 2, "enunciado": "Se você tem 3 bananas e ganha mais 2, com quantas bananas você fica?", "tipo": "multipla_escolha", "opcoes": ["3 bananas", "4 bananas", "5 bananas", "6 bananas"], "gabarito": "5 bananas"}, {"numero": 3, "enunciado": "Desenhe 4 laranjas no cesto abaixo e pinte de laranja.", "tipo": "desenho", "opcoes": [], "gabarito": "Resposta pessoal (desenho de 4 laranjas)"}]}',
  '/images/thumbnails/math_fruits.jpg',
  TRUE,
  NOW()
),
(
  'Fichas de Alfabetização: Letras A-D',
  'Flashcards interativos com letras maiúsculas e minúsculas associadas a palavras do cotidiano para fixação silábica.',
  'FLASHCARD',
  'Maternal',
  'Português',
  '{"fichas": [{"frente": "A", "verso": "Abelha - A abelha faz mel."}, {"frente": "B", "verso": "Bola - A bola é redonda e pula."}, {"frente": "C", "verso": "Casa - A casa é o nosso lar."}, {"frente": "D", "verso": "Dado - O dado tem seis lados."}]}',
  '/images/thumbnails/flashcards_alphabet.jpg',
  TRUE,
  NOW()
),
(
  'Jogo das Mímicas Animadas',
  'Uma dinâmica em grupo divertida de mímica sobre animais para engajar a turma, desenvolver expressão corporal e socialização.',
  'GAME',
  'Educação Infantil',
  'Educação Física',
  '{"regras": ["Divida a turma em grupos de 3 a 5 alunos.", "Cada grupo recebe um conjunto de cartões de palavras.", "Um aluno do grupo retira um cartão sem mostrar aos colegas e deve fazer mímica para que o grupo adivinhe a palavra em até 1 minuto."], "passo_a_passo": ["Explique as regras gerais da mímica para a turma.", "Entregue os envelopes com os cartões para os líderes dos grupos.", "Cronometre as rodadas e declare vencedor o grupo que adivinhar mais palavras."], "perguntas_jogo": ["Cachorro", "Gato", "Pássaro", "Elefante", "Peixe"]}',
  '/images/thumbnails/game_mime.jpg',
  TRUE,
  NOW()
);
