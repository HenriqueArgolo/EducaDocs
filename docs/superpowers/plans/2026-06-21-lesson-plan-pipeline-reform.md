# Lesson Plan Pipeline Reform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild only the `LESSON_PLAN` generation path so the system owns the structure, validates BNCC/topic/duration quality, regenerates weak output, and exports a clean seven-section lesson plan.

**Architecture:** Add a focused `br.com.edudocsai.service.lessonplan` package for request normalization, BNCC compatibility, prompt building, strict parsing, template validation, topic alignment, quality scoring, assembly, and orchestration. Keep `EXAM`, `RUBRIC`, and `REPORT` on the existing generic `PromptTemplateService` and `AIService.generate(DocumentType, prompt)` path. Add a raw structured JSON method to `AIService` for lesson plans because the approved lesson plan schema intentionally excludes `titulo` and `tipo`.

**Tech Stack:** Java 21, Spring Boot 3.3.5, Jackson `ObjectMapper`, Apache POI, JUnit 5, AssertJ, Mockito, Maven wrapper on Windows (`.\mvnw.cmd`).

---

## File Structure

- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanRequestContext.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanRequestValidator.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanTextNormalizer.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/BnccCompatibilityValidator.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanContent.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/Methodology.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonStage.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/Evaluation.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanValidationException.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanAiParser.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/TemplateValidator.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/TopicAlignmentValidator.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/QualityScore.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/QualityValidator.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanPromptBuilder.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanAssembler.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanGenerationService.java`
- Modify: `src/main/java/br/com/edudocsai/service/AIService.java`
- Modify: `src/main/java/br/com/edudocsai/service/DocumentService.java`
- Modify: `src/main/java/br/com/edudocsai/service/DocumentGeneratorService.java`
- Modify: `README.md`
- Test: `src/test/java/br/com/edudocsai/service/AIServiceTest.java`
- Test: `src/test/java/br/com/edudocsai/service/DocumentServiceTest.java`
- Test: `src/test/java/br/com/edudocsai/service/DocumentGeneratorServiceTest.java`
- Create tests under: `src/test/java/br/com/edudocsai/service/lessonplan/`

## Execution Notes

- Preserve existing uncommitted user changes. Before each commit, run `git diff --cached --name-only` and ensure only files from the task are staged.
- Use `.\mvnw.cmd -Dtest=ClassName test` for focused test runs.
- Use `.\mvnw.cmd test` before the final commit.
- Keep all validation failures for bad user input as `BadRequestException`.
- Keep AI/provider or repeated invalid AI output failures as `AiProviderException`.

### Task 1: Lesson Plan Request Normalization

**Files:**
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanRequestContext.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanRequestValidator.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanRequestValidatorTest.java`

- [ ] **Step 1: Write the failing request validator test**

```java
package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.dto.document.GenerateDocumentRequest;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LessonPlanRequestValidatorTest {

    private final LessonPlanRequestValidator validator = new LessonPlanRequestValidator();

    @Test
    void validatesAndNormalizesRequiredLessonPlanFields() {
        GenerateDocumentRequest request = new GenerateDocumentRequest(
                DocumentType.LESSON_PLAN,
                List.of(1L, 2L),
                " Fracoes equivalentes ",
                " 5 ano ",
                " Matematica ",
                "50 minutos",
                " Usar material concreto "
        );

        LessonPlanRequestContext result = validator.validate(request);

        assertThat(result.documentType()).isEqualTo(DocumentType.LESSON_PLAN);
        assertThat(result.bnccSkillIds()).containsExactly(1L, 2L);
        assertThat(result.topic()).isEqualTo("Fracoes equivalentes");
        assertThat(result.grade()).isEqualTo("5 ano");
        assertThat(result.subject()).isEqualTo("Matematica");
        assertThat(result.durationText()).isEqualTo("50 minutos");
        assertThat(result.totalMinutes()).isEqualTo(50);
        assertThat(result.additionalInstructions()).isEqualTo("Usar material concreto");
    }

    @Test
    void rejectsMissingLessonPlanFieldsBeforeAiCall() {
        GenerateDocumentRequest request = new GenerateDocumentRequest(
                DocumentType.LESSON_PLAN,
                List.of(1L),
                "Fracoes",
                " ",
                "Matematica",
                "50 minutos",
                null
        );

        assertThatThrownBy(() -> validator.validate(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Ano escolar e obrigatorio");
    }

    @Test
    void rejectsDurationThatCannotFitRequiredStages() {
        GenerateDocumentRequest request = new GenerateDocumentRequest(
                DocumentType.LESSON_PLAN,
                List.of(1L),
                "Fracoes",
                "5 ano",
                "Matematica",
                "20 minutos",
                null
        );

        assertThatThrownBy(() -> validator.validate(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Duracao");
    }
}
```

- [ ] **Step 2: Run the request validator test and verify it fails**

Run:

```powershell
.\mvnw.cmd -Dtest=LessonPlanRequestValidatorTest test
```

Expected: compilation fails because `LessonPlanRequestValidator` and `LessonPlanRequestContext` do not exist.

- [ ] **Step 3: Create the normalized request context**

```java
package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.DocumentType;

import java.util.List;

public record LessonPlanRequestContext(
        DocumentType documentType,
        List<Long> bnccSkillIds,
        String topic,
        String grade,
        String subject,
        String durationText,
        int totalMinutes,
        String additionalInstructions
) {
    public LessonPlanRequestContext {
        bnccSkillIds = List.copyOf(bnccSkillIds);
    }
}
```

- [ ] **Step 4: Create the request validator**

```java
package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.dto.document.GenerateDocumentRequest;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class LessonPlanRequestValidator {

    private static final Pattern MINUTES_PATTERN = Pattern.compile("(\\d{1,3})");
    private static final int MIN_TOTAL_MINUTES = 30;
    private static final int MAX_TOTAL_MINUTES = 70;

    public LessonPlanRequestContext validate(GenerateDocumentRequest request) {
        if (request.documentType() != DocumentType.LESSON_PLAN) {
            throw new BadRequestException("Validador de plano de aula recebeu tipo de documento invalido");
        }
        List<Long> bnccSkillIds = request.bnccSkillIds();
        if (bnccSkillIds == null || bnccSkillIds.isEmpty()) {
            throw new BadRequestException("Selecione ao menos uma habilidade BNCC");
        }
        String topic = required(request.topic(), "Tema e obrigatorio para plano de aula");
        String grade = required(request.grade(), "Ano escolar e obrigatorio para plano de aula");
        String subject = required(request.subject(), "Disciplina e obrigatoria para plano de aula");
        String durationText = required(request.duration(), "Duracao e obrigatoria para plano de aula");
        int totalMinutes = parseMinutes(durationText);
        if (totalMinutes < MIN_TOTAL_MINUTES || totalMinutes > MAX_TOTAL_MINUTES) {
            throw new BadRequestException("Duracao deve permitir introducao, desenvolvimento e fechamento entre 30 e 70 minutos");
        }
        return new LessonPlanRequestContext(
                request.documentType(),
                bnccSkillIds,
                topic,
                grade,
                subject,
                durationText,
                totalMinutes,
                blankToNull(request.additionalInstructions())
        );
    }

    private int parseMinutes(String durationText) {
        Matcher matcher = MINUTES_PATTERN.matcher(durationText);
        if (!matcher.find()) {
            throw new BadRequestException("Duracao deve informar minutos");
        }
        return Integer.parseInt(matcher.group(1));
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
        return value.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
```

- [ ] **Step 5: Run the request validator test and verify it passes**

Run:

```powershell
.\mvnw.cmd -Dtest=LessonPlanRequestValidatorTest test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 6: Commit request normalization**

```powershell
git add src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanRequestContext.java src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanRequestValidator.java src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanRequestValidatorTest.java
git commit -m "feat: validate lesson plan request inputs"
```

### Task 2: BNCC Compatibility Validator

**Files:**
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanTextNormalizer.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/BnccCompatibilityValidator.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/BnccCompatibilityValidatorTest.java`

