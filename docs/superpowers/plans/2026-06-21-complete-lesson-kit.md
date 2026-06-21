# Complete Lesson Kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend only `LESSON_PLAN` so every new lesson plan includes a classroom-ready complete kit with student activity, answer key, assessment instrument, pedagogical evidence, and inclusive adaptations.

**Architecture:** Keep the official seven-section lesson plan intact and add a strict `kit` object to the internal AI schema. The backend validates, assembles, persists, and exports the kit as `kitAulaCompleta`; the frontend renders old plans without a kit and new plans with grouped kit sections.

**Tech Stack:** Java 21, Spring Boot 3.3.5, Jackson, Apache POI, JUnit 5, AssertJ, Mockito, Maven wrapper, Next.js 16, React 19, TypeScript, Node script tests, ESLint.

---

## Repositories

Backend root:

```text
C:\Users\joaoh\OneDrive\Área de Trabalho\Documentos\gestor-aulas
```

Frontend root:

```text
C:\Users\joaoh\OneDrive\Área de Trabalho\Documentos\eduDocs-frotend\edudocs-frontend
```

Preserve unrelated dirty changes in both repositories. Before every commit, run `git status --short` and stage only files listed in the task.

Backend Maven commands must use Java 21:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'; $env:Path="$env:JAVA_HOME\bin;$env:Path"; .\mvnw.cmd '-Dtest=ClassName' test
```

## File Structure

Backend creates:

- `src/main/java/br/com/edudocsai/service/lessonplan/CompleteLessonKit.java`
- `src/main/java/br/com/edudocsai/service/lessonplan/StudentActivity.java`
- `src/main/java/br/com/edudocsai/service/lessonplan/TeacherAnswerKey.java`
- `src/main/java/br/com/edudocsai/service/lessonplan/AssessmentInstrument.java`
- `src/main/java/br/com/edudocsai/service/lessonplan/PedagogicalEvidence.java`
- `src/main/java/br/com/edudocsai/service/lessonplan/InclusiveAdaptations.java`

Backend modifies:

- `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanContent.java`
- `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanAiParser.java`
- `src/main/java/br/com/edudocsai/service/lessonplan/TemplateValidator.java`
- `src/main/java/br/com/edudocsai/service/lessonplan/TopicAlignmentValidator.java`
- `src/main/java/br/com/edudocsai/service/lessonplan/QualityValidator.java`
- `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanPromptBuilder.java`
- `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanAssembler.java`
- `src/main/java/br/com/edudocsai/service/DocumentGeneratorService.java`

Backend tests modify:

- `src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanAiParserTest.java`
- `src/test/java/br/com/edudocsai/service/lessonplan/TemplateValidatorTest.java`
- `src/test/java/br/com/edudocsai/service/lessonplan/TopicAlignmentValidatorTest.java`
- `src/test/java/br/com/edudocsai/service/lessonplan/QualityValidatorTest.java`
- `src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanPromptBuilderTest.java`
- `src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanAssemblerTest.java`
- `src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanGenerationServiceTest.java`
- `src/test/java/br/com/edudocsai/service/DocumentGeneratorServiceTest.java`

Frontend creates or modifies:

- `src/lib/document-rendering.ts`
- `scripts/document-rendering.test.mjs`
- `src/app/dashboard/document/[id]/page.tsx`
- `src/app/globals.css`

## Task 1: Backend Kit Records And Parser Schema

**Files:**
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/CompleteLessonKit.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/StudentActivity.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/TeacherAnswerKey.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/AssessmentInstrument.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/PedagogicalEvidence.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/InclusiveAdaptations.java`
- Modify: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanContent.java`
- Modify: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanAiParser.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanAiParserTest.java`

- [ ] **Step 1: Add failing parser tests for valid kit and missing kit**

Add these tests to `LessonPlanAiParserTest`:

```java
@Test
void parsesCompleteLessonKit() {
    LessonPlanContent result = parser.parse(validJsonWithKit());

    assertThat(result.kit().studentActivity().title())
            .isEqualTo("Linha do tempo da Segunda Guerra Mundial");
    assertThat(result.kit().studentActivity().instructions())
            .contains("Leia os cartoes com atencao");
    assertThat(result.kit().teacherAnswerKey().expectedAnswers())
            .contains("Os eventos devem estar em ordem cronologica aproximada");
    assertThat(result.kit().assessmentInstrument().criteria())
            .contains("Ordena eventos com coerencia temporal");
    assertThat(result.kit().pedagogicalEvidence().recordsForCoordination())
            .contains("Painel produzido pelo grupo");
    assertThat(result.kit().inclusiveAdaptations().readingSupport())
            .contains("Usar cartoes com frases curtas");
}

@Test
void rejectsMissingCompleteLessonKit() {
    assertThatThrownBy(() -> parser.parse(validJsonWithoutKit()))
            .isInstanceOf(LessonPlanValidationException.class)
            .hasMessageContaining("kit");
}
```

Add this helper to the test class:

