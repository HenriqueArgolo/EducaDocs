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
