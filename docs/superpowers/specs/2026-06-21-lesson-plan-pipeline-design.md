# Lesson Plan Pipeline Reform Design

## Goal

Rebuild only the `LESSON_PLAN` generation pipeline so lesson plans are structured by the system, not by the AI. The final document must be professional, printable, aligned with the user-selected subject, grade, BNCC skills, topic, and duration, and safe for delivery to school coordination, direction, or supervision.

## Scope

This design applies only to `DocumentType.LESSON_PLAN`.

The existing flows for `EXAM`, `RUBRIC`, and `REPORT` stay on the current generic prompt and document generation path until a separate reform is requested.

## Core Rule

The AI is not responsible for document structure.

The system owns:

- Document sections.
- Topic.
- Subject.
- Grade.
- BNCC skills.
- Total duration.
- Methodology stage names.
- Final rendered document layout.

The AI may provide only the internal pedagogical content requested by the system.

## Official Lesson Plan Template

Every final lesson plan must contain exactly these seven public sections:

1. Tema
2. Objetivos de Aprendizagem
3. Conteudo
4. Metodologia
5. Recursos Didaticos
6. Avaliacao
7. Tempo Estimado

No extra public sections may be rendered in the final response or DOCX.

## Canonical Content Model

The lesson plan pipeline uses a strict internal model for AI-generated content:

```java
public record LessonPlanContent(
        List<String> objectives,
        List<String> contents,
        Methodology methodology,
        List<String> resources,
        Evaluation evaluation
) {}

public record Methodology(
        LessonStage introduction,
        LessonStage development,
        LessonStage closing
) {}

public record LessonStage(
        Integer durationMinutes,
        String description
) {}

public record Evaluation(
        List<String> observableCriteria
) {}
```

The model intentionally excludes topic, subject, grade, BNCC skills, document type, title, total duration, and any technical metadata.

## Pipeline

The `LESSON_PLAN` generation flow is:

1. `DocumentService` receives `GenerateDocumentRequest`.
2. `RequestValidator` validates required fields and basic duration rules.
3. `BNCCService` loads selected BNCC skills by ID.
4. `BnccCompatibilityValidator` verifies every selected skill against the selected grade and subject.
5. `LessonPlanPromptBuilder` builds a constrained prompt for internal content only.
6. `AIService` calls the configured providers.
7. `LessonPlanAiParser` parses a strict JSON object into `LessonPlanContent`.
8. `TemplateValidator` enforces deterministic template rules.
9. `TopicAlignmentValidator` checks that generated content remains aligned with the exact user topic.
10. `QualityValidator` returns a detailed score.
11. If validation fails or `finalScore < 90`, regenerate automatically up to the configured attempt limit.
12. `LessonPlanAssembler` builds the final canonical JSON using system-owned fields plus approved AI content.
13. `DocumentRepository` saves only validated content.
14. `DocumentGeneratorService` renders the official lesson plan template for DOCX export.

## Components

### RequestValidator

Responsibilities:

- Run only for `DocumentType.LESSON_PLAN`.
- Require non-blank `topic`, `grade`, `subject`, and `duration`.
- Trim all user-owned fields before downstream use.
- Parse `duration` into integer minutes.
- Reject duration values that cannot support the required lesson stages.
- Reject missing or empty BNCC ID selections.

Duration rules:

- The accepted input may be text such as `50 minutos` or a numeric minute string.
- The normalized total is stored as minutes and rendered as `Total: X min`.
- The total must allow introduction, development, and closing within the required ranges.

### BnccCompatibilityValidator

Responsibilities:

- Confirm each selected BNCC skill belongs to the selected subject.
- Confirm each selected BNCC skill is compatible with the selected grade.
- Reject mismatches before calling the AI.
- Return a clear validation error that names the incompatible BNCC code.

Compatibility uses normalized comparisons so variants such as accents, case, and ordinal symbols do not create false mismatches. Ensino Medio ranges remain valid for Ensino Medio selections.

### LessonPlanPromptBuilder

Responsibilities:

- Build a dedicated prompt for `LESSON_PLAN`.
- Provide selected BNCC codes and descriptions as context.
- Tell the AI to return only the strict internal content JSON.
- Forbid the AI from changing topic, subject, grade, BNCC skills, or total duration.
- Include quality instructions for observable objectives, coherent content, active methodology, relevant resources, and observable assessment criteria.

The prompt must not ask the AI to create final document sections. It only asks for values that fill `LessonPlanContent`.

### LessonPlanAiParser

Responsibilities:

- Extract and parse JSON from provider output.
- Accept only the canonical schema.
- Reject unknown top-level fields.
- Reject missing fields.
- Reject wrong field types.
- Reject blank strings and empty required lists.
- Reject any technical keys such as `code`, `description`, `stage`, `question_number`, or internal provider artifacts.

### TemplateValidator

Responsibilities:

- Require 3 to 5 objectives.
- Require objectives to begin with observable verbs.
- Require at least 3 content items.
- Require methodology to contain introduction, development, and closing.
- Require introduction duration between 5 and 15 minutes.
- Require development duration between 20 and 40 minutes.
- Require closing duration between 5 and 15 minutes.
- Require stage duration sum to exactly match the user-selected total.
- Require at least 3 resources.
- Require at least 3 observable evaluation criteria.
- Reject evaluation criteria that are only generic participation statements.

### TopicAlignmentValidator

Responsibilities:

- Compare the exact user-selected topic with generated objectives, content, methodology, resources, and evaluation criteria.
- Return an integer topic alignment score from 0 to 100.
- Reject content when `topicAlignment < 90`.

This validator is the anti-hallucination guard. It must catch cases where the user asks for one topic and the generated content drifts into another.

The first implementation uses deterministic lexical checks and subject-specific keyword overlap. A secondary AI evaluation call is out of scope for this implementation and requires a separate design if deterministic checks prove insufficient in production.

### QualityValidator

Responsibilities:

- Combine deterministic validation results and quality heuristics into a detailed score.
- Reject plans with `finalScore < 90`.
- Preserve failure reasons for logs and regeneration decisions.

The score model is:

```java
public record QualityScore(
        Integer structure,
        Integer bnccAlignment,
        Integer topicAlignment,
        Integer pedagogicalQuality,
        Integer clarity,
        Integer finalScore
) {}
```

Score meanings:

- `structure`: compliance with the official model and template constraints.
- `bnccAlignment`: compatibility with selected BNCC skills.
- `topicAlignment`: adherence to the exact user-selected topic.
- `pedagogicalQuality`: classroom usefulness, age appropriateness, and concrete learning flow.
- `clarity`: professional language, direct instructions, and print-ready readability.
- `finalScore`: weighted total used for acceptance or regeneration.

### LessonPlanAssembler

Responsibilities:

- Build the saved canonical final JSON.
- Insert topic, subject, grade, BNCC skills, and duration from system-owned data only.
- Insert AI-approved internal content from `LessonPlanContent`.
- Exclude all technical metadata from public document content.
- Ensure the final `Tema` value exactly equals the user-provided topic after trimming.

The assembler is the only component allowed to create the final lesson plan representation.

### DocumentGeneratorService

Responsibilities:

- Detect `DocumentType.LESSON_PLAN`.
- Render the official seven-section lesson plan template.
- Use the canonical final JSON assembled by the system.
- Never render raw AI JSON, internal keys, provider metadata, or unsupported sections.
- Preserve existing export behavior for `EXAM`, `RUBRIC`, and `REPORT`.

## Regeneration Policy

The service attempts generation up to 3 times for `LESSON_PLAN`.

A retry is required when:

- The AI response cannot be parsed into `LessonPlanContent`.
- The parser finds unknown or missing fields.
- `TemplateValidator` fails.
- `TopicAlignmentValidator` returns a score below 90.
- `QualityValidator` returns `finalScore < 90`.
- The final assembled document diverges from system-owned topic, subject, grade, BNCC skills, or duration.

