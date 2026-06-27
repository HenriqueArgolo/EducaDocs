# Imagens Geradas Para Atividades - Design

## Objetivo

Usar `gemini-3.1-flash-image` no fluxo existente de **Gerar Atividade com IA** para criar ilustrações escolares reconhecíveis e prontas para impressão, preservando a estrutura pedagógica e o layout HTML/CSS já implementados.

## Escopo

- Gerar uma imagem separada para cada elemento visual único descrito no JSON pedagógico.
- Atender inicialmente os campos visuais já existentes: `figura`, `descricao_desenho` e `palavras_chave_imagem`.
- Tornar obrigatória a geração visual para fichas de alfabetização inicial e livros de colorir, pois esses contratos já fornecem descritores visuais.
- Não gerar uma página inteira como imagem e não colocar textos, comandos ou espaços de resposta dentro da imagem.
- Manter o comportamento atual para materiais sem descritores visuais.

## Modelo E Custo

- Modelo: `gemini-3.1-flash-image`.
- Resolução: `512` (0.5K), proporção `1:1`, JPEG.
- Autenticação: a mesma variável `GEMINI_API_KEY` usada pelo Gemini textual.
- O modelo e a resolução serão configuráveis por ambiente.

## Padrão Visual

O prompt canônico solicitará um objeto único, centralizado e facilmente reconhecível, com fundo branco puro, linhas pretas limpas de espessura média a grossa, poucos detalhes internos e proporções amigáveis. Ele proibirá texto, letras, números, molduras, cenário, sombras, tons de cinza e preenchimentos escuros extensos.

## Fluxo

1. `ActivityMaterialService` gera e normaliza o JSON pedagógico como hoje.
2. `ActivityImageEnricher` percorre o JSON e coleta descritores visuais únicos.
3. Para cada descritor, `GeneratedImageAssetService` calcula uma chave de cache baseada em modelo, resolução, versão do estilo e assunto normalizado.
4. Em cache hit, o serviço reutiliza a imagem existente.
5. Em cache miss, `GeminiImageClient` chama a Interactions API e solicita uma imagem JPEG 512x512.
6. A imagem passa por validação binária e semântica. Uma reprovação permite nova tentativa, até o máximo de três gerações.
7. A imagem aprovada é salva no PostgreSQL e servida por `/images/generated/{id}`.
8. O enriquecedor grava `imagemUrl` no mesmo nó JSON que contém o descritor.
9. O frontend prioriza `imagemUrl` e usa o ícone/desenho atual apenas como fallback.

## Cache E Persistência

A tabela `generated_image_assets` armazenará chave de cache única, assunto, prompt, modelo, MIME type, dimensões, bytes da imagem e data de criação. Apenas imagens aprovadas serão persistidas. O cache será compartilhado entre atividades e usuários para evitar cobrança repetida por figuras equivalentes.

## Validação

### Validação Binária

- MIME type de imagem permitido.
- Arquivo decodificável e não vazio.
- Dimensões mínimas compatíveis com 512px.
- Fundo predominantemente claro.
- Quantidade suficiente de pixels escuros para não aceitar uma página vazia.
- Baixa ocupação nas bordas para reduzir desenhos cortados.

### Validação Semântica

O Gemini textual receberá a imagem e responderá JSON indicando se o assunto corresponde ao solicitado, se há texto indesejado, se o objeto está isolado e se o desenho é adequado para impressão infantil. Falha temporária do validador semântico não impedirá uma imagem que passou pela validação binária, mas será registrada em log.

## Concorrência E Falhas

- No máximo duas imagens serão geradas simultaneamente.
- No máximo oito elementos visuais únicos serão processados por atividade.
- Falha em uma imagem não cancela a atividade inteira.
- Falha geral ou chave ausente devolve o JSON pedagógico original, permitindo que o frontend use o fallback existente.
- Respostas do provedor nunca serão registradas com bytes Base64 completos.

## Frontend

- Fichas de alfabetização usarão `imagemUrl` nos blocos de figura.
- Livros de colorir usarão a imagem gerada diretamente e não aplicarão o filtro fotográfico de contorno sobre ela.
- A busca externa existente será executada somente quando não houver imagem gerada.
- Durante a requisição, a tela continuará bloqueando reenvios e informará que estrutura e ilustrações estão sendo criadas.

## Testes

- Testes unitários do payload e parser da Interactions API.
- Testes do cache, tentativas e fallback do serviço de imagens.
- Testes da validação binária e do enriquecimento recursivo do JSON.
- Testes do `ActivityMaterialService` garantindo enriquecimento antes da persistência.
- Testes dos helpers do frontend para URL e prioridade da imagem gerada.
- Build completo de backend e frontend.
- Teste real com uma imagem e geração real de uma atividade, seguido de inspeção visual do PDF.

## Fora Do Escopo

- Editor manual de imagens.
- Geração de páginas inteiras como bitmap.
- Imagens com fundo transparente.
- Armazenamento externo em S3/Supabase Storage nesta primeira versão.