```java
private String validJsonWithKit() {
    return """
            {
              "objectives": ["Identificar eventos da Segunda Guerra Mundial", "Comparar continuidades e rupturas historicas", "Relacionar cronologia e tempo historico"],
              "contents": ["Linha do tempo da Segunda Guerra Mundial", "Continuidades e rupturas", "Organizacao cronologica de eventos"],
              "methodology": {
                "introduction": {"durationMinutes": 10, "description": "Apresentar pergunta disparadora sobre organizacao do tempo historico"},
                "development": {"durationMinutes": 30, "description": "Organizar cartoes de eventos da Segunda Guerra Mundial em grupos"},
                "closing": {"durationMinutes": 10, "description": "Socializar conclusoes sobre continuidade e ruptura"}
              },
              "resources": ["Cartoes de eventos", "Quadro branco", "Imagens historicas"],
              "evaluation": {"observableCriteria": ["Identifica eventos historicos", "Relaciona continuidade e ruptura", "Registra justificativas cronologicas"]},
              "kit": {
                "studentActivity": {
                  "title": "Linha do tempo da Segunda Guerra Mundial",
                  "context": "Nesta atividade, voce vai organizar eventos para compreender o tempo historico.",
                  "instructions": ["Leia os cartoes com atencao", "Organize os eventos em ordem cronologica", "Explique uma continuidade e uma ruptura"],
                  "questions": ["Qual evento veio primeiro?", "Qual evento representa uma ruptura?", "Como a ordem dos fatos ajuda a entender a historia?"],
                  "expectedProduct": "Painel com linha do tempo e breve explicacao coletiva"
                },
                "teacherAnswerKey": {
                  "expectedAnswers": ["Os eventos devem estar em ordem cronologica aproximada", "A ruptura deve indicar uma mudanca historica relevante", "A continuidade deve indicar permanencias entre eventos"],
                  "teacherGuidance": ["Aceite justificativas simples quando coerentes", "Peça que os alunos expliquem a ordem escolhida"]
                },
                "assessmentInstrument": {
                  "criteria": ["Ordena eventos com coerencia temporal", "Explica continuidade e ruptura", "Participa da producao coletiva"],
                  "evidenceCollection": ["Fotografar painel", "Guardar texto coletivo"]
                },
                "pedagogicalEvidence": {
                  "observableEvidences": ["Discussao em grupo sobre eventos", "Organizacao correta dos cartoes", "Apresentacao oral do raciocinio"],
                  "recordsForCoordination": ["Painel produzido pelo grupo", "Anotacoes do professor"]
                },
                "inclusiveAdaptations": {
                  "readingSupport": ["Usar cartoes com frases curtas", "Oferecer leitura compartilhada"],
                  "participationSupport": ["Permitir resposta oral em dupla", "Distribuir papeis no grupo"],
                  "simplifiedAlternatives": ["Reduzir a quantidade de cartoes", "Usar imagens junto aos eventos"]
                }
              }
            }
            """;
}

private String validJsonWithoutKit() {
    return validJsonWithKit().replaceAll(",\\s*\\\"kit\\\"\\s*:\\s*\\{[\\s\\S]*\\}\\s*\\}\\s*$", "\\n}");
}
```

- [ ] **Step 2: Run parser tests and verify RED**

Run:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'; $env:Path="$env:JAVA_HOME\bin;$env:Path"; .\mvnw.cmd '-Dtest=LessonPlanAiParserTest#parsesCompleteLessonKit,LessonPlanAiParserTest#rejectsMissingCompleteLessonKit' test
```

Expected: compilation fails because `LessonPlanContent.kit()` and kit records do not exist, or test fails because `kit` is rejected as unknown.

- [ ] **Step 3: Add kit records**

Create `CompleteLessonKit.java`:

```java
package br.com.edudocsai.service.lessonplan;

public record CompleteLessonKit(
        StudentActivity studentActivity,
        TeacherAnswerKey teacherAnswerKey,
        AssessmentInstrument assessmentInstrument,
        PedagogicalEvidence pedagogicalEvidence,
        InclusiveAdaptations inclusiveAdaptations
) {
}
```

Create `StudentActivity.java`:

```java
package br.com.edudocsai.service.lessonplan;

import java.util.List;

public record StudentActivity(
        String title,
        String context,
        List<String> instructions,
        List<String> questions,
        String expectedProduct
) {
}
```

Create `TeacherAnswerKey.java`:

```java
package br.com.edudocsai.service.lessonplan;

import java.util.List;

public record TeacherAnswerKey(
        List<String> expectedAnswers,
        List<String> teacherGuidance
) {
}
```

Create `AssessmentInstrument.java`:

```java
package br.com.edudocsai.service.lessonplan;

import java.util.List;

public record AssessmentInstrument(
        List<String> criteria,
        List<String> evidenceCollection
) {
}
```

Create `PedagogicalEvidence.java`:

```java
package br.com.edudocsai.service.lessonplan;

import java.util.List;

public record PedagogicalEvidence(
        List<String> observableEvidences,
        List<String> recordsForCoordination
) {
}
```

Create `InclusiveAdaptations.java`:

```java
package br.com.edudocsai.service.lessonplan;

import java.util.List;

public record InclusiveAdaptations(
        List<String> readingSupport,
        List<String> participationSupport,
        List<String> simplifiedAlternatives
) {
}
```

Modify `LessonPlanContent.java`:

```java
package br.com.edudocsai.service.lessonplan;

import java.util.List;

public record LessonPlanContent(
        List<String> objectives,
        List<String> contents,
        Methodology methodology,
        List<String> resources,
        Evaluation evaluation,
        CompleteLessonKit kit
) {
}
```

- [ ] **Step 4: Update parser allowed fields and kit validation**

In `LessonPlanAiParser`, update sets:

```java
private static final Set<String> ROOT_FIELDS = Set.of("objectives", "contents", "methodology", "resources", "evaluation", "kit");
private static final Set<String> KIT_FIELDS = Set.of("studentActivity", "teacherAnswerKey", "assessmentInstrument", "pedagogicalEvidence", "inclusiveAdaptations");
private static final Set<String> STUDENT_ACTIVITY_FIELDS = Set.of("title", "context", "instructions", "questions", "expectedProduct");
private static final Set<String> TEACHER_ANSWER_KEY_FIELDS = Set.of("expectedAnswers", "teacherGuidance");
private static final Set<String> ASSESSMENT_INSTRUMENT_FIELDS = Set.of("criteria", "evidenceCollection");
private static final Set<String> PEDAGOGICAL_EVIDENCE_FIELDS = Set.of("observableEvidences", "recordsForCoordination");
private static final Set<String> INCLUSIVE_ADAPTATIONS_FIELDS = Set.of("readingSupport", "participationSupport", "simplifiedAlternatives");
```

After evaluation validation in `parse`, add:

```java
JsonNode kit = require(root, "kit");
requireKit(kit);
```

Add helper methods:

```java
private void requireKit(JsonNode kit) {
    rejectUnknownFields(kit, KIT_FIELDS, "kit");
    requireStudentActivity(require(kit, "studentActivity"), "kit.studentActivity");
    requireTeacherAnswerKey(require(kit, "teacherAnswerKey"), "kit.teacherAnswerKey");
    requireAssessmentInstrument(require(kit, "assessmentInstrument"), "kit.assessmentInstrument");
    requirePedagogicalEvidence(require(kit, "pedagogicalEvidence"), "kit.pedagogicalEvidence");
    requireInclusiveAdaptations(require(kit, "inclusiveAdaptations"), "kit.inclusiveAdaptations");
}

