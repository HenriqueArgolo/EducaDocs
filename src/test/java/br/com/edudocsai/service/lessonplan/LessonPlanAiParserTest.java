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
        assertThat(content.kit().studentActivity().title()).isEqualTo("Linha do tempo das fracoes");
        assertThat(content.kit().teacherAnswerKey().expectedAnswers()).hasSize(3);
        assertThat(content.kit().assessmentInstrument().criteria()).hasSize(3);
        assertThat(content.kit().pedagogicalEvidence().recordsForCoordination()).hasSize(2);
        assertThat(content.kit().inclusiveAdaptations().readingSupport()).hasSize(2);
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

    @Test
    void rejectsMissingCompleteLessonKit() {
        assertThatThrownBy(() -> parser.parse(validJsonWithoutKit()))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("kit");
    }

    @Test
    void rejectsMissingStageRequiredFields() {
        String invalid = validJson().replace(
                "\"introduction\": {\"durationMinutes\": 10, \"description\": \"Ativar conhecimentos previos sobre partes de um todo\"}",
                "\"introduction\": {\"durationMinutes\": 10}"
        );

        assertThatThrownBy(() -> parser.parse(invalid))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("methodology.introduction.description");
    }

    @Test
    void rejectsBlankStageDescription() {
        String invalid = validJson().replace(
                "\"description\": \"Ativar conhecimentos previos sobre partes de um todo\"",
                "\"description\": \"   \""
        );

        assertThatThrownBy(() -> parser.parse(invalid))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("methodology.introduction.description");
    }

    @Test
    void rejectsStringDurationMinutes() {
        String invalid = validJson().replaceFirst("\"durationMinutes\": 10", "\"durationMinutes\": \"10\"");

        assertThatThrownBy(() -> parser.parse(invalid))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("methodology.introduction.durationMinutes");
    }

    @Test
    void rejectsNumericListItem() {
        String invalid = validJson().replace("\"Quadro branco\"", "42");

        assertThatThrownBy(() -> parser.parse(invalid))
                .isInstanceOf(LessonPlanValidationException.class)
                .hasMessageContaining("resources");
    }

    @Test
    void preservesTripleBackticksInsideJsonStringValues() {
        String description = "Comparar registros com ``` exemplo no texto";
        String resource = "Cartao com ``` marcador visual";
        String json = validJson()
                .replace("Comparar fracoes com material concreto e registrar estrategias", description)
                .replace("Cartoes de fracoes", resource);

        LessonPlanContent content = parser.parse("```json\n" + json + "\n```");

        assertThat(content.methodology().development().description()).isEqualTo(description);
        assertThat(content.resources()).contains(resource);
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
                  },
                  "kit": {
                    "studentActivity": {
                      "title": "Linha do tempo das fracoes",
                      "context": "Nesta atividade, voce vai organizar representacoes de fracoes para explicar equivalencias.",
                      "instructions": [
                        "Leia cada cartao de fracao com atencao",
                        "Agrupe representacoes equivalentes",
                        "Explique por escrito uma equivalencia encontrada"
                      ],
                      "questions": [
                        "Quais fracoes representam a mesma parte do todo?",
                        "Como voce percebeu que duas fracoes eram equivalentes?",
                        "Que estrategia ajudou seu grupo a comparar as fracoes?"
                      ],
                      "expectedProduct": "Registro no caderno com grupos de fracoes equivalentes e justificativa"
                    },
                    "teacherAnswerKey": {
                      "expectedAnswers": [
                        "Fracoes equivalentes representam a mesma quantidade",
                        "As comparacoes devem usar desenhos, multiplicacao ou divisao proporcional",
                        "A justificativa precisa explicar a relacao entre numerador e denominador"
                      ],
                      "teacherGuidance": [
                        "Valorize estrategias visuais coerentes",
                        "Peca que os alunos expliquem o raciocinio antes de corrigir"
                      ]
                    },
                    "assessmentInstrument": {
                      "criteria": [
                        "Identifica fracoes equivalentes",
                        "Compara representacoes fracionarias",
                        "Registra justificativas matematicas"
                      ],
                      "evidenceCollection": [
                        "Recolher registros no caderno",
                        "Anotar justificativas apresentadas oralmente"
                      ]
                    },
                    "pedagogicalEvidence": {
                      "observableEvidences": [
                        "Agrupamento correto de cartoes",
                        "Uso de justificativas matematicas",
                        "Participacao na discussao em grupo"
                      ],
                      "recordsForCoordination": [
                        "Foto dos agrupamentos produzidos",
                        "Amostra dos registros no caderno"
                      ]
                    },
                    "inclusiveAdaptations": {
                      "readingSupport": [
                        "Usar cartoes com fonte ampliada",
                        "Realizar leitura compartilhada das consignas"
                      ],
                      "participationSupport": [
                        "Permitir explicacao oral em dupla",
                        "Distribuir papeis simples no grupo"
                      ],
                      "simplifiedAlternatives": [
                        "Reduzir a quantidade de cartoes",
                        "Usar desenhos junto das fracoes"
                      ]
                    }
                  }
                }
                """;
    }

    private String validJsonWithoutKit() {
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
