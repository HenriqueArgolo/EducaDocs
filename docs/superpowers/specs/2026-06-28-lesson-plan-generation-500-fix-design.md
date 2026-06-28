# Correção do erro 500 na geração de planos de aula

## Contexto

O commit que adicionou periodicidade aos planos de aula introduziu chamadas incompatíveis com os tipos atuais do backend. Uma compilação limpa confirma referências inexistentes a `LessonPlanRequestContext.getPlanningPeriod()` e `LessonPlanRequestContext.includeHeader()`. O mesmo fluxo tenta preencher `classroomId` e `timelineItemId` no builder de `GenerationRequest`, embora esses campos não pertençam à entidade. Além disso, a entidade passou a mapear `planning_period`, mas não existe uma migração Flyway correspondente.

## Comportamento desejado

- Planos de aula aceitam as periodicidades `SINGLE`, `WEEKLY` e `MONTHLY`.
- A periodicidade validada é usada na construção do prompt e persistida em `GenerationRequest`.
- Planos de aula não usam cabeçalho escolar, mesmo que um cliente envie `includeHeader=true`.
- A opção de cabeçalho não aparece no frontend quando o tipo selecionado é `LESSON_PLAN`.
- `classroomId` continua servindo para obter o contexto inclusivo dos alunos.
- `timelineItemId` continua servindo para vincular o documento gerado ao item do cronograma.
- Turma e item do cronograma não são duplicados em `generation_requests`.

## Alterações propostas

### Backend

As referências a `getPlanningPeriod()` serão substituídas pelo accessor de record `planningPeriod()`. O método que salva a geração registrará `planningPeriod` e definirá `includeHeader=false` para planos de aula.

As chamadas inexistentes `GenerationRequest.builder().classroomId(...)` e `.timelineItemId(...)` serão removidas. O uso operacional desses valores no serviço permanece inalterado.

Uma migração Flyway `V15__add_planning_period_to_generation_requests.sql` adicionará `planning_period VARCHAR(20) NOT NULL DEFAULT 'SINGLE'`. O valor padrão mantém compatibilidade com registros anteriores.

### Frontend

O controle de cabeçalho escolar será renderizado somente quando o tipo do documento não for `LESSON_PLAN`. Para planos de aula, o frontend enviará `includeHeader=false`; o backend também aplicará essa regra para proteger o contrato contra outros clientes.

## Fluxo de dados

1. O frontend envia a periodicidade escolhida e `includeHeader=false` para planos de aula.
2. `LessonPlanRequestValidator` normaliza periodicidade ausente para `SINGLE` no `LessonPlanRequestContext`.
3. `LessonPlanPromptBuilder` usa `context.planningPeriod()` para escolher o schema de aula única, semana ou mês.
4. `LessonPlanGenerationService` persiste a periodicidade e `includeHeader=false`.
5. Se houver turma, suas necessidades inclusivas alimentam o prompt; se houver item de cronograma, ele recebe o documento concluído.

## Tratamento de erros

A correção não altera a política atual de tentativas da IA nem o tratamento global de exceções. O objetivo é eliminar as incompatibilidades de compilação e garantir que a validação do schema do banco passe após a migração.

## Testes

- Um teste de geração capturará o `GenerationRequest` salvo e verificará `planningPeriod` e `includeHeader=false`.
- Os testes do prompt cobrirão o accessor do record por meio dos cenários de periodicidade existentes ou ampliados.
- Um teste do frontend verificará que o controle de cabeçalho não é oferecido para `LESSON_PLAN` e que o payload usa `includeHeader=false`.
- A verificação final executará a compilação e as suítes de backend e frontend relevantes.

## Fora de escopo

- Adicionar `classroom_id` ou `timeline_item_id` a `generation_requests`.
- Remover o cabeçalho escolar dos demais tipos de documento.
- Alterar o formato visual dos planos semanais ou mensais.
