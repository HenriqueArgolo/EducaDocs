package br.com.edudocsai.service.lessonkit;

import br.com.edudocsai.entity.LessonKitMaterialType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class LessonKitContentMapperTest {
    private final LessonKitContentMapper mapper = new LessonKitContentMapper(new ObjectMapper());

    @Test
    void extractsPortugueseEmbeddedSections() {
        String json = """
                {"tema":"Frações","kitAulaCompleta":{
                  "atividadeAluno":{"titulo":"Prática"},
                  "gabaritoProfessor":{"respostasEsperadas":["1/2"]},
                  "instrumentoAvaliativo":{"criterios":["Compara"]},
                  "evidenciasPedagogicas":{"evidenciasObservaveis":["Explica"]},
                  "adaptacoesInclusivas":{"apoioLeitura":["Visual"]}
                }}
                """;

        Map<LessonKitMaterialType, String> result = mapper.extract(json);

        assertThat(result).containsOnlyKeys(
                LessonKitMaterialType.STUDENT_ACTIVITY,
                LessonKitMaterialType.TEACHER_ANSWER_KEY,
                LessonKitMaterialType.ASSESSMENT,
                LessonKitMaterialType.PEDAGOGICAL_EVIDENCE,
                LessonKitMaterialType.INCLUSIVE_ADAPTATIONS);
        assertThat(result.get(LessonKitMaterialType.STUDENT_ACTIVITY)).contains("atividadeAluno", "Prática");
    }

    @Test
    void returnsEmptyMapForPlanWithoutKit() {
        assertThat(mapper.extract("{\"tema\":\"Frações\"}")).isEmpty();
    }

    @Test
    void removesEmbeddedKitWhilePreservingOfficialPlan() {
        String cleaned = mapper.withoutEmbeddedKit("{\"tema\":\"Frações\",\"kitAulaCompleta\":{\"atividadeAluno\":{}}}");
        assertThat(cleaned).contains("Frações").doesNotContain("kitAulaCompleta", "atividadeAluno");
    }
}