- [ ] **Step 1: Write the failing BNCC compatibility test**

```java
package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BnccCompatibilityValidatorTest {

    private final BnccCompatibilityValidator validator = new BnccCompatibilityValidator();

    @Test
    void acceptsSkillsThatMatchSelectedGradeAndSubjectAfterNormalization() {
        BNCCSkill skill = skill("EF05MA03", "Matematica", "5 ano");

        assertThatCode(() -> validator.validate("5o ano", "matematica", List.of(skill)))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsSubjectMismatchWithBnccCodeInMessage() {
        BNCCSkill skill = skill("EF05MA03", "Matematica", "5 ano");

        assertThatThrownBy(() -> validator.validate("5 ano", "Historia", List.of(skill)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EF05MA03");
    }

    @Test
    void acceptsEnsinoMedioAreaForEnsinoMedioSelection() {
        BNCCSkill skill = skill("EM13CHS103", "Ciencias Humanas e Sociais Aplicadas", "Ensino Medio");

        assertThatCode(() -> validator.validate("Ensino Medio", "Ciencias Humanas e Sociais Aplicadas", List.of(skill)))
                .doesNotThrowAnyException();
    }

    private BNCCSkill skill(String code, String subject, String grade) {
        return BNCCSkill.builder()
                .id(1L)
                .code(code)
                .description("Descricao")
                .subject(subject)
                .grade(grade)
                .build();
    }
}
```

- [ ] **Step 2: Run the BNCC compatibility test and verify it fails**

Run:

```powershell
.\mvnw.cmd -Dtest=BnccCompatibilityValidatorTest test
```

Expected: compilation fails because `BnccCompatibilityValidator` does not exist.

- [ ] **Step 3: Create the text normalizer**

```java
package br.com.edudocsai.service.lessonplan;

import java.text.Normalizer;
import java.util.Locale;

final class LessonPlanTextNormalizer {

    private LessonPlanTextNormalizer() {
    }

    static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String withoutMarks = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return withoutMarks
                .replace('º', 'o')
                .replace('ª', 'a')
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }
}
```

- [ ] **Step 4: Create the BNCC compatibility validator**

```java
package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class BnccCompatibilityValidator {

    private static final Pattern GRADE_NUMBER_PATTERN = Pattern.compile("\\b(\\d{1,2})\\b");

    public void validate(String selectedGrade, String selectedSubject, List<BNCCSkill> skills) {
        for (BNCCSkill skill : skills) {
            if (!sameSubject(selectedSubject, skill.getSubject()) || !compatibleGrade(selectedGrade, skill.getGrade())) {
                throw new BadRequestException("Habilidade BNCC incompativel com ano ou disciplina selecionados: " + skill.getCode());
            }
        }
    }

    private boolean sameSubject(String selectedSubject, String skillSubject) {
        return LessonPlanTextNormalizer.normalize(selectedSubject)
                .equals(LessonPlanTextNormalizer.normalize(skillSubject));
    }

    private boolean compatibleGrade(String selectedGrade, String skillGrade) {
        String selected = LessonPlanTextNormalizer.normalize(selectedGrade);
        String skill = LessonPlanTextNormalizer.normalize(skillGrade);
        if (selected.equals(skill)) {
            return true;
        }
        if (selected.contains("ensino medio") && skill.contains("ensino medio")) {
            return true;
        }
        Integer selectedNumber = firstGradeNumber(selected);
        if (selectedNumber == null) {
            return false;
        }
        List<Integer> skillNumbers = gradeNumbers(skill);
        if (skillNumbers.size() == 1) {
            return selectedNumber.equals(skillNumbers.get(0));
        }
        if (skillNumbers.size() >= 2) {
            int start = skillNumbers.get(0);
            int end = skillNumbers.get(skillNumbers.size() - 1);
            return selectedNumber >= Math.min(start, end) && selectedNumber <= Math.max(start, end);
        }
        return false;
    }

    private Integer firstGradeNumber(String value) {
        Matcher matcher = GRADE_NUMBER_PATTERN.matcher(value);
        return matcher.find() ? Integer.parseInt(matcher.group(1)) : null;
    }

    private List<Integer> gradeNumbers(String value) {
        Matcher matcher = GRADE_NUMBER_PATTERN.matcher(value);
        java.util.ArrayList<Integer> numbers = new java.util.ArrayList<>();
        while (matcher.find()) {
            numbers.add(Integer.parseInt(matcher.group(1)));
        }
        return numbers;
    }
}
```

- [ ] **Step 5: Run the BNCC compatibility test and verify it passes**

Run:

```powershell
.\mvnw.cmd -Dtest=BnccCompatibilityValidatorTest test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 6: Commit BNCC compatibility validation**

```powershell
git add src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanTextNormalizer.java src/main/java/br/com/edudocsai/service/lessonplan/BnccCompatibilityValidator.java src/test/java/br/com/edudocsai/service/lessonplan/BnccCompatibilityValidatorTest.java
git commit -m "feat: validate lesson plan bncc compatibility"
```

### Task 3: Raw Structured JSON AI Method

**Files:**
- Modify: `src/main/java/br/com/edudocsai/service/AIService.java`
- Modify: `src/test/java/br/com/edudocsai/service/AIServiceTest.java`

- [ ] **Step 1: Add the failing AI service test**

Add this test method to `AIServiceTest`:

```java
@Test
void generateJsonObjectReturnsStructuredJsonWithoutTitleOrTypeRequirement() throws Exception {
    String lessonPlanContent = """
            {
              "objectives": ["Identificar fracoes equivalentes"],
              "contents": ["Representacao de fracoes"],
              "methodology": {
                "introduction": {"durationMinutes": 10, "description": "Ativar conhecimentos previos"},
                "development": {"durationMinutes": 30, "description": "Resolver situacoes-problema"},
                "closing": {"durationMinutes": 10, "description": "Sistematizar aprendizagens"}
              },
              "resources": ["Quadro branco", "Cartoes de fracoes", "Caderno"],
              "evaluation": {"observableCriteria": ["Identifica fracoes equivalentes"]}
            }
            """;
    WebClient gemini = webClientReturning(geminiBody(lessonPlanContent));
    WebClient openRouter = webClientFailing();
    AIService service = new AIService(gemini, openRouter, properties(), objectMapper);

    String result = service.generateJsonObject("prompt");

    assertThat(result).contains("\"objectives\" :");
    assertThat(result).doesNotContain("\"tipo\"");
    assertThat(result).doesNotContain("\"titulo\"");
}
```

- [ ] **Step 2: Run the AI service test and verify it fails**

Run:

```powershell
.\mvnw.cmd -Dtest=AIServiceTest#generateJsonObjectReturnsStructuredJsonWithoutTitleOrTypeRequirement test
```

Expected: compilation fails because `generateJsonObject(String)` does not exist.

- [ ] **Step 3: Add `generateJsonObject` to `AIService`**

Add this public method and helper to `AIService` without changing the existing `generate(DocumentType, String)` method:

```java
public String generateJsonObject(String prompt) {
    try {
        return normalizeJsonObject(callGemini(prompt));
    } catch (RuntimeException primaryException) {
        log.warn("Gemini provider failed. Falling back to OpenRouter. reason={}", primaryException.getMessage());
        try {
            return normalizeJsonObject(callOpenRouter(prompt));
        } catch (RuntimeException fallbackException) {
            log.warn("OpenRouter provider failed. reason={}", fallbackException.getMessage());
            throw new AiProviderException("Falha ao gerar JSON estruturado com os provedores de IA", fallbackException);
        }
    }
}

private String normalizeJsonObject(String rawText) {
    try {
        String json = extractJsonObject(rawText);
        JsonNode root = objectMapper.readTree(json);
        if (!root.isObject()) {
            throw new AiProviderException("IA nao retornou objeto JSON");
        }
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
    } catch (AiProviderException exception) {
        throw exception;
    } catch (Exception exception) {
        throw new AiProviderException("IA nao retornou JSON estruturado valido", exception);
    }
}
```

- [ ] **Step 4: Run the AI service tests and verify they pass**

Run:

```powershell
.\mvnw.cmd -Dtest=AIServiceTest test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 5: Commit the raw JSON AI method**

