# Complete Lesson Kit Design

## Goal

Turn the current `LESSON_PLAN` generator into a stronger product differentiator: a complete classroom kit that gives the teacher a validated lesson plan plus practical materials for applying, assessing, and evidencing the lesson.

The product promise is:

> Generate a BNCC-validated lesson plan with student activity, answer key, assessment instrument, pedagogical evidence, and inclusive adaptations ready for classroom use and coordination review.

## Scope

This design applies only to `DocumentType.LESSON_PLAN`.

The existing official lesson plan template remains intact. The printed plan still has exactly these seven public sections:

1. Tema
2. Objetivos de Aprendizagem
3. Conteudo
4. Metodologia
5. Recursos Didaticos
6. Avaliacao
7. Tempo Estimado

The complete lesson kit is an additional structured block saved with the canonical lesson plan JSON and rendered separately in the frontend and DOCX export.

## Core Rule

The AI still does not own document structure.

The system owns:

- Official lesson plan sections.
- Complete lesson kit sections.
- Topic, subject, grade, BNCC skills, and total duration.
- Public rendering order.
- DOCX and print layout.

The AI only fills approved content fields inside a strict schema.

## Product Outcome

After generating a lesson plan, the teacher receives:

- The official lesson plan for coordination.
- A student-facing activity.
- A teacher answer key or expected responses.
- An assessment instrument.
- Pedagogical evidence suggestions.
- Inclusive adaptations for students with learning difficulties.

This differentiates the product from generic plan generators because the result is not only a plan. It is a classroom-ready package.

## Canonical Kit Model

Add a strict extension to the lesson plan content:

```java
public record LessonPlanContent(
        List<String> objectives,
        List<String> contents,
        Methodology methodology,
        List<String> resources,
        Evaluation evaluation,
        CompleteLessonKit kit
) {}

public record CompleteLessonKit(
        StudentActivity studentActivity,
        TeacherAnswerKey teacherAnswerKey,
        AssessmentInstrument assessmentInstrument,
        PedagogicalEvidence pedagogicalEvidence,
        InclusiveAdaptations inclusiveAdaptations
) {}

public record StudentActivity(
        String title,
        String context,
        List<String> instructions,
        List<String> questions,
        String expectedProduct
) {}

public record TeacherAnswerKey(
        List<String> expectedAnswers,
        List<String> teacherGuidance
) {}

public record AssessmentInstrument(
        List<String> criteria,
        List<String> evidenceCollection
) {}

public record PedagogicalEvidence(
        List<String> observableEvidences,
        List<String> recordsForCoordination
) {}

public record InclusiveAdaptations(
        List<String> readingSupport,
        List<String> participationSupport,
        List<String> simplifiedAlternatives
) {}
```

All fields are required for `LESSON_PLAN` once the feature is enabled.

## Saved Content Shape

The assembled `Document.content` for `LESSON_PLAN` keeps the existing official fields and adds `kitAulaCompleta`:

