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

    @Test
    void doesNotMatchTopicTokenInsideGeneratedWord() {
        int score = validator.score("Arte", TemplateValidatorTest.validContent());

        assertThat(score).isLessThan(90);
    }

    @Test
    void alignsCommonSingularAndPluralTopicVariants() {
        int score = validator.score("Fracao equivalente", TemplateValidatorTest.validContent());

        assertThat(score).isGreaterThanOrEqualTo(90);
    }
}
