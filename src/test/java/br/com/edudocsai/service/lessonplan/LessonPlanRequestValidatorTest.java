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
