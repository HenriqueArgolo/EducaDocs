package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.DocumentType;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LessonPlanPromptBuilderTest {

    private final LessonPlanPromptBuilder builder = new LessonPlanPromptBuilder();

    @Test
    void buildsPromptThatRestrictsAiToInternalContentOnly() {
        LessonPlanRequestContext context = new LessonPlanRequestContext(
                DocumentType.LESSON_PLAN,
                List.of(1L),
                "Fracoes equivalentes",
                "5 ano",
                "Matematica",
                "50 minutos",
                50,
                null
        );

        String prompt = builder.build(context, List.of(skill()));

        assertThat(prompt).contains("Fracoes equivalentes");
        assertThat(prompt).contains("EF05MA03");
        assertThat(prompt).contains("\"objectives\"");
        assertThat(prompt).contains("\"methodology\"");
        assertThat(prompt).doesNotContain("\"tema\"");
        assertThat(prompt).doesNotContain("\"disciplina\"");
        assertThat(prompt).doesNotContain("\"ano\"");
        assertThat(prompt).contains("nao crie secoes finais");
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