```powershell
git add src/main/java/br/com/edudocsai/service/AIService.java src/test/java/br/com/edudocsai/service/AIServiceTest.java
git commit -m "feat: add structured json ai generation"
```

### Task 4: Strict Lesson Plan Parser And Content Model

**Files:**
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanContent.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/Methodology.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonStage.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/Evaluation.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanValidationException.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanAiParser.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanAiParserTest.java`

- [ ] **Step 1: Write the failing parser test**

```java
package br.com.edudocsai.service.lessonplan;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LessonPlanAiParserTest {

    private final LessonPlanAiParser parser = new LessonPlanAiParser(new ObjectMapper());

    @Test
    void parsesStrictCanonicalLessonPlanContent() {
        LessonPlanContent content = parser.parse(validJson());

        assertThat(content.objectives()).containsExactly(
                "Identificar fracoes equivalentes",
                "Comparar representacoes fracionarias",
                "Resolver situacoes-problema com fracoes"
        );
        assertThat(content.methodology().introduction().durationMinutes()).isEqualTo(10);
        assertThat(content.evaluation().observableCriteria()).hasSize(3);
    }

    @Test
    void rejectsUnknownTopLevelFields() {
        String invalid = validJson().replaceFirst("\\{", "{\"tema\":\"Outro tema\",");

        assertThatThrownBy(() -> parser.parse(invalid))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("Campo nao permitido");
    }

    @Test
    void rejectsMissingRequiredFields() {
        String invalid = """
                {
                  "objectives": ["Identificar fracoes equivalentes"]
                }
                """;

        assertThatThrownBy(() -> parser.parse(invalid))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("contents");
    }

    private String validJson() {
        return """
                {
                  "objectives": [
                    "Identificar fracoes equivalentes",
                    "Comparar representacoes fracionarias",
                    "Resolver situacoes-problema com fracoes"
                  ],
                  "contents": [
                    "Representacao de fracoes",
                    "Equivalencia entre fracoes",
                    "Resolucao de problemas"
                  ],
                  "methodology": {
                    "introduction": {"durationMinutes": 10, "description": "Ativar conhecimentos previos sobre partes de um todo"},
                    "development": {"durationMinutes": 30, "description": "Comparar fracoes com material concreto e registrar estrategias"},
                    "closing": {"durationMinutes": 10, "description": "Sistematizar conclusoes e retomar objetivos"}
                  },
                  "resources": ["Quadro branco", "Cartoes de fracoes", "Caderno"],
                  "evaluation": {
                    "observableCriteria": [
                      "Identifica fracoes equivalentes em representacoes visuais",
                      "Compara fracoes usando justificativas matematicas",
                      "Registra estrategias de resolucao com clareza"
                    ]
                  }
                }
                """;
    }
}
```

- [ ] **Step 2: Run the parser test and verify it fails**

Run:

```powershell
.\mvnw.cmd -Dtest=LessonPlanAiParserTest test
```

Expected: compilation fails because the content model and parser do not exist.

- [ ] **Step 3: Create the content records and validation exception**

```java
package br.com.edudocsai.service.lessonplan;

import java.util.List;

public record LessonPlanContent(
        List<String> objectives,
        List<String> contents,
        Methodology methodology,
        List<String> resources,
        Evaluation evaluation
) {
}
```

```java
package br.com.edudocsai.service.lessonplan;

public record Methodology(
        LessonStage introduction,
        LessonStage development,
        LessonStage closing
) {
}
```

```java
package br.com.edudocsai.service.lessonplan;

public record LessonStage(
        Integer durationMinutes,
        String description
) {
}
```

```java
package br.com.edudocsai.service.lessonplan;

import java.util.List;

public record Evaluation(
        List<String> observableCriteria
) {
}
```

```java
package br.com.edudocsai.service.lessonplan;

public class LessonPlanValidationException extends RuntimeException {

    public LessonPlanValidationException(String message) {
        super(message);
    }

