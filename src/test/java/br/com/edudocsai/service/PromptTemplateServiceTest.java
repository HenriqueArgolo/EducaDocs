package br.com.edudocsai.service;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.DocumentType;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PromptTemplateServiceTest {

    @Test
    void buildPromptInjectsOnlyValidatedBnccAndRules() {
        PromptTemplateService service = new PromptTemplateService();
        BNCCSkill skill = BNCCSkill.builder()
                .id(1L)
                .code("EF05MA03")
                .description("Identificar fracoes")
                .subject("Matematica")
                .grade("5 ano")
                .build();

        String prompt = service.buildPrompt(DocumentType.LESSON_PLAN, List.of(skill), "Fracoes", "50 minutos", null);

        assertThat(prompt).contains("EF05MA03");
        assertThat(prompt).contains("Curriculo Nacional da Educacao Basica (BNCC)");
        assertThat(prompt).contains("Tempo de aula: 50 minutos");
        assertThat(prompt).contains("Tipo de documento: PLANO_DE_AULA");
        assertThat(prompt).contains("\"title\": \"\"");
        assertThat(prompt).contains("\"teacher_notes\": \"\"");
    }
}