```json
{
  "tema": "Segunda Guerra Mundial",
  "disciplina": "Historia",
  "ano": "6 ano",
  "habilidadesBncc": [
    {
      "codigo": "EF06HI01",
      "descricao": "Identificar diferentes formas de compreensao da nocao de tempo e de periodizacao dos processos historicos"
    }
  ],
  "objetivosDeAprendizagem": ["Identificar formas de organizacao do tempo historico usando eventos da Segunda Guerra Mundial"],
  "conteudo": ["Linha do tempo da Segunda Guerra Mundial"],
  "metodologia": {
    "introducao": {
      "tempoMinutos": 10,
      "descricao": "Apresentar uma pergunta disparadora sobre como organizar acontecimentos historicos no tempo"
    },
    "desenvolvimento": {
      "tempoMinutos": 30,
      "descricao": "Organizar cartoes com eventos da Segunda Guerra Mundial em uma linha do tempo coletiva"
    },
    "fechamento": {
      "tempoMinutos": 10,
      "descricao": "Retomar as ideias de continuidade e ruptura a partir das producoes dos grupos"
    }
  },
  "recursosDidaticos": ["Cartoes com eventos", "Quadro branco"],
  "avaliacao": {
    "criteriosObservaveis": ["Organiza eventos em ordem cronologica"]
  },
  "tempoEstimado": {
    "introducao": 10,
    "desenvolvimento": 30,
    "fechamento": 10,
    "total": 50
  },
  "kitAulaCompleta": {
    "atividadeAluno": {
      "titulo": "Linha do tempo da Segunda Guerra Mundial",
      "contexto": "Nesta atividade, voce vai organizar eventos para compreender o tempo historico.",
      "orientacoes": ["Leia os cartoes com atencao", "Organize os eventos em ordem cronologica"],
      "questoes": ["Qual evento veio primeiro?", "Qual evento representa uma ruptura historica?"],
      "produtoEsperado": "Painel com linha do tempo e breve explicacao coletiva"
    },
    "gabaritoProfessor": {
      "respostasEsperadas": ["Os alunos devem ordenar os eventos por data aproximada"],
      "orientacoesProfessor": ["Valorize justificativas simples e coerentes"]
    },
    "instrumentoAvaliativo": {
      "criterios": ["Ordena eventos com coerencia", "Explica continuidade e ruptura"],
      "coletaEvidencias": ["Fotografar painel", "Guardar texto coletivo"]
    },
    "evidenciasPedagogicas": {
      "evidenciasObservaveis": ["Participacao na discussao em grupo"],
      "registrosParaCoordenacao": ["Painel produzido", "Anotacoes do professor"]
    },
    "adaptacoesInclusivas": {
      "apoioLeitura": ["Usar cartoes com frases curtas"],
      "apoioParticipacao": ["Permitir resposta oral em dupla"],
      "alternativasSimplificadas": ["Organizar menos cartoes com apoio visual"]
    }
  }
}
```

The saved JSON may include `habilidadesBncc` and `kitAulaCompleta` for API/rendering, but public print/DOCX layout controls what appears in each output.

## Prompt Changes

`LessonPlanPromptBuilder` will instruct the AI to return one strict JSON object with:

- Existing fields: `objectives`, `contents`, `methodology`, `resources`, `evaluation`.
- New field: `kit`.

The prompt must require:

- Student activity tied directly to the selected topic and BNCC skill.
- Clear instructions students can follow without extra teacher rewriting.
- Expected answers or response guidance for the teacher.
- Assessment criteria based on observable evidence.
- Inclusive adaptations that are practical in a normal classroom.
- No emojis, markdown, technical keys, links, site names, or provider metadata.

Additional teacher instructions remain low priority and cannot override system-owned fields or schema.

## Parser Changes

`LessonPlanAiParser` will parse the expanded schema into the new records.

Parser rules:

- Reject unknown top-level fields.
- Reject missing kit fields.
- Reject blank strings.
- Reject empty lists.
- Reject technical keys such as `code`, `description` outside approved locations, `stage`, `question_number`, `tempo_sugerido`, `metadata`, `site`, `url`, or `link`.
- Preserve the current strict behavior for the official lesson plan fields.

## Validator Changes

### TemplateValidator

Keep all current official lesson plan validations.

Add kit validations:

- Student activity must have title, context, at least 3 instructions, at least 3 questions, and expected product.
- Teacher answer key must have at least 3 expected answers and at least 2 teacher guidance items.
- Assessment instrument must have at least 3 observable criteria and at least 2 evidence collection items.
- Pedagogical evidence must have at least 3 observable evidences and at least 2 coordination records.
- Inclusive adaptations must include reading support, participation support, and simplified alternatives, with at least 2 items each.

### TopicAlignmentValidator

Include the complete lesson kit in topic alignment scoring. A kit that drifts from the selected topic must trigger regeneration.

### QualityValidator

Add kit usefulness into `pedagogicalQuality` and `clarity` scoring:

