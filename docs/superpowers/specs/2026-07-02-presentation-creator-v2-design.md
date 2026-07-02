# Criador de Apresentações v2 — Design

## Objetivo

Redesenhar somente `/dashboard/slides/new` para aproximar o fluxo das referências Chalkie sem perder a identidade visual do EducaDocs. O professor percorre três etapas claras: **Tema**, **Refinar** e **Aparência**.

## Limites desta entrega

- Inclui o wizard de criação, geração e edição do roteiro e catálogo ampliado de temas.
- Reutiliza o endpoint de roteiro e o fluxo de geração já presentes no worktree.
- Não altera o editor da apresentação depois de gerada.
- Não implementa ainda cache de imagens, Wikimedia Commons, FLUX ou validação visual; esses serviços são a próxima fase.

## Experiência aprovada

### 1. Tema

Uma coluna central de até 850 px contém o tópico em destaque e, abaixo, um compositor único. Série, disciplina, quantidade de slides e idioma aparecem como controles compactos. O professor pode incluir orientações e materiais de referência. A ação **Criar roteiro pedagógico** é visualmente secundária ao campo de tema, mas claramente acionável.

O upload é apresentado como estado futuro e não deve fingir que envia arquivos: fica desabilitado e identificado como “Em breve” até existir processamento real.

### 2. Refinar

O roteiro gerado torna-se uma lista editável. Cada linha mostra número, título e função pedagógica — capa, situação-problema, conhecimentos prévios, objetivos, conceito, aplicação, verificação, síntese ou conexão cotidiana. É possível editar, excluir e adicionar slides. A lista nunca pode avançar vazia.

### 3. Aparência

Uma galeria 3 × N apresenta miniaturas 16:9. Os filtros combinam duas dimensões sem confundi-las:

- contexto pedagógico: anos iniciais, ciências, história, matemática e adolescentes;
- acessibilidade: baixa estimulação, dislexia, baixa visão e TDAH.

O catálogo inicial terá 12 temas: Chalkie, Ciência clara, Arquivo histórico, Matemática visual, Azul profundo, Foco, Editorial, Alto contraste, Natureza, Gradiente suave, Energia e Terra. Chalkie é o recomendado inicial.

## Identidade visual

- Manter tokens roxos, superfícies claras, sombras discretas e raios arredondados do EducaDocs.
- Usar Georgia apenas como detalhe editorial nos títulos do fluxo, preservando Inter na interface.
- Usar Lucide para ícones estruturais; não usar emoji como ícone de navegação.
- CTA principal com gradiente violeta já reconhecível no produto.
- Movimento entre etapas de 180–220 ms, removido com `prefers-reduced-motion`.
- Controles com área mínima de 44 px, foco visível e estados selecionados que não dependem apenas de cor.

## Contrato do futuro motor Chalkie

O criador já coleta tema, disciplina, ano, quantidade de slides e orientações. A próxima fase ampliará o contrato para idade, tempo e objetivo e trocará títulos simples por objetos de slide contendo função pedagógica, texto breve, orientação visual, ALT text, busca Wikimedia, prompt de IA, notas do professor, BNCC, Bloom e avaliação.

A geração universal deverá adaptar linguagem e visual por idade e disciplina. O pipeline de imagem seguirá biblioteca/cache → Wikimedia/banco → IA → validação opcional.

## Estados e erros

- Campos obrigatórios ausentes: manter o professor na etapa Tema e focar o primeiro campo inválido.
- Falha ao gerar roteiro: mostrar alerta persistente com ação para tentar novamente.
- Roteiro vazio: impedir avanço e orientar a adicionar ao menos um slide.
- Geração final em curso: bloquear navegação duplicada e indicar progresso no CTA.
- Contexto de turma: manter série e disciplina bloqueadas e explicar a origem dos valores.

## Responsividade e validação

- Desktop: galeria em três colunas; mobile: duas e depois uma coluna quando necessário.
- Rodapé de ações fixo, com espaço inferior suficiente para não cobrir conteúdo.
- Validar em 375 px e 1440 px, teclado, foco, `prefers-reduced-motion`, lint, TypeScript e build de produção.