    public LessonPlanValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

- [ ] **Step 4: Create the strict parser**

```java
package br.com.edudocsai.service.lessonplan;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Iterator;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LessonPlanAiParser {

    private static final Set<String> ROOT_FIELDS = Set.of("objectives", "contents", "methodology", "resources", "evaluation");
    private static final Set<String> METHODOLOGY_FIELDS = Set.of("introduction", "development", "closing");
    private static final Set<String> STAGE_FIELDS = Set.of("durationMinutes", "description");
    private static final Set<String> EVALUATION_FIELDS = Set.of("observableCriteria");

    private final ObjectMapper objectMapper;

    public LessonPlanContent parse(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(extractJsonObject(rawJson));
            requireObject(root, "root");
            rejectUnknownFields(root, ROOT_FIELDS, "root");
            require(root, "objectives");
            require(root, "contents");
            JsonNode methodology = require(root, "methodology");
            JsonNode evaluation = require(root, "evaluation");
            rejectUnknownFields(methodology, METHODOLOGY_FIELDS, "methodology");
            rejectUnknownFields(require(methodology, "introduction"), STAGE_FIELDS, "methodology.introduction");
            rejectUnknownFields(require(methodology, "development"), STAGE_FIELDS, "methodology.development");
            rejectUnknownFields(require(methodology, "closing"), STAGE_FIELDS, "methodology.closing");
            rejectUnknownFields(evaluation, EVALUATION_FIELDS, "evaluation");
            LessonPlanContent content = objectMapper.treeToValue(root, LessonPlanContent.class);
            requireNonBlankLists(content);
            return content;
        } catch (LessonPlanValidationException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new LessonPlanValidationException("Resposta da IA nao segue o schema do plano de aula", exception);
        }
    }

    private String extractJsonObject(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            throw new LessonPlanValidationException("Resposta da IA esta vazia");
        }
        String normalized = rawJson.replace("```json", "").replace("```", "").trim();
        int start = normalized.indexOf('{');
        int end = normalized.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new LessonPlanValidationException("Resposta da IA nao contem objeto JSON");
        }
        return normalized.substring(start, end + 1);
    }

    private JsonNode require(JsonNode node, String field) {
        JsonNode child = node.path(field);
        if (child.isMissingNode() || child.isNull()) {
            throw new LessonPlanValidationException("Campo obrigatorio ausente: " + field);
        }
        return child;
    }

    private void requireObject(JsonNode node, String path) {
        if (!node.isObject()) {
            throw new LessonPlanValidationException("Campo deve ser objeto: " + path);
        }
    }

    private void rejectUnknownFields(JsonNode node, Set<String> allowed, String path) {
        requireObject(node, path);
        Iterator<String> fields = node.fieldNames();
        while (fields.hasNext()) {
            String field = fields.next();
            if (!allowed.contains(field)) {
                throw new LessonPlanValidationException("Campo nao permitido em " + path + ": " + field);
            }
        }
    }

    private void requireNonBlankLists(LessonPlanContent content) {
        requireList(content.objectives(), "objectives");
        requireList(content.contents(), "contents");
        requireList(content.resources(), "resources");
        requireList(content.evaluation().observableCriteria(), "evaluation.observableCriteria");
    }

    private void requireList(java.util.List<String> values, String field) {
        if (values == null || values.isEmpty() || values.stream().anyMatch(value -> value == null || value.isBlank())) {
            throw new LessonPlanValidationException("Lista obrigatoria invalida: " + field);
        }
    }
}
```

- [ ] **Step 5: Run the parser test and verify it passes**

Run:

```powershell
.\mvnw.cmd -Dtest=LessonPlanAiParserTest test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 6: Commit parser and model**

```powershell
git add src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanContent.java src/main/java/br/com/edudocsai/service/lessonplan/Methodology.java src/main/java/br/com/edudocsai/service/lessonplan/LessonStage.java src/main/java/br/com/edudocsai/service/lessonplan/Evaluation.java src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanValidationException.java src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanAiParser.java src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanAiParserTest.java
git commit -m "feat: parse strict lesson plan content"
```

### Task 5: Deterministic Template Validator

**Files:**
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/TemplateValidator.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/TemplateValidatorTest.java`

- [ ] **Step 1: Write the failing template validator test**

```java
package br.com.edudocsai.service.lessonplan;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TemplateValidatorTest {

    private final TemplateValidator validator = new TemplateValidator();

    @Test
    void acceptsContentThatMatchesOfficialTemplateRules() {
        assertThatCode(() -> validator.validate(validContent(), 50))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsObjectiveCountOutsideRequiredRange() {
        LessonPlanContent invalid = new LessonPlanContent(
                List.of("Identificar fracoes"),
                validContent().contents(),
                validContent().methodology(),
                validContent().resources(),
                validContent().evaluation()
        );

        assertThatThrownBy(() -> validator.validate(invalid, 50))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("objetivos");
    }

    @Test
    void rejectsGenericParticipationAsOnlyAssessmentCriterion() {
        LessonPlanContent invalid = new LessonPlanContent(
                validContent().objectives(),
                validContent().contents(),
                validContent().methodology(),
                validContent().resources(),
                new Evaluation(List.of("Participacao"))
        );

        assertThatThrownBy(() -> validator.validate(invalid, 50))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("criterios");
    }

    @Test
    void rejectsStageSumDifferentFromTotalDuration() {
        assertThatThrownBy(() -> validator.validate(validContent(), 60))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("soma");
    }

    static LessonPlanContent validContent() {
        return new LessonPlanContent(
                List.of(
                        "Identificar fracoes equivalentes",
                        "Comparar representacoes fracionarias",
                        "Resolver situacoes-problema com fracoes"
                ),
                List.of(
                        "Representacao de fracoes",
                        "Equivalencia entre fracoes",
                        "Resolucao de problemas"
                ),
                new Methodology(
                        new LessonStage(10, "Ativar conhecimentos previos com exemplos de partes de um todo"),
                        new LessonStage(30, "Comparar fracoes com material concreto e registrar estrategias"),
                        new LessonStage(10, "Sistematizar conclusoes e retomar objetivos")
                ),
                List.of("Quadro branco", "Cartoes de fracoes", "Caderno"),
                new Evaluation(List.of(
                        "Identifica fracoes equivalentes em representacoes visuais",
                        "Compara fracoes usando justificativas matematicas",
                        "Registra estrategias de resolucao com clareza"
                ))
        );
    }
}
```

- [ ] **Step 2: Run the template validator test and verify it fails**

Run:

```powershell
.\mvnw.cmd -Dtest=TemplateValidatorTest test
```

Expected: compilation fails because `TemplateValidator` does not exist.

- [ ] **Step 3: Create the template validator**

```java
package br.com.edudocsai.service.lessonplan;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class TemplateValidator {

    private static final Set<String> OBSERVABLE_VERBS = Set.of(
            "identificar", "reconhecer", "comparar", "analisar", "argumentar", "interpretar",
            "resolver", "relacionar", "descrever", "explicar", "classificar", "avaliar"
    );

    public void validate(LessonPlanContent content, int totalMinutes) {
        requireSize(content.objectives(), 3, 5, "objetivos");
        for (String objective : content.objectives()) {
            String firstWord = firstWord(objective);
            if (!OBSERVABLE_VERBS.contains(firstWord)) {
                throw new LessonPlanValidationException("Objetivo deve iniciar com verbo observavel: " + objective);
            }
        }
        requireSize(content.contents(), 3, Integer.MAX_VALUE, "conteudos");
        requireSize(content.resources(), 3, Integer.MAX_VALUE, "recursos");
        requireSize(content.evaluation().observableCriteria(), 3, Integer.MAX_VALUE, "criterios avaliativos");
        rejectGenericAssessment(content.evaluation().observableCriteria());
        validateStage(content.methodology().introduction(), 5, 15, "introducao");
        validateStage(content.methodology().development(), 20, 40, "desenvolvimento");
        validateStage(content.methodology().closing(), 5, 15, "fechamento");
        int sum = content.methodology().introduction().durationMinutes()
                + content.methodology().development().durationMinutes()
                + content.methodology().closing().durationMinutes();
        if (sum != totalMinutes) {
            throw new LessonPlanValidationException("A soma das etapas deve ser igual a duracao informada");
        }
    }

    private void validateStage(LessonStage stage, int min, int max, String name) {
        if (stage == null || stage.durationMinutes() == null || stage.description() == null || stage.description().isBlank()) {
            throw new LessonPlanValidationException("Etapa metodologica invalida: " + name);
        }
        if (stage.durationMinutes() < min || stage.durationMinutes() > max) {
            throw new LessonPlanValidationException("Tempo invalido para " + name);
        }
    }

    private void requireSize(List<String> values, int min, int max, String field) {
        if (values == null || values.size() < min || values.size() > max) {
            throw new LessonPlanValidationException("Quantidade invalida em " + field);
        }
    }

    private void rejectGenericAssessment(List<String> criteria) {
        boolean onlyParticipation = criteria.stream()
                .map(LessonPlanTextNormalizer::normalize)
                .allMatch(value -> value.equals("participacao") || value.equals("participacao dos alunos"));
        if (onlyParticipation) {
            throw new LessonPlanValidationException("Avaliacao deve conter criterios observaveis");
        }
    }

    private String firstWord(String value) {
        String normalized = LessonPlanTextNormalizer.normalize(value);
        int space = normalized.indexOf(' ');
        return space < 0 ? normalized : normalized.substring(0, space);
    }
}
```

- [ ] **Step 4: Run the template validator test and verify it passes**

Run:

```powershell
.\mvnw.cmd -Dtest=TemplateValidatorTest test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 5: Commit template validation**

```powershell
git add src/main/java/br/com/edudocsai/service/lessonplan/TemplateValidator.java src/test/java/br/com/edudocsai/service/lessonplan/TemplateValidatorTest.java
git commit -m "feat: validate lesson plan template rules"
```

### Task 6: Topic Alignment And Quality Score

**Files:**
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/TopicAlignmentValidator.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/QualityScore.java`
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/QualityValidator.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/TopicAlignmentValidatorTest.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/QualityValidatorTest.java`

- [ ] **Step 1: Write the failing topic alignment test**

```java
package br.com.edudocsai.service.lessonplan;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TopicAlignmentValidatorTest {

    private final TopicAlignmentValidator validator = new TopicAlignmentValidator();

    @Test
    void scoresAlignedTopicAtLeastNinety() {
        int score = validator.score("Fracoes equivalentes", TemplateValidatorTest.validContent());

        assertThat(score).isGreaterThanOrEqualTo(90);
    }

    @Test
    void scoresUnrelatedTopicBelowNinety() {
        int score = validator.score("Revolucao Francesa", TemplateValidatorTest.validContent());

        assertThat(score).isLessThan(90);
    }
}
```

- [ ] **Step 2: Write the failing quality validator test**

```java
package br.com.edudocsai.service.lessonplan;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class QualityValidatorTest {

    private final QualityValidator validator = new QualityValidator();

    @Test
    void producesDetailedPassingScoreForAcceptedContent() {
        QualityScore score = validator.score(TemplateValidatorTest.validContent(), 100, true);

        assertThat(score.structure()).isEqualTo(100);
        assertThat(score.bnccAlignment()).isEqualTo(100);
        assertThat(score.topicAlignment()).isEqualTo(100);
        assertThat(score.finalScore()).isGreaterThanOrEqualTo(90);
    }

    @Test
    void rejectsScoreBelowNinety() {
        QualityScore score = new QualityScore(100, 100, 40, 80, 80, 75);

        assertThatThrownBy(() -> validator.assertAcceptable(score))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("qualidade");
    }
}
```

- [ ] **Step 3: Run the topic and quality tests and verify they fail**

Run:

```powershell
.\mvnw.cmd -Dtest=TopicAlignmentValidatorTest,QualityValidatorTest test
```

Expected: compilation fails because the topic and quality classes do not exist.

- [ ] **Step 4: Create topic alignment and quality classes**

```java
package br.com.edudocsai.service.lessonplan;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TopicAlignmentValidator {

    private static final Set<String> STOP_WORDS = Set.of("de", "da", "do", "das", "dos", "e", "a", "o", "as", "os");

    public int score(String topic, LessonPlanContent content) {
        Set<String> topicTokens = meaningfulTokens(topic);
        if (topicTokens.isEmpty()) {
            return 0;
        }
        String generatedText = LessonPlanTextNormalizer.normalize(String.join(" ",
                String.join(" ", content.objectives()),
                String.join(" ", content.contents()),
                content.methodology().introduction().description(),
                content.methodology().development().description(),
                content.methodology().closing().description(),
                String.join(" ", content.resources()),
                String.join(" ", content.evaluation().observableCriteria())
        ));
        long matched = topicTokens.stream().filter(generatedText::contains).count();
        int score = (int) Math.round((matched * 100.0) / topicTokens.size());
        return Math.min(100, score);
    }

    private Set<String> meaningfulTokens(String value) {
        return Arrays.stream(LessonPlanTextNormalizer.normalize(value).split(" "))
                .filter(token -> token.length() >= 3)
                .filter(token -> !STOP_WORDS.contains(token))
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }
}
```

```java
package br.com.edudocsai.service.lessonplan;

public record QualityScore(
        Integer structure,
        Integer bnccAlignment,
        Integer topicAlignment,
        Integer pedagogicalQuality,
        Integer clarity,
        Integer finalScore
) {
}
```

```java
package br.com.edudocsai.service.lessonplan;

import org.springframework.stereotype.Service;

@Service
public class QualityValidator {

