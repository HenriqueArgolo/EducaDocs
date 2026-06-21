package br.com.edudocsai.service.lessonplan;

import org.junit.jupiter.api.Test;

import java.util.List;

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

    @Test
    void includesCompleteLessonKitWhenScoringTopicAlignment() {
        LessonPlanContent content = new LessonPlanContent(
                List.of("Identificar acontecimentos historicos", "Comparar causas e consequencias", "Registrar conclusoes coletivas"),
                List.of("Tempo historico", "Organizacao cronologica", "Mudancas sociais"),
                new Methodology(
                        new LessonStage(10, "Ativar conhecimentos previos sobre acontecimentos historicos"),
                        new LessonStage(30, "Organizar cartoes de eventos em grupo"),
                        new LessonStage(10, "Retomar objetivos e registrar sintese")
                ),
                List.of("Quadro branco", "Cartoes", "Caderno"),
                new Evaluation(List.of("Identifica acontecimentos", "Compara causas", "Registra conclusoes")),
                new CompleteLessonKit(
                        new StudentActivity(
                                "Linha do tempo da Segunda Guerra Mundial",
                                "Organize eventos da Segunda Guerra Mundial para compreender o conflito.",
                                List.of("Leia os cartoes", "Ordene os eventos", "Explique uma ruptura"),
                                List.of("Qual evento iniciou o conflito?", "Como os aliados atuaram?", "Que consequencia encerrou o periodo?"),
                                "Painel sobre a Segunda Guerra Mundial"
                        ),
                        TemplateValidatorTest.validContent().kit().teacherAnswerKey(),
                        TemplateValidatorTest.validContent().kit().assessmentInstrument(),
                        TemplateValidatorTest.validContent().kit().pedagogicalEvidence(),
                        TemplateValidatorTest.validContent().kit().inclusiveAdaptations()
                )
        );

        int score = validator.score("Segunda Guerra Mundial", content);

        assertThat(score).isGreaterThanOrEqualTo(90);
    }
}
