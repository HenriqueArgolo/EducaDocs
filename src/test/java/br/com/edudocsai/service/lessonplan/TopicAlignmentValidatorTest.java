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
    void rejectsUnrelatedCompleteLessonKitEvenWhenOfficialPlanIsAligned() {
        LessonPlanContent validPlan = TemplateValidatorTest.validContent();
        LessonPlanContent content = new LessonPlanContent(
                validPlan.objectives(),
                validPlan.contents(),
                validPlan.methodology(),
                validPlan.resources(),
                validPlan.evaluation(),
                new CompleteLessonKit(
                        new StudentActivity(
                                "Linha do tempo da Revolucao Francesa",
                                "Organize acontecimentos da Revolucao Francesa para compreender mudancas politicas.",
                                List.of("Leia os cartoes", "Ordene os acontecimentos", "Explique uma ruptura politica"),
                                List.of("Qual acontecimento veio primeiro?", "Que grupo social aparece?", "Que mudanca politica ocorreu?"),
                                "Painel sobre a Revolucao Francesa"
                        ),
                        new TeacherAnswerKey(
                                List.of(
                                        "A queda da Bastilha marca uma ruptura politica",
                                        "Os grupos sociais tinham interesses diferentes",
                                        "A declaracao apresenta direitos defendidos no periodo"
                                ),
                                List.of("Valorizar leitura de fontes", "Pedir justificativas historicas")
                        ),
                        new AssessmentInstrument(
                                List.of("Identifica causas historicas", "Compara grupos sociais", "Registra conclusoes sobre fontes"),
                                List.of("Guardar painel historico", "Anotar falas dos grupos")
                        ),
                        new PedagogicalEvidence(
                                List.of("Discussao sobre fontes", "Organizacao dos acontecimentos", "Apresentacao oral"),
                                List.of("Painel produzido", "Anotacoes do professor")
                        ),
                        new InclusiveAdaptations(
                                List.of("Textos com frases curtas", "Leitura em dupla"),
                                List.of("Resposta oral", "Papeis no grupo"),
                                List.of("Menos cartoes", "Imagens historicas")
                        )
                )
        );

        int score = validator.score("Fracoes equivalentes", content);

        assertThat(score).isLessThan(90);
    }

    @Test
    void acceptsWeeklyLessonPlanWithPartiallyAlignedKit() {
        LessonPlanContent content = new LessonPlanContent(
                List.of("Compreender a Grecia Antiga", "Analisar a Democracia Ateniense", "Comparar com a atualidade"),
                List.of("Historia da Grecia Antiga", "Funcionamento da Democracia Ateniense", "Cidadania"),
                new Methodology(
                        new LessonStage(10, "Discussao sobre Grecia Antiga"),
                        new LessonStage(30, "Desenvolvimento da Democracia Ateniense"),
                        new LessonStage(10, "Fechamento")
                ),
                List.of("Livro de Historia", "Quadro", "Projetor"),
                new Evaluation(List.of("Participou da discussao", "Escreveu sobre Atenas", "Compreendeu a democracia")),
                new CompleteLessonKit(
                        new StudentActivity(
                                "Democracia Ateniense",
                                "Refletir sobre a Democracia Ateniense.",
                                List.of("Instrucao 1", "Instrucao 2", "Instrucao 3"),
                                List.of("Questao 1", "Questao 2", "Questao 3"),
                                "Produto"
                        ),
                        null,
                        null,
                        null,
                        null
                )
        );

        int singleScore = validator.score("Grecia Antiga e a Democracia Ateniense", content, br.com.edudocsai.entity.PlanningPeriod.SINGLE);
        int weeklyScore = validator.score("Grecia Antiga e a Democracia Ateniense", content, br.com.edudocsai.entity.PlanningPeriod.WEEKLY);

        assertThat(singleScore).isLessThan(90);
        assertThat(weeklyScore).isGreaterThanOrEqualTo(90);
    }
}