If all attempts fail, the service returns a provider/generation error and does not save a document or increment usage.

## Saved Content Shape

The saved `Document.content` for `LESSON_PLAN` should be a clean canonical JSON object suitable for API clients and DOCX export:

```json
{
  "tema": "Segunda Guerra Mundial",
  "disciplina": "Historia",
  "ano": "9 ano",
  "habilidadesBncc": [
    {
      "codigo": "EF09HI13",
      "descricao": "..."
    }
  ],
  "objetivosDeAprendizagem": [
    "Analisar..."
  ],
  "conteudo": [
    "Contexto historico da Segunda Guerra Mundial"
  ],
  "metodologia": {
    "introducao": {
      "tempoMinutos": 10,
      "descricao": "..."
    },
    "desenvolvimento": {
      "tempoMinutos": 30,
      "descricao": "..."
    },
    "fechamento": {
      "tempoMinutos": 10,
      "descricao": "..."
    }
  },
  "recursosDidaticos": [
    "Mapas"
  ],
  "avaliacao": {
    "criteriosObservaveis": [
      "Relaciona causas e consequencias do conflito"
    ]
  },
  "tempoEstimado": {
    "introducao": 10,
    "desenvolvimento": 30,
    "fechamento": 10,
    "total": 50
  }
}
```

This JSON is internal API content, not the printed DOCX layout. It must still be clean and free of provider artifacts.

## DOCX Output

The DOCX output for `LESSON_PLAN` renders only:

```text
PLANO DE AULA

Tema:
[exact user topic]

Objetivos de Aprendizagem:
- ...

Conteudo:
- ...

Metodologia:
Introducao ([X] min):
...

Desenvolvimento ([X] min):
...

Fechamento ([X] min):
...

Recursos Didaticos:
- ...

Avaliacao:
- ...

Tempo Estimado:
Introducao: X min
Desenvolvimento: X min
Fechamento: X min
Total: X min
```

The DOCX may include neutral institutional header lines such as school, teacher, class, and date, as long as they are not counted as lesson plan sections and do not expose internal data.

## Validation Before Save

Before saving a `LESSON_PLAN`, the service must validate:

- Subject equals the user-selected subject.
- Grade equals the user-selected grade.
- Topic equals the user-selected topic.
- BNCC skills equal the selected IDs loaded from the database.
- Total duration equals the user-selected duration in minutes.
- Methodology stage sum equals total duration.
- Final public sections match the official seven-section template.

If any check fails, the document is invalid and must be regenerated.

## Tests

Implementation must use TDD.

Required test coverage:

- Request validation rejects missing topic, grade, subject, duration, and BNCC IDs for `LESSON_PLAN`.
- BNCC compatibility rejects grade and subject mismatches.
- Prompt builder excludes system-owned fields from AI-controlled output schema.
- Parser rejects extra fields and missing fields.
- Template validator enforces objective count, methodology stages, duration ranges, duration sum, content count, resource count, and observable assessment criteria.
- Topic alignment validator rejects unrelated generated content.
- Quality validator produces detailed scores and rejects below 90.
- Document service regenerates invalid `LESSON_PLAN` output and saves only valid output.
- Document service does not increment usage when all generation attempts fail.
- DOCX export renders only the official lesson plan sections for `LESSON_PLAN`.
- Existing `EXAM`, `RUBRIC`, and `REPORT` tests continue passing on their current flow.

## Non-Goals

- Do not redesign exam, rubric, or report generation.
- Do not add frontend changes in this scope.
- Do not change the database schema unless implementation reveals that existing `GenerationRequest` and `Document.content` fields cannot support the canonical JSON.
- Do not expose quality score internals in the printed document.
- Do not rely only on prompt instructions for structural correctness.

## Open Decisions Resolved

- The reform applies only to `LESSON_PLAN`.
- The strict content model uses nested methodology and evaluation objects.
- BNCC compatibility is a separate validator.
- Topic alignment is a separate anti-hallucination validator.
- Quality score is detailed, not a single opaque number.
- The assembler owns all system fields in the final document.
