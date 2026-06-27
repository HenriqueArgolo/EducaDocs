package br.com.edudocsai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EarlyLiteracyWorksheetNormalizerTest {

    private final EarlyLiteracyWorksheetNormalizer normalizer = new EarlyLiteracyWorksheetNormalizer(new ObjectMapper());
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void replacesOffTopicTextualAiOutputWithThemeVisualWorksheet() throws Exception {
        String invalidJson = """
                {
                  "titulo": "Atividade qualquer",
                  "layout": "ALFABETIZACAO_VISUAL",
                  "exercicios": [
                    {
                      "numero": 1,
                      "tipo": "INTERPRETACAO_DE_TEXTO",
                      "comando": "Leia o texto com muita atencao e responda a pergunta completa no caderno",
                      "itens": [
                        {"palavra": "DINOSSAURO", "figura": "dinossauro"}
                      ],
                      "gabarito": "resposta longa"
                    }
                  ]
                }
                """;

        String normalized = normalizer.normalize(invalidJson, "animais da fazenda", 4);
        var root = mapper.readTree(normalized);

        assertThat(root.path("layout").asText()).isEqualTo("ALFABETIZACAO_VISUAL_V2");
        assertThat(root.path("exercicios")).hasSize(4);
        assertThat(normalized).contains("VACA").contains("PATO").doesNotContain("DINOSSAURO");
        assertThat(root.path("exercicios").findValuesAsText("tipo")).contains("SEPARAR_SILABAS", "LETRA_INICIAL");

        for (var command : root.path("exercicios").findValuesAsText("comando")) {
            assertThat(command.split("\\s+")).hasSizeLessThanOrEqualTo(8);
        }
    }

    @Test
    void preservesValidThemeItemsAndAnswerKey() throws Exception {
        String validJson = """
                {
                  "titulo": "Animais da fazenda",
                  "layout": "ALFABETIZACAO_VISUAL",
                  "descricao": "Ficha visual",
                  "exercicios": [
                    {
                      "numero": 1,
                      "tipo": "SEPARAR_SILABAS",
                      "comando": "Separe as silabas.",
                      "itens": [
                        {"palavra": "VACA", "figura": "vaca", "caixasResposta": 2}
                      ],
                      "gabarito": "VA-CA"
                    },
                    {
                      "numero": 2,
                      "tipo": "LETRA_INICIAL",
                      "comando": "Pinte a letra inicial.",
                      "itens": [
                        {"palavra": "PATO", "figura": "pato", "opcoes": ["P", "B", "T"], "resposta": "P"}
                      ],
                      "gabarito": "P"
                    }
                  ]
                }
                """;

        String normalized = normalizer.normalize(validJson, "animais da fazenda", 3);
        var root = mapper.readTree(normalized);

        assertThat(root.path("titulo").asText()).isEqualTo("Animais da fazenda");
        assertThat(root.path("exercicios").get(0).path("itens").get(0).path("palavra").asText()).isEqualTo("VACA");
        assertThat(root.path("exercicios").get(0).path("gabarito").asText()).isEqualTo("VA-CA");
        assertThat(root.path("exercicios").findValuesAsText("tipo")).contains("SEPARAR_SILABAS", "LETRA_INICIAL");
    }

    @Test
    void preservesChristmasItemsAndAnswerKey() throws Exception {
        String validJson = """
                {
                  "titulo": "Atividade de Natal",
                  "layout": "ALFABETIZACAO_VISUAL",
                  "descricao": "Ficha visual",
                  "exercicios": [
                    {
                      "numero": 1,
                      "tipo": "SEPARAR_SILABAS",
                      "comando": "Separe as silabas.",
                      "itens": [
                        {"palavra": "SINO", "figura": "sino", "caixasResposta": 2}
                      ],
                      "gabarito": "SI-NO"
                    },
                    {
                      "numero": 2,
                      "tipo": "LETRA_INICIAL",
                      "comando": "Pinte a letra inicial.",
                      "itens": [
                        {"palavra": "VELA", "figura": "vela", "opcoes": ["V", "E", "L"], "resposta": "V"}
                      ],
                      "gabarito": "V"
                    }
                  ]
                }
                """;

        String normalized = normalizer.normalize(validJson, "natal", 3);
        var root = mapper.readTree(normalized);

        assertThat(root.path("titulo").asText()).isEqualTo("Atividade de Natal");
        assertThat(root.path("exercicios").get(0).path("itens").get(0).path("palavra").asText()).isEqualTo("SINO");
        assertThat(root.path("exercicios").get(0).path("gabarito").asText()).isEqualTo("SI-NO");
        assertThat(root.path("exercicios").findValuesAsText("tipo")).contains("SEPARAR_SILABAS", "LETRA_INICIAL");
    }
}
