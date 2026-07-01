import json
from pathlib import Path

def add_missing():
    catalog_path = Path("src/main/resources/prompts/prompts_catalog.json")
    if not catalog_path.exists():
        print("prompts_catalog.json not found!")
        return
        
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    
    # 1. BNCC Recommendation
    catalog["bncc_recommendation_prompt"] = """Você é um especialista em educação brasileira e estruturação curricular de acordo com a BNCC.
Dado o seguinte assunto/tema para uma aula/recurso pedagógico:
Assunto: "{0}"
Matéria/Disciplina: "{1}"
Série/Nível: "{2}"

Analise a lista de habilidades BNCC candidatas abaixo e selecione entre 2 a 5 habilidades que sejam diretamente relevantes e adequadas para serem trabalhadas com esse assunto.
Retorne a resposta EXCLUSIVAMENTE como um objeto JSON contendo a propriedade "recommendedIds" mapeando para a lista de IDs numéricos recomendados (ex: {{ "recommendedIds": [12, 15] }}).

Lista de Habilidades BNCC Candidatas:
{3}"""

    # 2. Classroom Timeline/Roadmap
    catalog["classroom_timeline_roadmap_prompt"] = """Você é um especialista em educação brasileira (diretrizes do MEC e BNCC).
Gere um cronograma sequencial de aulas (roadmap pedagógico) para a seguinte turma:
- Nome da Turma: {0}
- Ano Escolar: {1}
- Disciplina: {2}
- Tema Central: {3}
- Número de Aulas/Passos solicitados: {4}
- Instruções Adicionais: {5}

Instruções importantes:
- Os títulos das aulas devem ser curtos, diretos e prontos para uso (ex: "Frações Equivalentes com Modelos Visuais").
- As descrições devem explicar brevemente o conteúdo e a dinâmica proposta (máximo de 2 frases).
- O tipo de recurso sugerido ("tipo") deve ser estritamente uma destas opções: 
  "PLAN" (para plano de aula), 
  "SLIDES" (para apresentações visuais), 
  "ACTIVITY" (para fichas de atividades/exercícios), 
  "EXAM" (para avaliações formais),
  "CUSTOM_EVENT" (para aulas de laboratório, saídas pedagógicas, feriados ou revisões).
- Distribua os tipos de forma lógica (ex: aulas teóricas com PLAN/SLIDES, seguidas de fixação com ACTIVITY, e finalizando o tema com um EXAM).

Retorne APENAS um objeto JSON com a chave "aulas" contendo uma lista de objetos. Cada objeto deve possuir exatamente os seguintes campos JSON:
- "titulo" (String)
- "descricao" (String)
- "tipo" (String, deve ser apenas: "PLAN", "SLIDES", "ACTIVITY", "EXAM" ou "CUSTOM_EVENT")

Não inclua markdown (como ```json ou ```), textos explicativos ou caracteres extras. Retorne apenas o JSON puro."""

    # 3. Inclusion Adaptation Guidelines
    catalog["inclusion_tdah_guidelines"] = """- **Segmentação (Chunking):** Divida atividades longas em blocos de 10-15 minutos. Indique pausas claras.
- **Destaques Visuais:** Use negrito (ex: **termo**) ou cores para destacar palavras-chave, instruções principais e informações importantes.
- **Movimento e Interatividade:** Inclua pausas ativas ou elementos que permitam a manipulação física de objetos (se aplicável).
- **Feedback Imediato:** Proponha atividades com verificações rápidas de progresso e feedback construtivo.
- Reduzir distratores textuais, indo direto ao ponto com linguagem objetiva.
- Organizar ideias em tópicos simples e bem demarcados."""

    catalog["inclusion_autismo_guidelines"] = """- **Previsibilidade:** Inclua rotinas claras e cronogramas visuais (se aplicável).
- **Linguagem Literal:** Utilize linguagem estritamente denotativa (literal), eliminando metáforas, ironias, figuras de linguagem, sarcasmo ou duplos sentidos. Use frases curtas e diretas.
- **Interesses Específicos:** Conecte o conteúdo aos interesses hiperfocados do aluno para aumentar o engajamento sempre que possível.
- **Suporte Visual:** Utilize pictogramas, listas de verificação e instruções numeradas.
- Estruturar o conteúdo de forma sequencial clara, lógica e previsível.
- Fornecer descrições concretas, diretas e explícitas para cada tarefa (passo a passo claro do que é esperado que o aluno faça).
- Eliminar informações supérfluas e focar apenas no núcleo pedagógico."""

    catalog["inclusion_dislexia_guidelines"] = """- **Simplificação de Texto:** Reduza a densidade do texto, usando frases curtas e diretas na voz ativa, com vocabulário de alta frequência e parágrafos curtos.
- **Suporte Auditivo e Visual:** Sugira o uso de áudios, vídeos e mapas mentais em vez de longos textos escritos.
- **Fontes e Formatação:** Recomende fontes sem serifa, maior espaçamento entre linhas e evite blocos de texto justificados que criam distratores visuais.
- **Avaliação Alternativa:** Proponha formas de avaliação que não dependam exclusivamente da escrita (ex: apresentações orais, desenhos, esquemas, respostas verbais).
- Evitar termos foneticamente muito parecidos próximos uns dos outros para evitar confusão de decodificação."""

    catalog["inclusion_adaptation_base_prompt"] = """Você é um psicopedagogo especialista em Educação Inclusiva e Atendimento Educacional Especializado (AEE).
Sua tarefa é adaptar o seguinte recurso pedagógico para alunos com a seguinte necessidade específica: {0}.

Tipo do recurso original: {1}.
Título: {2}.

Conteúdo Original a ser Adaptado:
{3}

---
Diretrizes de Adaptação Inclusiva para {4}:
{5}

---
Regras cruciais de retorno:
1. Se o Conteúdo Original for um JSON estruturado válido, você DEVE retornar OBRIGATORIAMENTE um objeto JSON válido com a exata mesma estrutura (mantendo exatamente as mesmas chaves, arrays e hierarquia), modificando apenas os valores de texto internos (enunciados, descrições, explicações, alternativas, etc.) de modo a adaptá-los conforme as diretrizes de inclusão acima. Não adicione chaves extras nem remova chaves existentes.
2. Se o Conteúdo Original for texto puro (não JSON), retorne apenas o texto puro adaptado de acordo com as diretrizes.
3. Retorne apenas o resultado puro do JSON ou texto. Não inclua blocos markdown como ```json ou comentários explicativos antes ou depois."""

    # 4. Presentation Service Structures and Task
    catalog["presentation_structure_infantil"] = """- Slide 1: Capa (Título da Experiência e Imagem atraente)
- Slide 2: "Por que esta experiência?" (Objetivos de Aprendizagem e Desenvolvimento)
- Slide 3: "Como vamos fazer?" (Descrição simplificada da metodologia)
- Slide 4: "O que as crianças vão aprender?" (Benefícios para o desenvolvimento)
- Slide 5: "Materiais Necessários" (Lista visual de materiais simples)
- Slide 6: "Como você pode participar?" (Sugestões para pais ou educadores)
- Slide 7: Contato e Agradecimento"""

    catalog["presentation_structure_fundamental_1_ano"] = """- Slide 1: Título com imagem grande, colorida e atrativa (sem texto longo)
- Slide 2: "O QUE VAMOS FAZER HOJE?" (1 frase curta + imagem ilustrativa)
- Slides 3-5: Conteúdo visual (1 palavra/sílaba/letra por slide, com figura grande e cor)
- Slide 6: "VAMOS BRINCAR!" (Atividade oral ou motora guiada pelo professor)
- Slide 7: "O QUE APRENDEMOS?" (Revisão visual com imagens)
- Slide 8: Encerramento com música ou parlenda (opcional)
REGRAS OBRIGATÓRIAS: Máx. 5 palavras por slide. Fonte grande (mín. 40pt). Sem textos corridos. Fundo colorido e alegre. Imagens grandes e simples."""

    catalog["presentation_structure_fundamental_iniciais"] = """- Slide 1: Título da Aula e Imagem motivadora
- Slide 2: "O que vamos aprender hoje?" (Objetivos de Aprendizagem da BNCC e metas)
- Slide 3: Atividade de Aquecimento/Pergunta Geradora (com imagem)
- Slides 4-7: Desenvolvimento do Conteúdo (1-2 conceitos por slide, com exemplos práticos)
- Slide 8: Atividade Prática/Interativa (com instruções claras)
- Slide 9: "O que aprendemos?" (Síntese dos pontos-chave)
- Slide 10: Desafio/Para Casa (opcional)"""

    catalog["presentation_structure_fundamental_finais"] = """- Slide 1: Título da Aula, Nome da Disciplina e Imagem provocativa
- Slide 2: "O que vamos investigar?" (Objetivos de Aprendizagem da BNCC)
- Slide 3: Problematização Inicial/Estudo de Caso (com dados ou imagens)
- Slides 4-12: Desenvolvimento do Conteúdo (1-2 conceitos complexos por slide)
- Slide 13: "Para Refletir/Debater" (Questões abertas para discussão em grupo)
- Slide 14: Síntese dos Conceitos-Chave
- Slide 15: Sugestões de Leitura/Pesquisa"""

    catalog["presentation_structure_ensino_medio"] = """- Slide 1: Título da Aula, Área do Conhecimento e Imagem impactante
- Slide 2: "Questão Central" (Problematização complexa que guiará a aula)
- Slide 3: "Nossos Objetivos" (Competências e Habilidades da BNCC)
- Slides 4-15: Desenvolvimento do Conteúdo (1-2 conceitos aprofundados por slide)
- Slide 16: "Debate e Reflexão" (Questões abertas para discussão aprofundada)
- Slide 17: "Conexões com o Mundo/Projeto de Vida" (Como o tema se relaciona)
- Slide 18: Referências e Sugestões de Aprofundamento"""

    catalog["presentation_structure_eja"] = """- Slide 1: Título da Aula e Imagem que remeta ao cotidiano ou mundo do trabalho
- Slide 2: "O que já sabemos?" (Atividade de resgate de saberes prévios)
- Slide 3: "Por que isso é importante para nós?" (Conexão do tema com a vida)
- Slides 4-9: Desenvolvimento do Conteúdo (1 conceito por slide, com exemplo prático)
- Slide 10: "Vamos Praticar!" (Atividade prática ou discussão em grupo)
- Slide 11: "O que levamos para a vida?" (Síntese e aplicação do conhecimento)
- Slide 12: Contato e Agradecimento"""

    catalog["presentation_generation_base_prompt"] = """## TASK: GERAR SLIDES PEDAGÓGICOS
Gere um conjunto de slides pedagógicos estruturado em português para o nível "{0}" na disciplina "{1}", sobre o tema: "{2}".
{3}

**Instruções de Qualidade e Formatação:**
- Número de Slides: Gere entre {4} e {5} slides.
- Estrutura sugerida:
{6}

- Design Visual e Estilo: Adapte a quantidade de texto (máximo 3-4 linhas/frases curtas por slide) e use termos específicos ao nível de ensino (mais lúdico para infantil/iniciais, mais acadêmico para finais/médio, andragógico e funcional para EJA).

A estrutura gerada deve ser obrigatoriamente um objeto JSON contendo as propriedades abaixo:
- "titulo": Título geral e engajador da apresentação.
- "slides": Uma lista contendo:
  - "slide_number": Número sequencial do slide.
  - "layout": Escolha de forma variada e dinâmica entre os 12 layouts abaixo para tornar a apresentação visualmente rica e de altíssima qualidade:
      * "title_slide" (Capa com imagem split, exclusivo para o slide 1)
      * "bullet_points" (Tópicos textuais concisos)
      * "text_and_image" (Texto explicativo acompanhado de palavra-chave para imagem)
      * "quote" (Frase de impacto ou questionamento com autor no subtítulo)
      * "exercise" (Desafio com pergunta nos pontos[0] e dicas/opções nos pontos[1], [2], [3])
      * "summary" (Recapitulando pontos chaves com 4 blocos curtos nos pontos)
      * "comparison" (Dois blocos de comparação lado a lado. Subtítulo DEVE ser "Tema A|Tema B", pontos[0] é a descrição do Tema A, pontos[1] a descrição do Tema B, pontos[2] é a conclusão/nota)
      * "numbered_steps" (Chevrons numerados 1, 2, 3. Subtítulo é o título do passo 1, pontos[0] descrição do passo 1, pontos[1] título do passo 2, pontos[2] descrição do passo 2, pontos[3] título do passo 3, pontos[4] descrição do passo 3)
      * "timeline" (Milestones cronológicos 1, 2, 3, 4 interligados. Subtítulo é o título do marco 1, pontos[0] descrição de 1, pontos[1] título de 2, pontos[2] descrição de 2, pontos[3] título de 3, pontos[4] descrição de 3, pontos[5] título de 4, pontos[6] descrição de 4)
      * "split_columns" (Duas colunas com fotos e descrição abaixo. Subtítulo é o título da Coluna A, pontos[0] descrição de A, pontos[1] título da Coluna B, pontos[2] descrição de B)
      * "grid_cards" (Grade com 3 colunas de cards. Subtítulo é o título do Card 1, pontos[0] descrição do Card 1, pontos[1] título do Card 2, pontos[2] descrição do Card 2, pontos[3] título do Card 3, pontos[4] descrição do Card 3)
      * "highlight_quote" (Imagem à esquerda, texto introdutório no subtítulo e citação/dica em caixa de destaque nos pontos[0])
  - "titulo": Título do slide.
  - "subtitulo": Texto de suporte ou títulos de seção, dependendo do layout escolhido acima.
  - "pontos": Lista (Array de strings) formatada estritamente conforme as regras do layout escolhido acima.
  - "notas_professor": Roteiro curto com dicas pedagógicas, perguntas motivadoras e explicação para orientar o professor durante a aula (entre 30 a 60 palavras).

Garanta que o JSON retornado seja válido e bem formatado. Não insira nenhum caractere como ```json ou marcações Markdown no início ou fim. Retorne apenas o objeto JSON delimitado por chaves {{}}."""

    # 5. Activity Material Rules and Task
    catalog["activity_generation_early_grade_rule"] = """
ATENÇÃO ESPECIAL (Pedagogia para Alfabetização/Educação Infantil):
- Como os alunos estão na fase de alfabetização ou pré-escola, evite questões complexas com textos longos ou dependência de leitura fluente.
- Para Fichas de Atividades (WORKSHEET), priorize comandos simples, sonoros e motores (ex: 'Cubra o pontilhado', 'Identifique a letra inicial', 'Ligue a figura ao som', 'Pinte o desenho').
- Use palavras curtas e simples (ex: animais, objetos do dia a dia) para as atividades."""

    catalog["activity_generation_literacy_worksheet_rule"] = """
CONTRATO OBRIGATÓRIO PARA WORKSHEET DE ALFABETIZAÇÃO INICIAL:
- Ignore MARCAR/ESCREVER/MISTA como formato textual tradicional; eles devem virar ações visuais simples.
- Gere uma folha parecida com atividades reais de 1º ano: figuras, palavras em CAIXA ALTA, sílabas, letras, caixas para completar, ligar/circular/pintar.
- Cada comando deve ter no máximo 8 palavras.
- Não use textos longos, interpretação textual, ordem alfabética sem apoio visual, pergunta discursiva, resposta por extenso ou 4 alternativas complexas.
- Use somente estas figuras permitidas: {0}.
- Use somente estes tipos: {1}.
- Use preferencialmente as palavras do banco temático abaixo. Se o tema for específico, escolha as palavras mais próximas do assunto.
- O gabarito deve existir apenas para o professor; o renderer de aluno não deve depender dele.

Banco tematico de palavras:
{2}

Schema obrigatório para este WORKSHEET:
{{
  "titulo": "Título curto da ficha",
  "layout": "ALFABETIZACAO_VISUAL_V2",
  "descricao": "Orientação breve para o professor",
  "instrucoes_alunos": "Professor(a), leia os comandos em voz alta.",
  "schemaVersion": 2,
  "exercicios": [
    {{
      "numero": 1,
      "tipo": "SEPARAR_SILABAS",
      "comando": "Separe as sílabas.",
      "itens": [
        {{"palavra": "BOLO", "figura": "bolo", "caixasResposta": 2}}
      ],
      "gabarito": "BO-LO"
    }},
    {{
      "numero": 2,
      "tipo": "LETRA_INICIAL",
      "comando": "Pinte a letra inicial.",
      "itens": [
        {{"palavra": "SAPO", "figura": "sapo", "opcoes": ["S", "P", "O"], "resposta": "S"}}
      ],
      "gabarito": "S"
    }}
  ]
}}
O contrato ALFABETIZACAO_VISUAL_V2 acima prevalece sobre qualquer exemplo genérico de WORKSHEET abaixo."""

    catalog["activity_generation_marcar_rule"] = "\nRegra de Formato Obrigatória: Todas as questões geradas na Ficha de exercícios (exercicios) devem ser OBRIGATORIAMENTE de múltipla escolha (\"tipo\": \"multipla_escolha\"), contendo exatamente 4 opções de resposta no array 'opcoes' de cada questão.\n"
    catalog["activity_generation_escrever_rule"] = "\nRegra de Formato Obrigatória: Todas as questões geradas na Ficha de exercícios (exercicios) devem ser OBRIGATORIAMENTE de resposta escrita (\"tipo\": \"resposta_escrita\") para o aluno responder por extenso. O array 'opcoes' deve ser retornado vazio [].\n"
    catalog["activity_generation_mista_rule"] = "\nRegra de Formato Obrigatória: A Ficha de exercícios (exercicios) deve conter uma mistura equilibrada de questões de múltipla escolha (\"tipo\": \"multipla_escolha\", com 4 opções) e questões de resposta escrita (\"tipo\": \"resposta_escrita\", com opções vazias).\n"

    catalog["activity_generation_base_prompt"] = """Você é um especialista em educação infantil, alfabetização e metodologias ativas.
Gere um recurso didático estruturado em português para o nível "{0}" na disciplina "{1}", sobre o tema: "{2}".

Tipo de recurso a ser gerado: {3}.
{4}
{5}

Seja altamente pedagógico, lúdico, engajador e adequado para a idade indicada.
A saída deve ser exclusivamente um objeto JSON estrito com a seguinte estrutura de acordo com o tipo:

Caso tipo seja COLORING_BOOK (Livro de colorir infantil):
{{
  "titulo": "Título lúdico do Livro de Colorir (Ex: O Grande Safari da Leitura)",
  "descricao": "Texto curto orientando o professor sobre o foco motor ou cognitivo desta atividade",
  "instrucoes_alunos": "Instruções divertidas em tom infantil ensinando a criança sobre o tema e o que colorir",
  "paginas": [
    {{
      "numero": 1,
      "titulo_pagina": "Título ou Letra da Página (Ex: A de Abelha)",
      "descricao_desenho": "Descrição detalhada do desenho para guiar o professor ou geração de imagens posterior (Ex: Um lindo leão amigável sorrindo embaixo de uma árvore de acácia sob o sol)",
      "palavras_chave_imagem": "2 ou 3 termos descritivos simples em inglês para buscar o desenho no Unsplash (Ex: cute lion outline coloring page)",
      "texto_apoio": "Palavra ou frase curta em caixa alta para a criança praticar caligrafia ou leitura (Ex: LEÃO, ABELHA, A, B, 1, 2)",
      "svg_content": "Código SVG completo, válido, limpo e autossuficiente (começando com <svg> e terminando com </svg>). Você DEVE OBRIGATORIAMENTE fornecer um SVG simples contendo apenas o contorno da LETRA INICIAL do texto de apoio em tamanho gigante (Ex: se o texto de apoio for 'LEÃO', use a letra 'L'. Se for 'REI', use 'R'. Se for 'SOL', use 'S'). Use EXATAMENTE a estrutura de texto: <svg viewBox='0 0 100 100'><text x='50%%' y='75%%' font-size='75' font-family='sans-serif' font-weight='bold' text-anchor='middle' fill='none' stroke='black' stroke-width='3'>L</text></svg>. Substitua apenas a letra 'L' pela letra correspondente. NÃO tente desenhar objetos complexos."
    }}
  ]
}}

Caso tipo seja WORKSHEET (Ficha de exercícios escritos), exceto quando houver contrato ALFABETIZACAO_VISUAL acima:
{{
  "titulo": "Título da Ficha de Atividades (Ex: Desafio Prático das Frações)",
  "descricao": "Orientações pedagógicas sobre a competência trabalhada",
  "instrucoes_alunos": "Instruções claras sobre como responder às questões",
  "exercicios": [
    {{
      "numero": 1,
      "enunciado": "Comando claro da pergunta. Para níveis de Educação Infantil e 1º Ano (Alfabetização), use comandos visuais e práticos, como 'Pinte as letras iniciais', 'Ligue a figura à sua sílaba inicial', 'Escreva a letra A nas pautas', evite comandos que exijam leitura fluente de textos longos",
      "tipo": "multipla_escolha" | "resposta_escrita" | "desenho" | "associar",
      "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"], // preencher apenas se for multipla_escolha, caso contrário deixar array vazio. Para alfabetização, as opções podem ser letras (ex: ['A', 'B', 'C', 'D']) ou sílabas/palavras simples
      "gabarito": "Resposta curta ou letra/número correto esperado para autocorreção do professor"
    }}
  ]
}}

Caso tipo seja FLASHCARD (Cartões de memorização rápida):
{{
  "titulo": "Título do Conjunto de Cartões",
  "descricao": "Instruções sobre como usar esses flashcards em dinâmicas de memorização ativa na sala",
  "instrucoes_alunos": "Como o aluno deve ler e chutar a resposta antes de virar o cartão",
  "fichas": [
    {{
      "frente": "Informação ou pergunta impressa na frente (Ex: H2O)",
      "verso": "Resposta ou explicação detalhada impressa no verso (Ex: Água - Composta por dois átomos de hidrogênio e um de oxigênio)"
    }}
  ]
}}

Caso tipo seja GAME (Dinâmica de jogo lúdico):
{{
  "titulo": "Nome do Jogo ou Brincadeira Pedagógica",
  "descricao": "Competências socioemocionais ou físicas que o jogo exercita",
  "instrucoes_alunos": "Introdução empolgante para convidar a turma ao jogo",
  "regras": ["Regra 1 clara", "Regra 2 clara"],
  "passo_a_passo": ["Preparação da sala", "Como dar início", "Critério de pontuação ou vitória"],
  "perguntas_jogo": ["Lista de cartas, termos, palavras ou perguntas a serem recortadas ou sorteadas durante a dinâmica"]
}}

Garanta que o JSON retornado seja válido e bem formatado. Não insira nenhum caractere como ```json ou marcações Markdown no início ou fim. Retorne apenas o objeto JSON delimitado por chaves {{}}."""

    # 6. Inclusion Prompts (from PromptBuilderHelper)
    catalog["inclusion_header"] = "\n**Instruções de Adaptação para Neurodiversidade:**\nO material a ser gerado deve ser adaptado considerando as seguintes necessidades e estratégias pedagógicas dos alunos:\n"
    
    catalog["inclusion_dua_principles"] = """\n**Princípios Gerais de Acessibilidade (DUA):**
- Ofereça a mesma informação em múltiplos meios de representação (texto simplificado, suporte visual, instruções passo a passo).
- Reduza a carga cognitiva, dividindo tarefas complexas em etapas menores e mais gerenciáveis.
- Use linguagem direta, evite ambiguidades, metáforas complexas e garanta uma organização visual limpa e clara.\n"""

    catalog["inclusion_strategy_autismo"] = """\n**Estratégias Específicas para Autismo (TEA):**
- **Previsibilidade:** Inclua rotinas claras e cronogramas visuais (se aplicável ao material).
- **Linguagem Literal:** Evite ironias, sarcasmo ou figuras de linguagem. Use frases curtas e diretas.
- **Interesses Específicos:** Sempre que possível, conecte o conteúdo aos interesses hiperfocados do aluno para aumentar o engajamento.
- **Suporte Visual:** Utilize pictogramas, listas de verificação e instruções numeradas.\n"""

    catalog["inclusion_strategy_tdah"] = """\n**Estratégias Específicas para TDAH (Transtorno do Déficit de Atenção com Hiperatividade):**
- **Segmentação (Chunking):** Divida atividades longas em blocos de 10-15 minutos. Indique pausas claras.
- **Destaques Visuais:** Use negrito ou destaques visuais para palavras-chave, instruções principais e informações importantes.
- **Movimento e Interatividade:** Inclua pausas ativas ou elementos que permitam a manipulação física de objetos (se aplicável ao material).
- **Feedback Imediato:** Proponha atividades com verificações rápidas de progresso e feedback construtivo.
- Reduzir distratores textuais, indo direto ao ponto com linguagem objetiva.
- Organizar ideias em tópicos simples e bem demarcados.\n"""

    catalog["inclusion_strategy_dislexia"] = """\n**Estratégias Específicas para Dislexia:**
- **Simplificação de Texto:** Reduza a densidade do texto, use frases curtas e voz ativa. Evite blocos de texto justificados.
- **Suporte Auditivo e Visual:** Sugira o uso de áudios, vídeos e mapas mentais em vez de longos textos escritos.
- **Fontes e Formatação:** Utilize fontes sem serifa (ex: Arial, Open Sans), tamanho de fonte maior (12-14pt), maior espaçamento entre linhas (1.5 ou duplo) e entre palavras. Evite itálico e sublinhado excessivo.
- **Avaliação Alternativa:** Proponha formas de avaliação que não dependam exclusivamente da escrita (ex: apresentações orais, desenhos, esquemas, respostas verbais).\n"""

    catalog["inclusion_strategy_discalculia"] = """\n**Estratégias Específicas para Discalculia:**
- **Uso de Manipulativos:** Sugira o uso de materiais concretos (blocos, ábacos, fichas) para representar conceitos matemáticos.
- **Visualização de Dados:** Transforme problemas abstratos em representações visuais e espaciais (gráficos, diagramas).
- **Passo a Passo Procedural:** Forneça roteiros detalhados de como resolver operações ou problemas, passo a passo, com exemplos claros.
- **Foco na Compreensão Conceitual:** Priorize a compreensão dos conceitos matemáticos sobre a memorização de fórmulas ou procedimentos.\n"""

    catalog["inclusion_strategy_visual"] = """\n**Estratégias Específicas para Deficiência Visual (Baixa Visão/Cegueira):**
- **Formato Acessível:** Indique que o material deve ser adaptado para leitores de tela, impressão em Braille ou ampliação de fonte.
- **Descrições Detalhadas:** Descreva minuciosamente imagens, gráficos e elementos visuais.
- **Recursos Auditivos:** Sugira a inclusão de descrições em áudio ou narrações.
- **Textos Alternativos (Alt Text):** Para imagens, forneça descrições textuais ricas.\n"""

    catalog["inclusion_strategy_auditivo"] = """\n**Estratégias Específicas para Deficiência Auditiva (Surdez/Perda Auditiva):**
- **Recursos Visuais:** Priorize o uso de imagens, diagramas, legendas e transcrições para conteúdos em áudio/vídeo.
- **Linguagem Clara e Direta:** Use frases curtas e objetivas. Evite expressões idiomáticas complexas.
- **Glossário Visual:** Inclua um glossário com termos-chave e suas representações visuais (se possível).
- **Apoio à Comunicação:** Sugira a inclusão de recursos em Libras (Língua Brasileira de Sinais) se o contexto permitir.\n"""

    catalog_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    print("Consolidated JSON prompts successfully!")

if __name__ == "__main__":
    add_missing()