    public QualityScore score(LessonPlanContent content, int topicAlignment, boolean bnccCompatible) {
        int structure = 100;
        int bnccAlignment = bnccCompatible ? 100 : 0;
        int pedagogicalQuality = pedagogicalQuality(content);
        int clarity = clarity(content);
        int finalScore = Math.round(
                structure * 0.25f
                        + bnccAlignment * 0.25f
                        + topicAlignment * 0.25f
                        + pedagogicalQuality * 0.15f
                        + clarity * 0.10f
        );
        return new QualityScore(structure, bnccAlignment, topicAlignment, pedagogicalQuality, clarity, finalScore);
    }

    public void assertAcceptable(QualityScore score) {
        if (score.finalScore() < 90) {
            throw new LessonPlanValidationException("Plano de aula reprovado no validador de qualidade");
        }
    }

    private int pedagogicalQuality(LessonPlanContent content) {
        boolean hasActiveDevelopment = LessonPlanTextNormalizer.normalize(content.methodology().development().description())
                .matches(".*(atividade|resolver|comparar|grupo|dupla|participa|registrar).*");
        return hasActiveDevelopment ? 100 : 80;
    }

    private int clarity(LessonPlanContent content) {
        int totalItems = content.objectives().size()
                + content.contents().size()
                + content.resources().size()
                + content.evaluation().observableCriteria().size();
        return totalItems >= 12 ? 100 : 85;
    }
}
```

- [ ] **Step 5: Run the topic and quality tests and verify they pass**

Run:

```powershell
.\mvnw.cmd -Dtest=TopicAlignmentValidatorTest,QualityValidatorTest test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 6: Commit topic and quality validation**

```powershell
git add src/main/java/br/com/edudocsai/service/lessonplan/TopicAlignmentValidator.java src/main/java/br/com/edudocsai/service/lessonplan/QualityScore.java src/main/java/br/com/edudocsai/service/lessonplan/QualityValidator.java src/test/java/br/com/edudocsai/service/lessonplan/TopicAlignmentValidatorTest.java src/test/java/br/com/edudocsai/service/lessonplan/QualityValidatorTest.java
git commit -m "feat: score lesson plan topic and quality"
```

### Task 7: Lesson Plan Prompt Builder

**Files:**
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanPromptBuilder.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanPromptBuilderTest.java`

- [ ] **Step 1: Write the failing prompt builder test**

```java
package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.DocumentType;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LessonPlanPromptBuilderTest {

    private final LessonPlanPromptBuilder builder = new LessonPlanPromptBuilder();

    @Test
    void buildsPromptThatRestrictsAiToInternalContentOnly() {
        LessonPlanRequestContext context = new LessonPlanRequestContext(
                DocumentType.LESSON_PLAN,
                List.of(1L),
                "Fracoes equivalentes",
                "5 ano",
                "Matematica",
                "50 minutos",
                50,
                null
        );

        String prompt = builder.build(context, List.of(skill()));

        assertThat(prompt).contains("Fracoes equivalentes");
        assertThat(prompt).contains("EF05MA03");
        assertThat(prompt).contains("\"objectives\"");
        assertThat(prompt).contains("\"methodology\"");
        assertThat(prompt).doesNotContain("\"tema\"");
        assertThat(prompt).doesNotContain("\"disciplina\"");
        assertThat(prompt).doesNotContain("\"ano\"");
        assertThat(prompt).contains("nao crie secoes finais");
    }

    private BNCCSkill skill() {
        return BNCCSkill.builder()
                .id(1L)
                .code("EF05MA03")
                .description("Identificar fracoes equivalentes")
                .subject("Matematica")
                .grade("5 ano")
                .build();
    }
}
```

- [ ] **Step 2: Run the prompt builder test and verify it fails**

Run:

```powershell
.\mvnw.cmd -Dtest=LessonPlanPromptBuilderTest test
```

Expected: compilation fails because `LessonPlanPromptBuilder` does not exist.

- [ ] **Step 3: Create the lesson plan prompt builder**

```java
package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.BNCCSkill;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LessonPlanPromptBuilder {

    public String build(LessonPlanRequestContext context, List<BNCCSkill> skills) {
        return """
                Voce e um especialista em planejamento pedagogico brasileiro.

                O sistema ja definiu tema, disciplina, ano, BNCC, duracao total e template final.
                A IA deve preencher somente o conteudo interno solicitado.

                Dados imutaveis do sistema:
                Tema: %s
                Ano escolar: %s
                Disciplina: %s
                Duracao total: %d min
                Habilidades BNCC:
                %s

                Regras obrigatorias:
                - nao altere tema, ano, disciplina, BNCC ou duracao total.
                - nao crie secoes finais do documento.
                - nao crie habilidades BNCC novas.
                - use linguagem profissional de professor experiente.
                - retorne apenas JSON valido.
                - use exatamente os campos do schema abaixo.

                Schema de resposta:
                {
                  "objectives": ["Identificar conceitos essenciais do tema", "Comparar informacoes relacionadas ao tema", "Resolver atividade aplicada ao tema"],
                  "contents": ["Conteudo 1", "Conteudo 2", "Conteudo 3"],
                  "methodology": {
                    "introduction": {"durationMinutes": 10, "description": "Contextualizacao, pergunta disparadora e conhecimentos previos"},
                    "development": {"durationMinutes": 30, "description": "Explicacao, atividade pratica e participacao ativa"},
                    "closing": {"durationMinutes": 10, "description": "Sintese, retomada dos objetivos e conclusao"}
                  },
                  "resources": ["Recurso 1", "Recurso 2", "Recurso 3"],
                  "evaluation": {
                    "observableCriteria": ["Criterio observavel 1", "Criterio observavel 2", "Criterio observavel 3"]
                  }
                }

                Contexto adicional do professor:
                %s
                """.formatted(
                context.topic(),
                context.grade(),
                context.subject(),
                context.totalMinutes(),
                formatSkills(skills),
                context.additionalInstructions() == null ? "Nenhum." : context.additionalInstructions()
        );
    }

    private String formatSkills(List<BNCCSkill> skills) {
        return skills.stream()
                .map(skill -> "- %s - %s".formatted(skill.getCode(), skill.getDescription()))
                .collect(Collectors.joining("\n"));
    }
}
```

- [ ] **Step 4: Run the prompt builder test and verify it passes**

Run:

```powershell
.\mvnw.cmd -Dtest=LessonPlanPromptBuilderTest test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 5: Commit prompt builder**

```powershell
git add src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanPromptBuilder.java src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanPromptBuilderTest.java
git commit -m "feat: build constrained lesson plan prompt"
```

### Task 8: Lesson Plan Assembler

**Files:**
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanAssembler.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanAssemblerTest.java`

- [ ] **Step 1: Write the failing assembler test**

```java
package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.DocumentType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LessonPlanAssemblerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final LessonPlanAssembler assembler = new LessonPlanAssembler(objectMapper);