private void requireStudentActivity(JsonNode node, String path) {
    rejectUnknownFields(node, STUDENT_ACTIVITY_FIELDS, path);
    requireText(require(node, "title", path + ".title"), path + ".title");
    requireText(require(node, "context", path + ".context"), path + ".context");
    requireStringList(node, "instructions", path + ".instructions");
    requireStringList(node, "questions", path + ".questions");
    requireText(require(node, "expectedProduct", path + ".expectedProduct"), path + ".expectedProduct");
}

private void requireTeacherAnswerKey(JsonNode node, String path) {
    rejectUnknownFields(node, TEACHER_ANSWER_KEY_FIELDS, path);
    requireStringList(node, "expectedAnswers", path + ".expectedAnswers");
    requireStringList(node, "teacherGuidance", path + ".teacherGuidance");
}

private void requireAssessmentInstrument(JsonNode node, String path) {
    rejectUnknownFields(node, ASSESSMENT_INSTRUMENT_FIELDS, path);
    requireStringList(node, "criteria", path + ".criteria");
    requireStringList(node, "evidenceCollection", path + ".evidenceCollection");
}

private void requirePedagogicalEvidence(JsonNode node, String path) {
    rejectUnknownFields(node, PEDAGOGICAL_EVIDENCE_FIELDS, path);
    requireStringList(node, "observableEvidences", path + ".observableEvidences");
    requireStringList(node, "recordsForCoordination", path + ".recordsForCoordination");
}

private void requireInclusiveAdaptations(JsonNode node, String path) {
    rejectUnknownFields(node, INCLUSIVE_ADAPTATIONS_FIELDS, path);
    requireStringList(node, "readingSupport", path + ".readingSupport");
    requireStringList(node, "participationSupport", path + ".participationSupport");
    requireStringList(node, "simplifiedAlternatives", path + ".simplifiedAlternatives");
}
```

- [ ] **Step 5: Run parser tests and verify GREEN**

Run:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'; $env:Path="$env:JAVA_HOME\bin;$env:Path"; .\mvnw.cmd '-Dtest=LessonPlanAiParserTest' test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 6: Commit parser and records**

Run:

```powershell
git add src/main/java/br/com/edudocsai/service/lessonplan/CompleteLessonKit.java src/main/java/br/com/edudocsai/service/lessonplan/StudentActivity.java src/main/java/br/com/edudocsai/service/lessonplan/TeacherAnswerKey.java src/main/java/br/com/edudocsai/service/lessonplan/AssessmentInstrument.java src/main/java/br/com/edudocsai/service/lessonplan/PedagogicalEvidence.java src/main/java/br/com/edudocsai/service/lessonplan/InclusiveAdaptations.java src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanContent.java src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanAiParser.java src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanAiParserTest.java
git commit -m "feat: parse complete lesson kit"
```

## Task 2: Backend Kit Template Validation

**Files:**
- Modify: `src/main/java/br/com/edudocsai/service/lessonplan/TemplateValidator.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/TemplateValidatorTest.java`

- [ ] **Step 1: Add failing kit minimum tests**

Add this test to `TemplateValidatorTest`:

```java
@Test
void rejectsCompleteLessonKitWithTooFewStudentQuestions() {
    LessonPlanContent content = validContentWithKit(
            new StudentActivity(
                    "Linha do tempo",
                    "Organize eventos historicos.",
                    List.of("Leia os cartoes", "Ordene os eventos", "Explique sua escolha"),
                    List.of("Qual veio primeiro?", "Qual veio depois?"),
                    "Painel coletivo"
            )
    );

    assertThatThrownBy(() -> validator.validate(content, 50))
            .isInstanceOf(LessonPlanValidationException.class)
            .hasMessageContaining("atividade do aluno");
}
```

Add helper overload:

```java
private LessonPlanContent validContentWithKit(StudentActivity activity) {
    CompleteLessonKit kit = new CompleteLessonKit(
            activity,
            new TeacherAnswerKey(
                    List.of("Resposta esperada 1", "Resposta esperada 2", "Resposta esperada 3"),
                    List.of("Orientar leitura compartilhada", "Valorizar justificativas")
            ),
            new AssessmentInstrument(
                    List.of("Identifica eventos", "Relaciona continuidade", "Registra justificativas"),
                    List.of("Fotografar painel", "Guardar texto coletivo")
            ),
            new PedagogicalEvidence(
                    List.of("Discussao em grupo", "Organizacao dos cartoes", "Apresentacao oral"),
                    List.of("Painel produzido", "Anotacoes do professor")
            ),
            new InclusiveAdaptations(
                    List.of("Cartoes com frases curtas", "Leitura em dupla"),
                    List.of("Resposta oral", "Papeis definidos no grupo"),
                    List.of("Menos cartoes", "Imagens junto aos textos")
            )
    );
    return new LessonPlanContent(
            List.of("Identificar eventos historicos", "Comparar continuidades historicas", "Relacionar fatos historicos"),
            List.of("Evento historico", "Tempo historico", "Continuidade e ruptura"),
            new Methodology(
                    new LessonStage(10, "Pergunta disparadora sobre tempo historico"),
                    new LessonStage(30, "Atividade em grupo com cartoes historicos"),
                    new LessonStage(10, "Sintese coletiva sobre aprendizagem")
            ),
            List.of("Quadro branco", "Cartoes", "Imagens"),
            new Evaluation(List.of("Identifica eventos", "Relaciona fatos", "Registra justificativas")),
            kit
    );
}
```

- [ ] **Step 2: Run validator test and verify RED**

Run:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'; $env:Path="$env:JAVA_HOME\bin;$env:Path"; .\mvnw.cmd '-Dtest=TemplateValidatorTest#rejectsCompleteLessonKitWithTooFewStudentQuestions' test
```

