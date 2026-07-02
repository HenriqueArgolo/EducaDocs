# Biblioteca de Temas de Apresentação — Design

## Objetivo

Substituir o catálogo de doze paletas por uma biblioteca de 180 temas de apresentação: dez temas para cada uma de dez categorias pedagógicas e oito categorias inclusivas.

## Categorias

Pedagógicas: anos iniciais, ciências, história, geografia e natureza, matemática e dados, línguas e literatura, artes e criatividade, tecnologia e STEAM, adolescente e acadêmico, institucional e profissional.

Inclusivas: TDAH, dislexia, baixa visão, daltonismo, baixa estimulação sensorial, autismo e previsibilidade visual, leitura fácil e deficiência intelectual, deficiência auditiva e conteúdo multimodal.

## O que constitui um tema

Um tema não é uma paleta. Cada tema declara nome, propósito, categoria, composição, tipografia, tratamento de imagem, tratamento de título, moldura, elementos de identidade, densidade, movimento permitido, perfil de acessibilidade e estilo-base para exportação.

Dez sistemas de composição sustentam a biblioteca: orgânico, editorial, arquivo, laboratório, geométrico, faixa cinematográfica, colagem, caderno, galeria e foco. As categorias fornecem conteúdo visual próprio; portanto, o mesmo sistema de composição produz resultados diferentes em História e Dislexia.

## Catálogo e seleção

O seletor organiza temas por grupo e categoria, oferece pesquisa e mostra dez resultados por categoria. Cada miniatura representa a composição: proporção entre texto e imagem, moldura, assinatura visual e hierarquia. Nenhuma miniatura pode ser apenas um retângulo colorido.

## Renderização

O HTML/CSS do editor é a fonte visual única. O ID selecionado chega intacto ao editor, que resolve tokens e atmosfera visual dinamicamente e mantém compatibilidade com os temas legados. A atmosfera inclui camadas decorativas, tratamento de borda e imagem e variação de silhueta. Os layouts pedagógicos existentes continuam responsáveis pela função do slide.

Na exportação, cada slide é renderizado pelo mesmo canvas React/CSS em alta resolução. O PptxGenJS apenas empacota essas páginas no arquivo PowerPoint e preserva as notas do professor. Não existe uma segunda reconstrução visual baseada em shapes, evitando divergência entre prévia e download.

## Inclusão

Temas inclusivos têm regras verificáveis. TDAH reduz competição visual e explicita o foco; dislexia usa formas de letra simples, alinhamento à esquerda e medida curta; baixa visão exige alto contraste e contornos; daltonismo não depende de cor; baixa estimulação remove movimento e decoração; previsibilidade mantém posições; leitura fácil limita densidade; deficiência auditiva reserva espaço para legenda e não depende de áudio.

## Critérios de aceite

- Exatamente 18 categorias e pelo menos dez temas em cada uma.
- Exatamente 180 IDs únicos.
- Todo tema contém composição e perfil visual completo.
- Todo tema inclusivo possui regras específicas, não somente tags.
- Miniaturas usam ao menos três regiões visuais e variam por composição.
- O tema selecionado chega ao editor sem conversão para `LUDICO`.
- A exportação captura o canvas HTML/CSS e não redesenha o slide separadamente.
- Catálogo, filtros, TypeScript e lint possuem verificações automatizadas.