    @Test
    void assemblesFinalJsonUsingSystemOwnedFields() throws Exception {
        LessonPlanRequestContext context = new LessonPlanRequestContext(
                DocumentType.LESSON_PLAN,
                List.of(1L),
                "Fracoes equivalentes",
                "5 ano",
                "Matematica",
                "50 minutos",
                50,
                null
        );

        String json = assembler.assembleJson(context, List.of(skill()), TemplateValidatorTest.validContent());
        JsonNode root = objectMapper.readTree(json);

        assertThat(root.path("tema").asText()).isEqualTo("Fracoes equivalentes");
        assertThat(root.path("disciplina").asText()).isEqualTo("Matematica");
        assertThat(root.path("ano").asText()).isEqualTo("5 ano");
        assertThat(root.path("habilidadesBncc").path(0).path("codigo").asText()).isEqualTo("EF05MA03");
        assertThat(root.path("tempoEstimado").path("total").asInt()).isEqualTo(50);
        assertThat(json).doesNotContain("question_number");
        assertThat(json).doesNotContain("teacher_notes");
    }

    private BNCCSkill skill() {
        return BNCCSkill.builder()
                .id(1L)
                .code("EF05MA03")
                .description("Identificar fracoes equivalentes")
                .subject("Matematica")
                .grade("5 ano")
                .build();
    }
}
```

- [ ] **Step 2: Run the assembler test and verify it fails**

Run:

```powershell
.\mvnw.cmd -Dtest=LessonPlanAssemblerTest test
```

Expected: compilation fails because `LessonPlanAssembler` does not exist.

- [ ] **Step 3: Create the assembler**

```java
package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.BNCCSkill;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LessonPlanAssembler {

    private final ObjectMapper objectMapper;

    public String assembleJson(LessonPlanRequestContext context, List<BNCCSkill> skills, LessonPlanContent content) {
        try {
            Map<String, Object> root = new java.util.LinkedHashMap<>();
            root.put("tema", context.topic());
            root.put("disciplina", context.subject());
            root.put("ano", context.grade());
            root.put("habilidadesBncc", skills.stream()
                    .map(skill -> Map.of(
                            "codigo", skill.getCode(),
                            "descricao", skill.getDescription()
                    ))
                    .toList());
            root.put("objetivosDeAprendizagem", content.objectives());
            root.put("conteudo", content.contents());
            root.put("metodologia", Map.of(
                    "introducao", stage(content.methodology().introduction()),
                    "desenvolvimento", stage(content.methodology().development()),
                    "fechamento", stage(content.methodology().closing())
            ));
            root.put("recursosDidaticos", content.resources());
            root.put("avaliacao", Map.of("criteriosObservaveis", content.evaluation().observableCriteria()));
            root.put("tempoEstimado", Map.of(
                    "introducao", content.methodology().introduction().durationMinutes(),
                    "desenvolvimento", content.methodology().development().durationMinutes(),
                    "fechamento", content.methodology().closing().durationMinutes(),
                    "total", context.totalMinutes()
            ));
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
        } catch (Exception exception) {
            throw new LessonPlanValidationException("Nao foi possivel montar plano de aula final", exception);
        }
    }

    private Map<String, Object> stage(LessonStage stage) {
        return Map.of(
                "tempoMinutos", stage.durationMinutes(),
                "descricao", stage.description()
        );
    }
}
```

- [ ] **Step 4: Run the assembler test and verify it passes**

Run:

```powershell
.\mvnw.cmd -Dtest=LessonPlanAssemblerTest test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 5: Commit assembler**

```powershell
git add src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanAssembler.java src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanAssemblerTest.java
git commit -m "feat: assemble canonical lesson plan json"
```

### Task 9: Lesson Plan Generation Service And DocumentService Delegation

**Files:**
- Create: `src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanGenerationService.java`
- Modify: `src/main/java/br/com/edudocsai/service/DocumentService.java`
- Modify: `src/test/java/br/com/edudocsai/service/DocumentServiceTest.java`
- Test: `src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanGenerationServiceTest.java`

- [ ] **Step 1: Write the failing generation service test**

```java
package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.dto.document.GenerateDocumentRequest;
import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.GenerationRequest;
import br.com.edudocsai.entity.Role;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.AiProviderException;
import br.com.edudocsai.repository.DocumentRepository;
import br.com.edudocsai.repository.GenerationRequestRepository;
import br.com.edudocsai.service.AIService;
import br.com.edudocsai.service.BNCCService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LessonPlanGenerationServiceTest {

    @Mock
    private BNCCService bnccService;
    @Mock
    private AIService aiService;
    @Mock
    private GenerationRequestRepository generationRequestRepository;
    @Mock
    private DocumentRepository documentRepository;

    @Test
    void regeneratesInvalidAiOutputAndSavesOnlyValidLessonPlan() {
        LessonPlanGenerationService service = service();
        User user = user();
        GenerateDocumentRequest request = request();
        when(bnccService.validateAndLoad(List.of(1L))).thenReturn(List.of(skill()));
        when(aiService.generateJsonObject(any()))
                .thenReturn(unrelatedJson())
                .thenReturn(validJson());
        when(generationRequestRepository.save(any(GenerationRequest.class))).thenAnswer(invocation -> {
            GenerationRequest entity = invocation.getArgument(0);
            entity.setId(10L);
            return entity;
        });
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
            Document entity = invocation.getArgument(0);
            entity.setId(99L);
            entity.setCreatedAt(OffsetDateTime.now());
            return entity;
        });

        Document result = service.generate(user, request);

        assertThat(result.getId()).isEqualTo(99L);
        assertThat(result.getTitle()).isEqualTo("Plano de aula - Fracoes equivalentes");
        assertThat(result.getContent()).contains("\"tema\" : \"Fracoes equivalentes\"");
        verify(aiService, org.mockito.Mockito.times(2)).generateJsonObject(any());
    }

    @Test
    void failsWithoutSavingWhenAllAttemptsAreInvalid() {
        LessonPlanGenerationService service = service();
        when(bnccService.validateAndLoad(List.of(1L))).thenReturn(List.of(skill()));
        when(aiService.generateJsonObject(any())).thenReturn(unrelatedJson());

        assertThatThrownBy(() -> service.generate(user(), request()))
                .isInstanceOf(AiProviderException.class);

        verify(generationRequestRepository, never()).save(any());
        verify(documentRepository, never()).save(any());
    }

    private LessonPlanGenerationService service() {
        ObjectMapper objectMapper = new ObjectMapper();
        return new LessonPlanGenerationService(
                new LessonPlanRequestValidator(),
                bnccService,
                new BnccCompatibilityValidator(),
                new LessonPlanPromptBuilder(),
                aiService,
                new LessonPlanAiParser(objectMapper),
                new TemplateValidator(),
                new TopicAlignmentValidator(),
                new QualityValidator(),
                new LessonPlanAssembler(objectMapper),
                generationRequestRepository,
                documentRepository
        );
    }

    private GenerateDocumentRequest request() {
        return new GenerateDocumentRequest(
                DocumentType.LESSON_PLAN,
                List.of(1L),
                "Fracoes equivalentes",
                "5 ano",
                "Matematica",
                "50 minutos",
                null
        );
    }

    private User user() {
        return User.builder()
                .id(7L)
                .name("Maria")
                .email("maria@escola.com")
                .password("hash")
                .role(Role.TEACHER)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    private BNCCSkill skill() {
        return BNCCSkill.builder()
                .id(1L)
                .code("EF05MA03")
                .description("Identificar fracoes equivalentes")
                .subject("Matematica")
                .grade("5 ano")
                .build();
    }

    private String validJson() {
        return """
                {
                  "objectives": ["Identificar fracoes equivalentes", "Comparar representacoes fracionarias", "Resolver situacoes-problema com fracoes"],
                  "contents": ["Representacao de fracoes", "Equivalencia entre fracoes", "Resolucao de problemas com fracoes equivalentes"],
                  "methodology": {
                    "introduction": {"durationMinutes": 10, "description": "Ativar conhecimentos previos sobre fracoes equivalentes"},
                    "development": {"durationMinutes": 30, "description": "Resolver atividade em duplas comparando fracoes equivalentes"},
                    "closing": {"durationMinutes": 10, "description": "Sistematizar aprendizagens sobre fracoes equivalentes"}
                  },
                  "resources": ["Quadro branco", "Cartoes de fracoes", "Caderno"],
                  "evaluation": {"observableCriteria": ["Identifica fracoes equivalentes", "Compara representacoes fracionarias", "Registra estrategias de resolucao"]}
                }
                """;
    }

    private String unrelatedJson() {
        return validJson().replace("fracoes equivalentes", "revolucao francesa").replace("Fracoes", "Revolucao");
    }
}
```

