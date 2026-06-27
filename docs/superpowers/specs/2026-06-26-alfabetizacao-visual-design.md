# Alfabetizacao Visual 1 Ano Design

## Objetivo

Gerar atividades de alfabetizacao para 1 ano com aparencia proxima a folhas reais: comandos curtos, palavras familiares, desenhos simples, caixas de resposta, ligacoes, letras grandes e variacao visual entre exercicios.

## Problema Atual

O fluxo atual prende a IA a poucas figuras e renderiza quase todos os exercicios no mesmo formato: figura, palavra, caixas ou alternativas. Isso cria folhas repetidas, com pouca relacao visual com o assunto escolhido, e deixa a IA escolher conteudo sem validacao suficiente.

## Estrategia

Usar um motor hibrido:

- A IA atua como planejadora pedagogica, sugerindo tema, palavras, tipos de exercicio, silabas, letras e respostas.
- O backend limita a IA a um banco tematico de palavras/figuras adequado ao 1 ano.
- O sistema valida o plano antes de salvar: tema coerente, palavras curtas, figuras existentes, tipos variados, comandos curtos e ausencia de perguntas textuais longas.
- O frontend atua como diagramador controlado, escolhendo templates visuais diferentes por tipo de exercicio.

## Componentes

### Banco Tematico

Um catalogo local define palavras, figuras, silabas, categorias e sinonimos de tema. Exemplo: tema "animais da fazenda" pode usar VACA, PATO, GALO, SAPO, CAVALO e OVELHA. O catalogo deve ser expansivel sem mexer nos prompts.

### Planejador IA

O prompt recebe o assunto escolhido pelo professor, a serie, a disciplina, a lista de palavras candidatas e a lista de tipos permitidos. A resposta deve ser JSON estruturado no layout `ALFABETIZACAO_VISUAL_V2`.

### Validador/Fallback

Se a IA devolver palavra fora do banco, tema incoerente, repeticao excessiva ou exercicio inadequado, o backend monta uma ficha deterministica com o banco tematico. Isso evita folha vazia ou atividade sem sentido.

### Renderer Visual

O frontend deve renderizar cada tipo com desenho proprio:

- `SEPARAR_SILABAS`: lista vertical com figura, palavra e blocos de silabas.
- `LETRA_INICIAL`: grade de figuras com opcoes de letras grandes para marcar.
- `LIGAR_FIGURA_PALAVRA`: duas colunas com figuras e palavras embaralhadas.
- `COMPLETAR_PALAVRA`: palavra com lacunas e banco de silabas/letras.
- `CIRCULAR_LETRA`: palavra grande e letras alvo para circular.
- `CONTAR_LETRAS`: figura, palavra e quadradinhos para quantidade.

## Criterios de Aceite

- Atividades de 1 ano nao devem depender de leitura fluente.
- Cada ficha deve usar pelo menos dois tipos visuais diferentes.
- O assunto informado deve influenciar o banco de palavras.
- A mesma ficha nao deve repetir sempre os mesmos elementos.
- O material do aluno nao deve mostrar gabarito.
- O PDF/print deve caber em A4, sem texto sobreposto.

## Fora de Escopo Inicial

- Gerar imagens novas por IA em tempo real.
- Resolver todos os anos escolares.
- Baixar automaticamente imagens externas.
- Criar editor visual manual.