Expected: test fails because kit minimums are not enforced.

- [ ] **Step 3: Implement kit validation**

In `TemplateValidator.validate`, after current official checks, add:

```java
validateKit(content.kit());
```

Add methods:

```java
private void validateKit(CompleteLessonKit kit) {
    if (kit == null) {
        throw new LessonPlanValidationException("Kit aula completa obrigatorio");
    }
    validateStudentActivity(kit.studentActivity());
    requireSize(kit.teacherAnswerKey().expectedAnswers(), 3, Integer.MAX_VALUE, "gabarito respostas esperadas");
    requireSize(kit.teacherAnswerKey().teacherGuidance(), 2, Integer.MAX_VALUE, "gabarito orientacoes professor");
    requireSize(kit.assessmentInstrument().criteria(), 3, Integer.MAX_VALUE, "instrumento avaliativo criterios");
    requireSize(kit.assessmentInstrument().evidenceCollection(), 2, Integer.MAX_VALUE, "instrumento avaliativo evidencias");
    requireSize(kit.pedagogicalEvidence().observableEvidences(), 3, Integer.MAX_VALUE, "evidencias pedagogicas observaveis");
    requireSize(kit.pedagogicalEvidence().recordsForCoordination(), 2, Integer.MAX_VALUE, "registros para coordenacao");
    requireSize(kit.inclusiveAdaptations().readingSupport(), 2, Integer.MAX_VALUE, "adaptacoes apoio leitura");
    requireSize(kit.inclusiveAdaptations().participationSupport(), 2, Integer.MAX_VALUE, "adaptacoes apoio participacao");
    requireSize(kit.inclusiveAdaptations().simplifiedAlternatives(), 2, Integer.MAX_VALUE, "adaptacoes alternativas simplificadas");
}

private void validateStudentActivity(StudentActivity activity) {
    if (activity == null || isBlank(activity.title()) || isBlank(activity.context()) || isBlank(activity.expectedProduct())) {
        throw new LessonPlanValidationException("atividade do aluno invalida");
    }
    requireSize(activity.instructions(), 3, Integer.MAX_VALUE, "atividade do aluno orientacoes");
    requireSize(activity.questions(), 3, Integer.MAX_VALUE, "atividade do aluno questoes");
}

private boolean isBlank(String value) {
    return value == null || value.isBlank();
}
```

- [ ] **Step 4: Run validator tests and verify GREEN**

Run:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'; $env:Path="$env:JAVA_HOME\bin;$env:Path"; .\mvnw.cmd '-Dtest=TemplateValidatorTest' test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 5: Commit validator**

Run:

```powershell
git add src/main/java/br/com/edudocsai/service/lessonplan/TemplateValidator.java src/test/java/br/com/edudocsai/service/lessonplan/TemplateValidatorTest.java
git commit -m "feat: validate complete lesson kit"
```

## Task 3: Prompt, Topic, And Quality Include Kit

**Files:**
- Modify: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanPromptBuilder.java`
- Modify: `src/main/java/br/com/edudocsai/service/lessonplan/TopicAlignmentValidator.java`
- Modify: `src/main/java/br/com/edudocsai/service/lessonplan/QualityValidator.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanPromptBuilderTest.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/TopicAlignmentValidatorTest.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/QualityValidatorTest.java`

- [ ] **Step 1: Add failing prompt test for kit schema**

Add to `LessonPlanPromptBuilderTest`:

```java
@Test
void promptRequiresCompleteLessonKitSchema() {
    String prompt = builder.build(context(), List.of(skill()));

    assertThat(prompt)
            .contains("\"kit\"")
            .contains("\"studentActivity\"")
            .contains("\"teacherAnswerKey\"")
            .contains("\"assessmentInstrument\"")
            .contains("\"pedagogicalEvidence\"")
            .contains("\"inclusiveAdaptations\"")
            .contains("atividade para os alunos")
            .contains("gabarito do professor")
            .contains("evidencias pedagogicas")
            .contains("adaptacoes inclusivas");
}
```

- [ ] **Step 2: Add failing topic alignment test for unrelated kit**

Add to `TopicAlignmentValidatorTest`:

```java
@Test
void scoresLowWhenKitActivityDriftsFromTopic() {
    LessonPlanContent content = contentWithKitActivityTitle("Ciclo da agua e evaporacao");

    int score = validator.score("Segunda Guerra Mundial", content);

    assertThat(score).isLessThan(90);
}
```

The helper `contentWithKitActivityTitle` must create otherwise valid content whose official sections mention `Segunda Guerra Mundial` but every kit field mentions `Ciclo da agua`.

- [ ] **Step 3: Add failing quality test for generic adaptations**

Add to `QualityValidatorTest`:

```java
@Test
void lowersQualityWhenKitIsNotClassroomPractical() {
    LessonPlanContent content = validContentWithGenericKit();

    QualityScore score = validator.score(content, 100, true);

    assertThat(score.pedagogicalQuality()).isLessThan(90);
    assertThat(score.finalScore()).isLessThan(90);
}
```

The helper `validContentWithGenericKit` should use kit items such as `"Ajudar alunos"` and `"Observar participacao"` repeated across sections.

- [ ] **Step 4: Run tests and verify RED**

Run:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'; $env:Path="$env:JAVA_HOME\bin;$env:Path"; .\mvnw.cmd '-Dtest=LessonPlanPromptBuilderTest,TopicAlignmentValidatorTest,QualityValidatorTest' test
```

Expected: at least one failure because prompt, topic scoring, and quality do not yet include the kit.

- [ ] **Step 5: Update prompt schema**

In `LessonPlanPromptBuilder`, extend the JSON schema in the prompt with:

