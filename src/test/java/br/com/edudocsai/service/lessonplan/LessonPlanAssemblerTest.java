package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.DocumentType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LessonPlanAssemblerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final LessonPlanAssembler assembler = new LessonPlanAssembler(objectMapper);

    @Test
    void assemblesFinalJsonUsingSystemOwnedFields() throws Exception {
        LessonPlanRequestContext context = new LessonPlanRequestContext(
                DocumentType.LESSON_PLAN,
                List.of(1L),
                "Fracoes equivalentes",
                "5 ano",
                "Matematica",
                "50 minutos",
                50,
                null,
                br.com.edudocsai.entity.TemplateStyle.INSTITUTIONAL
        );

        String json = assembler.assembleJson(context, List.of(skill()), TemplateValidatorTest.validContent());
        JsonNode root = objectMapper.readTree(json);

        assertThat(root.path("tema").asText()).isEqualTo("Fracoes equivalentes");
        assertThat(root.path("disciplina").asText()).isEqualTo("Matematica");
        assertThat(root.path("ano").asText()).isEqualTo("5 ano");
        assertThat(root.path("habilidadesBncc").path(0).path("codigo").asText()).isEqualTo("EF05MA03");
        assertThat(root.path("tempoEstimado").path("total").asInt()).isEqualTo(50);
        assertThat(root.path("kitAulaCompleta").path("atividadeAluno").path("titulo").asText())
                .isEqualTo("Linha do tempo das fracoes");
        assertThat(root.path("kitAulaCompleta").path("gabaritoProfessor").path("respostasEsperadas").path(0).asText())
                .contains("Fracoes equivalentes");
        assertThat(json).doesNotContain("question_number");
        assertThat(json).doesNotContain("teacher_notes");
        assertThat(json).doesNotContain("studentActivity");
        assertThat(json).doesNotContain("teacherAnswerKey");
        assertThat(json).doesNotContain("tempo_sugerido");
    }

    @Test
    void assemblesNestedObjectsWithCanonicalFieldOrder() {
        LessonPlanRequestContext context = new LessonPlanRequestContext(
                DocumentType.LESSON_PLAN,
                List.of(1L),
                "Fracoes equivalentes",
                "5 ano",
                "Matematica",
                "50 minutos",
                50,
                null,
                br.com.edudocsai.entity.TemplateStyle.INSTITUTIONAL
        );

        String json = assembler.assembleJson(context, List.of(skill()), TemplateValidatorTest.validContent());

        assertThat(json).containsSubsequence(
                "\"habilidadesBncc\"",
                "\"codigo\"",
                "\"descricao\""
        );
        assertThat(json).containsSubsequence(
                "\"kitAulaCompleta\"",
                "\"atividadeAluno\"",
                "\"gabaritoProfessor\"",
                "\"instrumentoAvaliativo\"",
                "\"evidenciasPedagogicas\"",
                "\"adaptacoesInclusivas\""
        );
        assertThat(json).containsSubsequence(
                "\"tempoEstimado\"",
                "\"introducao\"",
                "\"desenvolvimento\"",
                "\"fechamento\"",
                "\"total\""
        );
    }

    private BNCCSkill skill() {
        return BNCCSkill.builder()
                .id(1L)
                .code("EF05MA03")
                .description("Identificar fracoes equivalentes")
                .subject("Matematica")
                .grade("5 ano")
                .build();
    }
}