- [ ] **Step 2: Run the generation service test and verify it fails**

Run:

```powershell
.\mvnw.cmd -Dtest=LessonPlanGenerationServiceTest test
```

Expected: compilation fails because `LessonPlanGenerationService` does not exist.

- [ ] **Step 3: Create `LessonPlanGenerationService`**

```java
package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.dto.document.GenerateDocumentRequest;
import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.GenerationRequest;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.AiProviderException;
import br.com.edudocsai.repository.DocumentRepository;
import br.com.edudocsai.repository.GenerationRequestRepository;
import br.com.edudocsai.service.AIService;
import br.com.edudocsai.service.BNCCService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonPlanGenerationService {

    private static final int MAX_ATTEMPTS = 3;

    private final LessonPlanRequestValidator requestValidator;
    private final BNCCService bnccService;
    private final BnccCompatibilityValidator bnccCompatibilityValidator;
    private final LessonPlanPromptBuilder promptBuilder;
    private final AIService aiService;
    private final LessonPlanAiParser parser;
    private final TemplateValidator templateValidator;
    private final TopicAlignmentValidator topicAlignmentValidator;
    private final QualityValidator qualityValidator;
    private final LessonPlanAssembler assembler;
    private final GenerationRequestRepository generationRequestRepository;
    private final DocumentRepository documentRepository;

    public Document generate(User user, GenerateDocumentRequest request) {
        LessonPlanRequestContext context = requestValidator.validate(request);
        List<BNCCSkill> skills = bnccService.validateAndLoad(context.bnccSkillIds());
        bnccCompatibilityValidator.validate(context.grade(), context.subject(), skills);
        String prompt = promptBuilder.build(context, skills);
        RuntimeException lastFailure = null;

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                LessonPlanContent content = parser.parse(aiService.generateJsonObject(prompt));
                templateValidator.validate(content, context.totalMinutes());
                int topicScore = topicAlignmentValidator.score(context.topic(), content);
                if (topicScore < 90) {
                    throw new LessonPlanValidationException("Plano de aula desalinhado ao tema informado");
                }
                QualityScore score = qualityValidator.score(content, topicScore, true);
                qualityValidator.assertAcceptable(score);
                String finalJson = assembler.assembleJson(context, skills, content);
                return save(user, context, finalJson);
            } catch (RuntimeException exception) {
                lastFailure = exception;
            }
        }

        throw new AiProviderException("Nao foi possivel gerar plano de aula valido apos 3 tentativas", lastFailure);
    }

    private Document save(User user, LessonPlanRequestContext context, String finalJson) {
        GenerationRequest generationRequest = generationRequestRepository.save(GenerationRequest.builder()
                .user(user)
                .documentType(DocumentType.LESSON_PLAN)
                .bnccSkillIds(context.bnccSkillIds())
                .topic(context.topic())
                .grade(context.grade())
                .subject(context.subject())
                .duration(context.durationText())
                .additionalInstructions(context.additionalInstructions())
                .build());

        return documentRepository.save(Document.builder()
                .user(user)
                .generationRequest(generationRequest)
                .type(DocumentType.LESSON_PLAN)
                .title(limitTitle("Plano de aula - " + context.topic()))
                .content(finalJson)
                .build());
    }

    private String limitTitle(String title) {
        return title.length() > 180 ? title.substring(0, 180) : title;
    }
}
```

- [ ] **Step 4: Run the generation service test and verify it passes**

Run:

```powershell
.\mvnw.cmd -Dtest=LessonPlanGenerationServiceTest test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 5: Add failing DocumentService delegation coverage**

Modify `DocumentServiceTest`:

```java
@Mock
private br.com.edudocsai.service.lessonplan.LessonPlanGenerationService lessonPlanGenerationService;
```

Add this test:

```java
@Test
void generateDelegatesLessonPlanToStrictPipeline() {
    User user = user();
    GenerateDocumentRequest request = request();
    Document document = Document.builder()
            .id(99L)
            .user(user)
            .type(DocumentType.LESSON_PLAN)
            .title("Plano de aula - Fracoes")
            .content("{\"tema\":\"Fracoes\"}")
            .createdAt(OffsetDateTime.now())
            .build();
    when(currentUserService.getCurrentUser()).thenReturn(user);
    when(lessonPlanGenerationService.generate(user, request)).thenReturn(document);

    DocumentResponse result = documentService.generate(request);

    assertThat(result.title()).isEqualTo("Plano de aula - Fracoes");
    verify(lessonPlanGenerationService).generate(user, request);
    verify(promptTemplateService, never()).buildPrompt(any(), anyList(), any(), any(), any(), any(), any());
    verify(usageLimitService).increment(user);
}
```

Run:

```powershell
.\mvnw.cmd -Dtest=DocumentServiceTest#generateDelegatesLessonPlanToStrictPipeline test
```

Expected: compilation fails or test fails because `DocumentService` does not inject and use `LessonPlanGenerationService`.

- [ ] **Step 6: Modify `DocumentService` to delegate only `LESSON_PLAN`**

Add the field:

```java
private final br.com.edudocsai.service.lessonplan.LessonPlanGenerationService lessonPlanGenerationService;
```

Replace `generate` with this structure and move the current generic body into `generateGeneric`:

```java
@Transactional
public DocumentResponse generate(GenerateDocumentRequest request) {
    User user = currentUserService.getCurrentUser();
    usageLimitService.assertCanGenerate(user);
    Document document;
    if (request.documentType() == br.com.edudocsai.entity.DocumentType.LESSON_PLAN) {
        document = lessonPlanGenerationService.generate(user, request);
    } else {
        document = generateGeneric(user, request);
    }
    usageLimitService.increment(user);
    return toResponse(document);
}
```

The `generateGeneric` method must contain the existing non-lesson-plan implementation and return the saved `Document` instead of `DocumentResponse`. Keep `PromptTemplateService` and `AIService.generate(DocumentType, prompt)` inside `generateGeneric`.

- [ ] **Step 7: Run document service tests and verify they pass**

Run:

```powershell
.\mvnw.cmd -Dtest=DocumentServiceTest test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 8: Commit generation orchestration**

```powershell
git add src/main/java/br/com/edudocsai/service/lessonplan/LessonPlanGenerationService.java src/main/java/br/com/edudocsai/service/DocumentService.java src/test/java/br/com/edudocsai/service/lessonplan/LessonPlanGenerationServiceTest.java src/test/java/br/com/edudocsai/service/DocumentServiceTest.java
git commit -m "feat: route lesson plans through strict pipeline"
```

### Task 10: Official Lesson Plan DOCX Template

**Files:**
- Modify: `src/main/java/br/com/edudocsai/service/DocumentGeneratorService.java`
- Modify: `src/test/java/br/com/edudocsai/service/DocumentGeneratorServiceTest.java`