- The activity must be usable in class.
- The answer key must help the teacher correct or mediate.
- The evidence must be suitable for coordination.
- Adaptations must be concrete, not generic.

## Assembly Changes

`LessonPlanAssembler` remains the only component that creates final saved JSON.

It will:

- Continue inserting topic, grade, subject, BNCC skills, and duration from system-owned data.
- Insert `kitAulaCompleta` from validated AI content.
- Use Portuguese public keys in the assembled JSON.
- Exclude provider metadata and internal validator scores.

## DOCX Output

The default DOCX export for `LESSON_PLAN` should become the complete kit export because that is the product differentiator.

DOCX layout:

1. Plano de Aula
   - Render the official seven-section plan.
2. Atividade do Aluno
   - Student-facing activity.
3. Gabarito do Professor
   - Expected answers and guidance.
4. Instrumento Avaliativo
   - Criteria and evidence collection.
5. Evidencias Pedagogicas
   - Observable evidence and records for coordination.
6. Adaptacoes Inclusivas
   - Practical adaptations.

No site URL, frontend route, raw JSON, code block, `question_number`, `tempo_sugerido`, or technical metadata may appear in the DOCX.

## Frontend Output

The document view should render the complete kit with tabs or grouped sections:

- Plano
- Atividade
- Gabarito
- Avaliacao
- Evidencias
- Adaptacoes

Print behavior:

- Print only the document content.
- Hide sidebar, header, navigation, buttons, and app chrome.
- Never print the site URL as part of app-rendered content.

Browser-generated print headers/footers are controlled by the user's browser settings and cannot be fully disabled by the app, but the app must not render any visible site link in the printable document.

## API Compatibility

No new endpoint is required for the MVP.

The existing `POST /documents/generate` remains the entry point. For `LESSON_PLAN`, it now generates the complete kit as part of the saved content.

The existing `GET /documents/{id}` returns the expanded content JSON.

The existing `GET /documents/{id}/export.docx` exports the complete kit for lesson plans.

## Error Handling

Regenerate when:

- The AI omits the kit.
- Any kit section fails schema validation.
- Kit content is generic or unrelated to the selected topic.
- Kit content contains technical artifacts.
- Kit content lowers quality score below 90.

If all attempts fail, return the existing AI/provider generation error and do not save the document.

## Testing

Implementation must use TDD.

Required backend tests:

- Parser accepts complete lesson kit schema.
- Parser rejects missing kit fields.
- Parser rejects technical artifact keys in the kit.
- Template validator enforces kit minimums.
- Topic alignment catches unrelated activity content.
- Assembler includes `kitAulaCompleta` with Portuguese keys.
- Generation service regenerates when kit is invalid.
- DOCX export includes plan plus kit sections.
- DOCX export excludes site URL, raw JSON, technical fields, and internal artifacts.
- Existing lesson plan tests continue passing.

Required frontend tests or scripts:

- Rendering utility builds printable sections for `kitAulaCompleta`.
- Document view can render old lesson plans without a kit.
- Document view can render new complete kits.
- Print CSS hides navigation/app chrome.

Required verification:

- Backend: `.\mvnw.cmd test` with Java 21.
- Frontend: `npm run lint` and `npm run build`.

## Non-Goals

- Do not add payments or pricing in this feature.
- Do not create separate documents for activity, answer key, or assessment.
- Do not add a second AI call for kit generation.
- Do not redesign `EXAM`, `RUBRIC`, or `REPORT`.
- Do not expose validator internals in the printed document.
- Do not require database schema changes for the MVP.

## Rollout Notes

Old lesson plans without `kitAulaCompleta` must still render and export using the existing official lesson plan behavior.

New lesson plans should include the complete kit by default. This makes the feature immediately visible without adding another wizard step.

The frontend may later add a toggle such as `Gerar Kit Aula Completa`, but the MVP treats the kit as the default premium-quality output for every lesson plan.
