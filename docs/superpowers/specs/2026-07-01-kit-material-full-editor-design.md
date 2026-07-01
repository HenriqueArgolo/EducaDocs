# Editor completo para materiais do kit

## Objetivo

Todo material de um kit deve abrir na experiência completa de documento, igual à tela atual do plano de aula. O modal de texto do hub deixa de ser um destino de abertura.

## Fluxo aprovado

- O plano de aula continua abrindo em `/dashboard/document/{sourceDocumentId}`.
- Atividade, gabarito, avaliação, evidências e adaptações abrem em `/dashboard/document/{sourceDocumentId}?kit={kitId}&material={type}`.
- Os cards do hub e os arquivos do dropdown da linha do tempo usam o mesmo gerador de URL, evitando destinos diferentes.
- A rota carrega o documento de origem para manter turma, série, disciplina e metadados, e carrega o material selecionado do kit para montar o conteúdo exibido.

## Experiência do editor

A tela mantém cabeçalho escolar, vínculo com turma, adaptação para inclusão, edição, exportação Word e impressão. Para materiais do kit:

- `Editar Conteúdo` edita a representação estruturada e salva no endpoint do material, não no documento de origem.
- `Exportar DOCX` usa o exportador Word do material.
- `Imprimir` abre o PDF real gerado para aquele material.
- O título e o tipo visíveis correspondem ao material selecionado.
- O painel de criação de kit não aparece em materiais derivados.

Editar significa alterar o conteúdo-fonte estruturado; o PDF é regenerado desse conteúdo na impressão. O binário PDF não será editado diretamente.

## Arquitetura

Um adaptador de frontend converte `LessonKitMaterial` em um documento virtual compatível com a tela existente e empacota/desempacota o JSON para os editores de seção. A tela identifica o modo por `kit` e `material` na URL e direciona carregamento, salvamento, exportação e impressão para a API correta. O renderizador recebe o tipo do material para exibir apenas suas seções.

Não serão criados documentos duplicados no banco. O kit continua sendo a fonte única dos materiais derivados.

## Erros e estados

- Parâmetros inválidos mostram erro de material não encontrado.
- Material ainda não pronto não abre como editável.
- Falhas ao salvar, exportar ou gerar PDF aparecem na própria tela.
- Links só são habilitados para materiais prontos.

## Verificação

- Teste de contrato comprova que hub e dropdown apontam para o editor completo e que o modal antigo não existe.
- Testes do adaptador comprovam empacotamento e recuperação do conteúdo sem perda.
- Lint focado, build Next.js e suíte backend validam a integração.