```json
"kit": {
  "studentActivity": {
    "title": "Titulo da atividade",
    "context": "Contexto curto para o aluno",
    "instructions": ["Instrucao 1", "Instrucao 2", "Instrucao 3"],
    "questions": ["Questao 1", "Questao 2", "Questao 3"],
    "expectedProduct": "Produto esperado da atividade"
  },
  "teacherAnswerKey": {
    "expectedAnswers": ["Resposta esperada 1", "Resposta esperada 2", "Resposta esperada 3"],
    "teacherGuidance": ["Orientacao 1", "Orientacao 2"]
  },
  "assessmentInstrument": {
    "criteria": ["Criterio observavel 1", "Criterio observavel 2", "Criterio observavel 3"],
    "evidenceCollection": ["Evidencia 1", "Evidencia 2"]
  },
  "pedagogicalEvidence": {
    "observableEvidences": ["Evidencia observavel 1", "Evidencia observavel 2", "Evidencia observavel 3"],
    "recordsForCoordination": ["Registro 1", "Registro 2"]
  },
  "inclusiveAdaptations": {
    "readingSupport": ["Apoio de leitura 1", "Apoio de leitura 2"],
    "participationSupport": ["Apoio de participacao 1", "Apoio de participacao 2"],
    "simplifiedAlternatives": ["Alternativa simplificada 1", "Alternativa simplificada 2"]
  }
}
```

Also add rules:

```text
- crie uma atividade para os alunos diretamente ligada ao tema.
- crie gabarito do professor com respostas esperadas e orientacoes de mediacao.
- crie instrumento avaliativo com criterios observaveis e coleta de evidencias.
- crie evidencias pedagogicas adequadas para coordenacao.
- crie adaptacoes inclusivas concretas para leitura, participacao e versoes simplificadas.
- nao inclua emojis, markdown, links, URLs, nome do site, metadados ou campos tecnicos.
```

- [ ] **Step 6: Update topic alignment generated text**

In `TopicAlignmentValidator.score`, append kit text to the generated text:

```java
String generatedText = String.join(" ",
        String.join(" ", content.objectives()),
        String.join(" ", content.contents()),
        content.methodology().introduction().description(),
        content.methodology().development().description(),
        content.methodology().closing().description(),
        String.join(" ", content.resources()),
        String.join(" ", content.evaluation().observableCriteria()),
        kitText(content.kit())
);
```

Add:

```java
private String kitText(CompleteLessonKit kit) {
    if (kit == null) {
        return "";
    }
    return String.join(" ",
            kit.studentActivity().title(),
            kit.studentActivity().context(),
            String.join(" ", kit.studentActivity().instructions()),
            String.join(" ", kit.studentActivity().questions()),
            kit.studentActivity().expectedProduct(),
            String.join(" ", kit.teacherAnswerKey().expectedAnswers()),
            String.join(" ", kit.teacherAnswerKey().teacherGuidance()),
            String.join(" ", kit.assessmentInstrument().criteria()),
            String.join(" ", kit.assessmentInstrument().evidenceCollection()),
            String.join(" ", kit.pedagogicalEvidence().observableEvidences()),
            String.join(" ", kit.pedagogicalEvidence().recordsForCoordination()),
            String.join(" ", kit.inclusiveAdaptations().readingSupport()),
            String.join(" ", kit.inclusiveAdaptations().participationSupport()),
            String.join(" ", kit.inclusiveAdaptations().simplifiedAlternatives())
    );
}
```

- [ ] **Step 7: Update quality heuristics**

In `QualityValidator.pedagogicalQuality`, require practical kit words:

```java
boolean hasPracticalKit = LessonPlanTextNormalizer.normalize(kitText(content.kit()))
        .matches(".*(atividade|cartao|grupo|dupla|registro|painel|questao|resposta|criterio|evidencia|leitura|oral|imagem|simplificada).*");
return hasActiveDevelopment && hasPracticalKit ? 100 : 80;
```

Add the same `kitText` helper used in topic alignment.

- [ ] **Step 8: Run tests and verify GREEN**

Run:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'; $env:Path="$env:JAVA_HOME\bin;$env:Path"; .\mvnw.cmd '-Dtest=LessonPlanPromptBuilderTest,TopicAlignmentValidatorTest,QualityValidatorTest' test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 9: Commit prompt and scoring**

Run:

```powershell
git add src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanPromptBuilder.java src/main/java/br/com/edudocsai/service/lessonplan/TopicAlignmentValidator.java src/main/java/br/com/edudocsai/service/lessonplan/QualityValidator.java src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanPromptBuilderTest.java src/test/java/br/com/edudocsai/service/lessonplan/TopicAlignmentValidatorTest.java src/test/java/br/com/edudocsai/service/lessonplan/QualityValidatorTest.java
git commit -m "feat: include lesson kit in prompt and quality gates"
```

## Task 4: Assembler And Generation Retry With Kit