- [ ] **Step 1: Write the failing DOCX test**

Add this test to `DocumentGeneratorServiceTest`:

```java
@Test
void generateDocxRendersOnlyOfficialLessonPlanSections() {
    Document document = Document.builder()
            .id(1L)
            .type(DocumentType.LESSON_PLAN)
            .title("Plano de aula - Fracoes equivalentes")
            .content("""
                    {
                      "tema": "Fracoes equivalentes",
                      "disciplina": "Matematica",
                      "ano": "5 ano",
                      "habilidadesBncc": [{"codigo": "EF05MA03", "descricao": "Identificar fracoes equivalentes"}],
                      "objetivosDeAprendizagem": ["Identificar fracoes equivalentes", "Comparar representacoes fracionarias", "Resolver problemas com fracoes"],
                      "conteudo": ["Representacao de fracoes", "Equivalencia entre fracoes", "Resolucao de problemas"],
                      "metodologia": {
                        "introducao": {"tempoMinutos": 10, "descricao": "Ativar conhecimentos previos"},
                        "desenvolvimento": {"tempoMinutos": 30, "descricao": "Resolver atividade em duplas"},
                        "fechamento": {"tempoMinutos": 10, "descricao": "Sistematizar aprendizagens"}
                      },
                      "recursosDidaticos": ["Quadro branco", "Cartoes de fracoes", "Caderno"],
                      "avaliacao": {"criteriosObservaveis": ["Identifica fracoes equivalentes", "Compara representacoes", "Registra estrategias"]},
                      "tempoEstimado": {"introducao": 10, "desenvolvimento": 30, "fechamento": 10, "total": 50}
                    }
                    """)
            .build();
    DocumentGeneratorService service = new DocumentGeneratorService(new ObjectMapper());

    String text = extractText(service.generateDocx(document));

    assertThat(text)
            .contains("PLANO DE AULA")
            .contains("Tema:")
            .contains("Fracoes equivalentes")
            .contains("Objetivos de Aprendizagem:")
            .contains("Conteudo:")
            .contains("Metodologia:")
            .contains("Recursos Didaticos:")
            .contains("Avaliacao:")
            .contains("Tempo Estimado:")
            .contains("Total: 50 min");
    assertThat(text)
            .doesNotContain("HABILIDADES BNCC")
            .doesNotContain("ATIVIDADES DETALHADAS")
            .doesNotContain("OBSERVACOES DO PROFESSOR")
            .doesNotContain("teacher_notes")
            .doesNotContain("question_number");
}
```

- [ ] **Step 2: Run the DOCX test and verify it fails**

Run:

```powershell
.\mvnw.cmd -Dtest=DocumentGeneratorServiceTest#generateDocxRendersOnlyOfficialLessonPlanSections test
```

Expected: test fails because current export renders the generic eight-section template.

- [ ] **Step 3: Add a lesson-plan-specific rendering branch**

In `generateDocx`, after reading `root`, branch by document type:

```java
if (document.getType() == DocumentType.LESSON_PLAN && root.has("objetivosDeAprendizagem")) {
    renderLessonPlanTemplate(docx, root);
} else {
    renderOfficialTemplate(docx, document, root);
}
```

Add this method:

```java
private void renderLessonPlanTemplate(org.apache.poi.xwpf.usermodel.XWPFDocument docx, JsonNode root) {
    addTitle(docx, "PLANO DE AULA");
    addNumberedSection(docx, "Tema:", root.path("tema").asText());
    addListSection(docx, "Objetivos de Aprendizagem:", root.path("objetivosDeAprendizagem"), null);
    addListSection(docx, "Conteudo:", root.path("conteudo"), null);
    addParagraph(docx, "Metodologia:", true);
    addStage(docx, "Introducao", root.path("metodologia").path("introducao"));
    addStage(docx, "Desenvolvimento", root.path("metodologia").path("desenvolvimento"));
    addStage(docx, "Fechamento", root.path("metodologia").path("fechamento"));
    addListSection(docx, "Recursos Didaticos:", root.path("recursosDidaticos"), null);
    addListSection(docx, "Avaliacao:", root.path("avaliacao").path("criteriosObservaveis"), null);
    addParagraph(docx, "Tempo Estimado:", true);
    JsonNode time = root.path("tempoEstimado");
    addParagraph(docx, "Introducao: " + time.path("introducao").asInt() + " min", false);
    addParagraph(docx, "Desenvolvimento: " + time.path("desenvolvimento").asInt() + " min", false);
    addParagraph(docx, "Fechamento: " + time.path("fechamento").asInt() + " min", false);
    addParagraph(docx, "Total: " + time.path("total").asInt() + " min", false);
}

private void addStage(org.apache.poi.xwpf.usermodel.XWPFDocument docx, String title, JsonNode stage) {
    addParagraph(docx, title + " (" + stage.path("tempoMinutos").asInt() + " min):", true);
    addParagraph(docx, stage.path("descricao").asText(), false);
}
```

Keep `renderOfficialTemplate` unchanged for non-lesson-plan documents.

- [ ] **Step 4: Run DOCX tests and verify they pass**

Run:

```powershell
.\mvnw.cmd -Dtest=DocumentGeneratorServiceTest test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 5: Commit official DOCX rendering**

```powershell
git add src/main/java/br/com/edudocsai/service/DocumentGeneratorService.java src/test/java/br/com/edudocsai/service/DocumentGeneratorServiceTest.java
git commit -m "feat: render official lesson plan docx"
```

### Task 11: README Contract Update

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the lesson plan request example**

Change the `/documents/generate` example so `LESSON_PLAN` includes `grade`, `subject`, and `duration`:

```json
{
  "documentType": "LESSON_PLAN",
  "bnccSkillIds": [1],
  "topic": "Fracoes equivalentes",
  "grade": "5 ano",
  "subject": "Matematica",
  "duration": "50 minutos",
  "additionalInstructions": "Inclua atividade em duplas e avaliacao formativa."
}
```

Add this sentence after the example:

```markdown
Para `LESSON_PLAN`, `topic`, `grade`, `subject`, `duration` e `bnccSkillIds` sao obrigatorios e as habilidades BNCC devem ser compativeis com o ano e a disciplina selecionados.
```

- [ ] **Step 2: Review the README diff**

Run:

```powershell
git diff -- README.md
```

Expected: the only README change is the stricter `LESSON_PLAN` request contract.

- [ ] **Step 3: Commit README update**

```powershell
git add README.md
git commit -m "docs: document strict lesson plan request contract"
```

### Task 12: Full Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run all tests**

Run:

```powershell
.\mvnw.cmd test
```

Expected: `BUILD SUCCESS`.

- [ ] **Step 2: Run git status**

Run:

```powershell
git status --short
```

Expected: only pre-existing unrelated user changes remain, or the worktree is clean if those changes were committed separately by the user.

- [ ] **Step 3: Inspect final diff if anything remains unstaged**

Run:

```powershell
git diff
```

Expected: no unstaged implementation changes from this plan remain.

## Self-Review

Spec coverage:

- Request validation is covered by Task 1.
- BNCC compatibility is covered by Task 2.
- AI structural separation is covered by Tasks 3, 4, 7, 8, and 9.
- Template validation is covered by Task 5.
- Anti-hallucination topic alignment is covered by Task 6.
- Detailed quality scoring is covered by Task 6.
- Regeneration and no-save-on-failure behavior are covered by Task 9.
- Official DOCX output is covered by Task 10.
- README contract clarity is covered by Task 11.
- Full regression verification is covered by Task 12.

Type consistency:

- `LessonPlanRequestContext`, `LessonPlanContent`, `Methodology`, `LessonStage`, `Evaluation`, and `QualityScore` are created before use by downstream tasks.
- `AIService.generateJsonObject(String)` is created before `LessonPlanGenerationService` calls it.
- `DocumentService` delegates only `DocumentType.LESSON_PLAN` after `LessonPlanGenerationService` exists.

Completeness scan:

- The plan contains concrete file paths, concrete commands, concrete tests, and concrete production code snippets for each implementation task.
