package br.com.edudocsai.service;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.DocumentType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PromptTemplateServiceTest {

    @Test
    void buildPromptInjectsOnlyValidatedBnccAndRules() {
        PromptTemplateService service = new PromptTemplateService(new ObjectMapper());
        BNCCSkill skill = BNCCSkill.builder()
                .id(1L)
                .code("EF05MA03")
                .description("Identificar fracoes")
                .subject("Matematica")
                .grade("5 ano")
                .build();

        String prompt = service.buildPrompt(DocumentType.LESSON_PLAN, List.of(skill), "Fracoes", null);

        assertThat(prompt).contains("EF05MA03");
        assertThat(prompt).contains("Use somente as habilidades BNCC fornecidas");
        assertThat(prompt).contains("Nao invente codigos");
        assertThat(prompt).contains("\"tipo\": \"LESSON_PLAN\"");
    }
}