**Files:**
- Modify: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanAssembler.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanAssemblerTest.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanGenerationServiceTest.java`

- [ ] **Step 1: Add failing assembler test**

Add to `LessonPlanAssemblerTest`:

```java
@Test
void assemblesCompleteLessonKitWithPortugueseKeys() throws Exception {
    String json = assembler.assembleJson(context(), List.of(skill()), contentWithKit());

    JsonNode root = objectMapper.readTree(json);

    assertThat(root.path("kitAulaCompleta").path("atividadeAluno").path("titulo").asText())
            .isEqualTo("Linha do tempo da Segunda Guerra Mundial");
    assertThat(root.path("kitAulaCompleta").path("gabaritoProfessor").path("respostasEsperadas").path(0).asText())
            .contains("ordem cronologica");
    assertThat(root.toString())
            .doesNotContain("studentActivity")
            .doesNotContain("teacherAnswerKey")
            .doesNotContain("question_number")
            .doesNotContain("tempo_sugerido");
}
```

- [ ] **Step 2: Add failing generation retry test**

Add to `LessonPlanGenerationServiceTest`:

```java
@Test
void regeneratesWhenKitIsMissing() {
    LessonPlanGenerationService service = service();
    when(bnccService.validateAndLoad(List.of(1L))).thenReturn(List.of(skill()));
    when(aiService.generateJsonObject(any()))
            .thenReturn(validJsonWithoutKit())
            .thenReturn(validJson());
    when(generationRequestRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    when(documentRepository.save(any())).thenAnswer(invocation -> {
        Document document = invocation.getArgument(0);
        document.setId(99L);
        document.setCreatedAt(OffsetDateTime.now());
        return document;
    });

    Document result = service.generate(user(), request());

    assertThat(result.getContent()).contains("\"kitAulaCompleta\"");
    verify(aiService, times(2)).generateJsonObject(any());
}
```

Update existing `validJson()` helper to include `kit`, and add `validJsonWithoutKit()` that removes it.

- [ ] **Step 3: Run tests and verify RED**

Run:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'; $env:Path="$env:JAVA_HOME\bin;$env:Path"; .\mvnw.cmd '-Dtest=LessonPlanAssemblerTest,LessonPlanGenerationServiceTest' test
```

Expected: assembler test fails because `kitAulaCompleta` is absent, generation tests fail until helpers and parser changes are complete.

- [ ] **Step 4: Implement kit assembly**

In `LessonPlanAssembler.assembleJson`, before `tempoEstimado`, add:

```java
root.put("kitAulaCompleta", kit(content.kit()));
```

Add methods:

```java
private Map<String, Object> kit(CompleteLessonKit kit) {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("atividadeAluno", studentActivity(kit.studentActivity()));
    result.put("gabaritoProfessor", teacherAnswerKey(kit.teacherAnswerKey()));
    result.put("instrumentoAvaliativo", assessmentInstrument(kit.assessmentInstrument()));
    result.put("evidenciasPedagogicas", pedagogicalEvidence(kit.pedagogicalEvidence()));
    result.put("adaptacoesInclusivas", inclusiveAdaptations(kit.inclusiveAdaptations()));
    return result;
}

private Map<String, Object> studentActivity(StudentActivity activity) {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("titulo", activity.title());
    result.put("contexto", activity.context());
    result.put("orientacoes", activity.instructions());
    result.put("questoes", activity.questions());
    result.put("produtoEsperado", activity.expectedProduct());
    return result;
}

private Map<String, Object> teacherAnswerKey(TeacherAnswerKey answerKey) {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("respostasEsperadas", answerKey.expectedAnswers());
    result.put("orientacoesProfessor", answerKey.teacherGuidance());
    return result;
}

private Map<String, Object> assessmentInstrument(AssessmentInstrument instrument) {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("criterios", instrument.criteria());
    result.put("coletaEvidencias", instrument.evidenceCollection());
    return result;
}

private Map<String, Object> pedagogicalEvidence(PedagogicalEvidence evidence) {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("evidenciasObservaveis", evidence.observableEvidences());
    result.put("registrosParaCoordenacao", evidence.recordsForCoordination());
    return result;
}

private Map<String, Object> inclusiveAdaptations(InclusiveAdaptations adaptations) {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("apoioLeitura", adaptations.readingSupport());
    result.put("apoioParticipacao", adaptations.participationSupport());
    result.put("alternativasSimplificadas", adaptations.simplifiedAlternatives());
    return result;
}
```

- [ ] **Step 5: Run assembler and generation tests**

Run:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'; $env:Path="$env:JAVA_HOME\bin;$env:Path"; .\mvnw.cmd '-Dtest=LessonPlanAssemblerTest,LessonPlanGenerationServiceTest' test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 6: Commit assembler and retry coverage**

Run:

```powershell
git add src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanAssembler.java src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanAssemblerTest.java src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanGenerationServiceTest.java
git commit -m "feat: assemble complete lesson kit"
```

## Task 5: DOCX Complete Kit Export

**Files:**
- Modify: `src/main/java/br/com/edudocsai/service/DocumentGeneratorService.java`
- Test: `src/test/java/br/com/edudocsai/service/DocumentGeneratorServiceTest.java`

- [ ] **Step 1: Add failing DOCX kit test**

Add to `DocumentGeneratorServiceTest`:

```java
@Test
void generateDocxRendersLessonPlanAndCompleteKit() {
    Document document = Document.builder()
            .id(1L)
            .type(DocumentType.LESSON_PLAN)
            .title("Plano de aula - Segunda Guerra Mundial")
            .content(canonicalLessonPlanJsonWithKit())
            .build();
    DocumentGeneratorService service = new DocumentGeneratorService(new ObjectMapper());

    String text = extractText(service.generateDocx(document));

    assertThat(text)
            .contains("PLANO DE AULA")
            .contains("Tema:")
            .contains("ATIVIDADE DO ALUNO")
            .contains("Linha do tempo da Segunda Guerra Mundial")
            .contains("GABARITO DO PROFESSOR")
            .contains("INSTRUMENTO AVALIATIVO")
            .contains("EVIDENCIAS PEDAGOGICAS")
            .contains("ADAPTACOES INCLUSIVAS")
            .doesNotContain("http://")
            .doesNotContain("https://")
            .doesNotContain("question_number")
            .doesNotContain("tempo_sugerido")
            .doesNotContain("kitAulaCompleta")
            .doesNotContain("codigo");
}
```

Add `canonicalLessonPlanJsonWithKit()` helper that returns the saved Portuguese JSON from the spec.

- [ ] **Step 2: Run DOCX test and verify RED**

Run:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'; $env:Path="$env:JAVA_HOME\bin;$env:Path"; .\mvnw.cmd '-Dtest=DocumentGeneratorServiceTest#generateDocxRendersLessonPlanAndCompleteKit' test
```

Expected: fails because DOCX only renders the official seven-section lesson plan and not the kit sections.

- [ ] **Step 3: Implement DOCX kit renderer**

In `renderLessonPlanTemplate`, after `addLessonPlanEstimatedTimeSection`, add:

```java
renderCompleteLessonKit(docx, root.path("kitAulaCompleta"));
```

Add methods:

```java
private void renderCompleteLessonKit(org.apache.poi.xwpf.usermodel.XWPFDocument docx, JsonNode kit) {
    if (kit == null || kit.isMissingNode() || kit.isNull()) {
        return;
    }
    addParagraph(docx, "ATIVIDADE DO ALUNO", true);
    JsonNode activity = kit.path("atividadeAluno");
    addLessonPlanTextSection(docx, "Titulo:", scalarText(activity.path("titulo")));
    addLessonPlanTextSection(docx, "Contexto:", scalarText(activity.path("contexto")));
    addLessonPlanListSection(docx, "Orientacoes:", activity.path("orientacoes"));
    addLessonPlanListSection(docx, "Questoes:", activity.path("questoes"));
    addLessonPlanTextSection(docx, "Produto esperado:", scalarText(activity.path("produtoEsperado")));

    addParagraph(docx, "GABARITO DO PROFESSOR", true);
    JsonNode answerKey = kit.path("gabaritoProfessor");
    addLessonPlanListSection(docx, "Respostas esperadas:", answerKey.path("respostasEsperadas"));
    addLessonPlanListSection(docx, "Orientacoes do professor:", answerKey.path("orientacoesProfessor"));

    addParagraph(docx, "INSTRUMENTO AVALIATIVO", true);
    JsonNode assessment = kit.path("instrumentoAvaliativo");
    addLessonPlanListSection(docx, "Criterios:", assessment.path("criterios"));
    addLessonPlanListSection(docx, "Coleta de evidencias:", assessment.path("coletaEvidencias"));

    addParagraph(docx, "EVIDENCIAS PEDAGOGICAS", true);
    JsonNode evidence = kit.path("evidenciasPedagogicas");
    addLessonPlanListSection(docx, "Evidencias observaveis:", evidence.path("evidenciasObservaveis"));
    addLessonPlanListSection(docx, "Registros para coordenacao:", evidence.path("registrosParaCoordenacao"));

    addParagraph(docx, "ADAPTACOES INCLUSIVAS", true);
    JsonNode adaptations = kit.path("adaptacoesInclusivas");
    addLessonPlanListSection(docx, "Apoio de leitura:", adaptations.path("apoioLeitura"));
    addLessonPlanListSection(docx, "Apoio de participacao:", adaptations.path("apoioParticipacao"));
    addLessonPlanListSection(docx, "Alternativas simplificadas:", adaptations.path("alternativasSimplificadas"));
}
```

- [ ] **Step 4: Run DOCX tests and verify GREEN**

Run:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'; $env:Path="$env:JAVA_HOME\bin;$env:Path"; .\mvnw.cmd '-Dtest=DocumentGeneratorServiceTest' test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 5: Commit DOCX export**

Run:

```powershell
git add src/main/java/br/com/edudocsai/service/DocumentGeneratorService.java src/test/java/br/com/edudocsai/service/DocumentGeneratorServiceTest.java
git commit -m "feat: export complete lesson kit docx"
```

## Task 6: Frontend Complete Kit Rendering

**Files:**
- Modify: `C:\Users\joaoh\OneDrive\Área de Trabalho\Documentos\eduDocs-frotend\edudocs-frontend\src\lib\document-rendering.ts`
- Modify: `C:\Users\joaoh\OneDrive\Área de Trabalho\Documentos\eduDocs-frotend\edudocs-frontend\scripts\document-rendering.test.mjs`
- Modify: `C:\Users\joaoh\OneDrive\Área de Trabalho\Documentos\eduDocs-frotend\edudocs-frontend\src\app\dashboard\document\[id]\page.tsx`
- Modify: `C:\Users\joaoh\OneDrive\Área de Trabalho\Documentos\eduDocs-frotend\edudocs-frontend\src\app\globals.css`

- [ ] **Step 1: Add failing frontend rendering test**

In frontend repo, extend `scripts/document-rendering.test.mjs` with:

```js
const completeKitPlan = buildPrintableDocument({
  id: 2,
  userId: 7,
  type: "LESSON_PLAN",
  title: "Plano de aula - Segunda Guerra Mundial",
  createdAt: "2026-06-21T19:00:00Z",
  content: JSON.stringify({
    tema: "Segunda Guerra Mundial",
    objetivosDeAprendizagem: ["Identificar eventos da Segunda Guerra Mundial"],
    conteudo: ["Linha do tempo da Segunda Guerra Mundial"],
    metodologia: {
      introducao: { tempoMinutos: 10, descricao: "Pergunta disparadora" },
      desenvolvimento: { tempoMinutos: 30, descricao: "Atividade em grupos" },
      fechamento: { tempoMinutos: 10, descricao: "Sintese coletiva" },
    },
    recursosDidaticos: ["Cartoes", "Quadro", "Imagens"],
    avaliacao: { criteriosObservaveis: ["Identifica eventos historicos"] },
    tempoEstimado: { introducao: 10, desenvolvimento: 30, fechamento: 10, total: 50 },
    kitAulaCompleta: {
      atividadeAluno: {
        titulo: "Linha do tempo da Segunda Guerra Mundial",
        contexto: "Organize eventos historicos.",
        orientacoes: ["Leia os cartoes", "Ordene os eventos", "Explique uma ruptura"],
        questoes: ["Qual veio primeiro?", "Qual representa ruptura?", "Como a ordem ajuda?"],
        produtoEsperado: "Painel coletivo",
      },
      gabaritoProfessor: {
        respostasEsperadas: ["Ordem cronologica aproximada", "Ruptura justificada", "Continuidade identificada"],
        orientacoesProfessor: ["Valorizar justificativas", "Apoiar leitura"],
      },
      instrumentoAvaliativo: {
        criterios: ["Ordena eventos", "Explica ruptura", "Registra justificativas"],
        coletaEvidencias: ["Fotografar painel", "Guardar texto"],
      },
      evidenciasPedagogicas: {
        evidenciasObservaveis: ["Discussao em grupo", "Painel organizado", "Apresentacao oral"],
        registrosParaCoordenacao: ["Painel produzido", "Anotacoes do professor"],
      },
      adaptacoesInclusivas: {
        apoioLeitura: ["Cartoes curtos", "Leitura em dupla"],
        apoioParticipacao: ["Resposta oral", "Papeis definidos"],
        alternativasSimplificadas: ["Menos cartoes", "Imagens de apoio"],
      },
    },
  }),
});

assert.deepEqual(
  completeKitPlan?.groups.map((group) => group.title),
  ["Plano", "Atividade", "Gabarito", "Avaliacao", "Evidencias", "Adaptacoes"]
);
assert.equal(JSON.stringify(completeKitPlan).includes("Linha do tempo da Segunda Guerra Mundial"), true);
assert.equal(JSON.stringify(completeKitPlan).includes("kitAulaCompleta"), false);
```

- [ ] **Step 2: Run frontend test and verify RED**

Run from frontend repo:

```powershell
node --experimental-strip-types scripts/document-rendering.test.mjs
```

Expected: fails because `buildPrintableDocument` does not return grouped kit sections yet.

- [ ] **Step 3: Update frontend printable model**

In `src/lib/document-rendering.ts`, add:

```ts
export interface PrintableGroup {
  title: string;
  sections: PrintableSection[];
}

export interface PrintableDocument {
  title: string;
  sections: PrintableSection[];
  groups: PrintableGroup[];
}
```

Update old returns to include groups:

```ts
const groups = kitGroups(structured.kitAulaCompleta);
groups.unshift({ title: "Plano", sections: planSections });

return {
  title: "PLANO DE AULA",
  sections: planSections,
  groups,
};
```

Add `kitGroups(kit: unknown): PrintableGroup[]` that maps:

- `atividadeAluno` to group `Atividade`
- `gabaritoProfessor` to group `Gabarito`
- `instrumentoAvaliativo` to group `Avaliacao`
- `evidenciasPedagogicas` to group `Evidencias`
- `adaptacoesInclusivas` to group `Adaptacoes`

Use existing `textSection` and `listSection` helpers with Portuguese labels.

- [ ] **Step 4: Update document view**

In `src/app/dashboard/document/[id]/page.tsx`, render `printable.groups` instead of only `printable.sections`:

```tsx
{printable.groups.map((group) => (
  <div key={group.title} className="mb-10 break-inside-avoid">
    {group.title !== "Plano" && (
      <h2 className="text-2xl font-bold text-text-900 mb-5 border-b border-surface-200 pb-2 print:text-black">
        {group.title}
      </h2>
    )}
    {group.sections.map((section) => (
      <Section key={`${group.title}-${section.title}`} title={section.title}>
        <PrintableBlockView block={section.block} />
      </Section>
    ))}
  </div>
))}
```

Keep old plans working because old plans will have only the `Plano` group.

- [ ] **Step 5: Run frontend tests and verify GREEN**

Run:

```powershell
node --experimental-strip-types scripts/document-rendering.test.mjs
node --experimental-strip-types scripts/document-history.test.mjs
npm run lint
```

Expected: all commands exit 0.

- [ ] **Step 6: Run frontend build**

Run:

```powershell
npm run build
```

Expected: Next.js build completes successfully.

- [ ] **Step 7: Commit frontend rendering**

From frontend repo:

```powershell
git add src/lib/document-rendering.ts scripts/document-rendering.test.mjs src/app/dashboard/document/[id]/page.tsx src/app/globals.css
git commit -m "feat: render complete lesson kit"
```

## Task 7: Full Backend Verification

**Files:**
- Verify backend repository.

- [ ] **Step 1: Run all backend tests**

Run:

```powershell
$env:JAVA_HOME='C:\Program Files\Java\jdk-21'; $env:Path="$env:JAVA_HOME\bin;$env:Path"; .\mvnw.cmd test
```

Expected: `BUILD SUCCESS` and zero failures.

- [ ] **Step 2: Check backend git status**

Run:

```powershell
git status --short
```

Expected: no unstaged files from the complete kit implementation. Pre-existing unrelated BNCC/auth/migration files may remain.

- [ ] **Step 3: Check backend whitespace**

Run:

```powershell
git diff --check HEAD~6..HEAD
```

Expected: no output.

## Task 8: Full Frontend Verification

**Files:**
- Verify frontend repository.

- [ ] **Step 1: Run frontend script tests**

Run:

```powershell
node --experimental-strip-types scripts/document-rendering.test.mjs
node --experimental-strip-types scripts/document-history.test.mjs
```

Expected: both commands exit 0.

- [ ] **Step 2: Run frontend lint**

Run:

```powershell
npm run lint
```

Expected: ESLint exits 0.

- [ ] **Step 3: Run frontend build**

Run:

```powershell
npm run build
```

Expected: Next.js build succeeds.

- [ ] **Step 4: Check frontend git status**

Run:

```powershell
git status --short
```

Expected: no unstaged files from the complete kit implementation. Existing unrelated untracked frontend feature files may remain if they predate this work.

## Self-Review

Spec coverage:

- Canonical kit model is implemented in Tasks 1 and 2.
- Prompt, parser, validators, topic alignment, and quality gates are implemented in Tasks 1, 2, and 3.
- Assembly into `kitAulaCompleta` is implemented in Task 4.
- Regeneration on invalid kit is covered in Task 4.
- DOCX complete kit export is implemented in Task 5.
- Frontend complete kit rendering and print compatibility are implemented in Task 6.
- Backend and frontend verification are covered in Tasks 7 and 8.

Type consistency:

- Internal AI field names are English: `kit.studentActivity.title`.
- Saved API field names are Portuguese: `kitAulaCompleta.atividadeAluno.titulo`.
- Frontend reads saved Portuguese field names.
- Existing old lesson plan rendering remains supported because `kitAulaCompleta` is optional only for old saved documents.

Scope:

- Only `LESSON_PLAN` changes behavior.
- No database schema changes.
- No new endpoints.
- No payment or pricing work.
