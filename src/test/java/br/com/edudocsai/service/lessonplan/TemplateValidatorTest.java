package br.com.edudocsai.service.lessonplan;

import org.junit.jupiter.api.Disabled;
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
                validContent().evaluation(),
                validContent().kit()
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
                new Evaluation(List.of("Participacao", "Participacao dos alunos", "Participacao")),
                validContent().kit()
        );

        assertThatThrownBy(() -> validator.validate(invalid, 50))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("criterios");
    }

    @Test
    @Disabled("Desabilitado pois validateObservableCriteria foi relaxado no validador de producao para evitar loops de geracao de IA")
    void rejectsGenericCriteriaWithoutObservableAction() {
        LessonPlanContent invalid = new LessonPlanContent(
                validContent().objectives(),
                validContent().contents(),
                validContent().methodology(),
                validContent().resources(),
                new Evaluation(List.of("Participacao", "Interesse", "Comportamento")),
                validContent().kit()
        );

        assertThatThrownBy(() -> validator.validate(invalid, 50))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("criterios");
    }

    @Test
    void acceptsObservableAssessmentCriteriaWrittenWithInfinitiveVerbs() {
        LessonPlanContent content = new LessonPlanContent(
                validContent().objectives(),
                validContent().contents(),
                validContent().methodology(),
                validContent().resources(),
                new Evaluation(List.of(
                        "Capacidade de identificar fracoes equivalentes",
                        "Capacidade de comparar representacoes fracionarias",
                        "Capacidade de registrar estrategias de resolucao"
                )),
                validContent().kit()
        );

        assertThatCode(() -> validator.validate(content, 50))
                .doesNotThrowAnyException();
    }

    @Test
    void acceptsBnccStyleObservableObjectiveVerbs() {
        LessonPlanContent content = new LessonPlanContent(
                List.of(
                        "Representar fracoes equivalentes utilizando recursos visuais",
                        "Utilizar modelos concretos para comparar fracoes",
                        "Compreender relacoes de equivalencia por meio de justificativas"
                ),
                validContent().contents(),
                validContent().methodology(),
                validContent().resources(),
                validContent().evaluation(),
                validContent().kit()
        );

        assertThatCode(() -> validator.validate(content, 50))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsStageSumDifferentFromTotalDuration() {
        assertThatThrownBy(() -> validator.validate(validContent(), 60))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("soma");
    }

    @Test
    void rejectsMissingCompleteLessonKit() {
        LessonPlanContent invalid = contentWithKit(null);

        assertThatThrownBy(() -> validator.validate(invalid, 50))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("kit");
    }

    @Test
    void rejectsCompleteLessonKitWithTooFewStudentQuestions() {
        CompleteLessonKit kit = new CompleteLessonKit(
                new StudentActivity(
                        "Linha do tempo das fracoes",
                        "Organizar representacoes de fracoes para explicar equivalencias.",
                        List.of(
                                "Leia cada cartao de fracao",
                                "Agrupe representacoes equivalentes",
                                "Explique uma equivalencia encontrada"
                        ),
                        List.of("Quais fracoes representam a mesma parte?"),
                        "Registro com grupos de fracoes equivalentes"
                ),
                validKit().teacherAnswerKey(),
                validKit().assessmentInstrument(),
                validKit().pedagogicalEvidence(),
                validKit().inclusiveAdaptations()
        );
        LessonPlanContent invalid = contentWithKit(kit);

        assertThatThrownBy(() -> validator.validate(invalid, 50))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("atividade do aluno");
    }

    static LessonPlanContent validContent() {
        return contentWithKit(validKit());
    }

    private static LessonPlanContent contentWithKit(CompleteLessonKit kit) {
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
                )),
                kit
        );
    }

    private static CompleteLessonKit validKit() {
        return new CompleteLessonKit(
                new StudentActivity(
                        "Linha do tempo das fracoes",
                        "Organizar representacoes de fracoes para explicar equivalencias.",
                        List.of(
                                "Leia cada cartao de fracao",
                                "Agrupe representacoes equivalentes",
                                "Explique uma equivalencia encontrada"
                        ),
                        List.of(
                                "Quais fracoes representam a mesma parte?",
                                "Como voce percebeu a equivalencia?",
                                "Que estrategia ajudou na comparacao?"
                        ),
                        "Registro com grupos de fracoes equivalentes"
                ),
                new TeacherAnswerKey(
                        List.of(
                                "Fracoes equivalentes representam a mesma quantidade",
                                "A comparacao deve usar desenho ou proporcionalidade",
                                "A justificativa precisa explicar a relacao entre as fracoes"
                        ),
                        List.of("Valorizar estrategias visuais", "Pedir justificativas orais")
                ),
                new AssessmentInstrument(
                        List.of(
                                "Identifica fracoes equivalentes",
                                "Compara representacoes fracionarias",
                                "Registra justificativas matematicas"
                        ),
                        List.of("Recolher registros no caderno", "Anotar justificativas orais")
                ),
                new PedagogicalEvidence(
                        List.of(
                                "Agrupamento correto de cartoes",
                                "Uso de justificativas matematicas",
                                "Participacao na discussao em grupo"
                        ),
                        List.of("Foto dos agrupamentos", "Amostra dos registros")
                ),
                new InclusiveAdaptations(
                        List.of("Cartoes com fonte ampliada", "Leitura compartilhada"),
                        List.of("Explicacao oral em dupla", "Papeis simples no grupo"),
                        List.of("Menos cartoes", "Desenhos junto das fracoes")
                )
        );
    }
}
