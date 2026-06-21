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
