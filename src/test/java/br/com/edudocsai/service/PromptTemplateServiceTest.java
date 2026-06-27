package br.com.edudocsai.service;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.DocumentType;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PromptTemplateServiceTest {

    @Test
    void buildPromptInjectsOnlyValidatedBnccAndRules() {
        PromptTemplateService service = new PromptTemplateService(new PromptBuilderHelper());
        BNCCSkill skill = BNCCSkill.builder()
                .id(1L)
                .code("EF05MA03")
                .description("Identificar fracoes")
                .subject("Matematica")
                .grade("1\u00ba ao 5\u00ba ano")
                .build();

        String prompt = service.buildPrompt(
                DocumentType.EXAM,
                List.of(skill),
                "5\u00ba ano",
                "Matem\u00e1tica",
                "Fracoes",
                "50 minutos",
                null,
                5,
                true
        );

        assertThat(prompt).contains("EF05MA03");
        assertThat(prompt).contains("5\u00ba ano");
        assertThat(prompt).contains("Ano escolar/Nível: 5\u00ba ano");
        assertThat(prompt).contains("BNCC");
        assertThat(prompt).contains("AVALIAÇÃO DIAGNÓSTICA");
    }

    @Test
    void buildPromptUsesObservationRegistryForEarlyChildhoodExam() {
        PromptTemplateService service = new PromptTemplateService(new PromptBuilderHelper());
        BNCCSkill skill = BNCCSkill.builder()
                .id(2L)
                .code("EI03TS02")
                .description("Expressar-se livremente por meio de desenho, pintura, colagem e dobradura")
                .subject("Traços, sons, cores e formas")
                .grade("Crianças pequenas")
                .build();

        String prompt = service.buildPrompt(
                DocumentType.EXAM,
                List.of(skill),
                "Crianças pequenas",
                "Traços, sons, cores e formas",
                "Cores da natureza",
                "30 minutos",
                null,
                5,
                true
        );

        assertThat(prompt)
                .contains("ROTEIRO DE OBSERVAÇÃO E REGISTRO")
                .contains("comportamentos observáveis")
                .contains("não em testes formais")
                .contains("\"tipoAvaliacao\": \"OBSERVACAO_INFANTIL\"")
                .contains("\"indicadoresObservaveis\"")
                .contains("\"registrosProfessor\"");
        assertThat(prompt)
                .doesNotContain("EXATAMENTE 5 questões")
                .doesNotContain("\"questoes\"");
    }

    @Test
    void buildPromptUsesInitialLiteracyVisualAssessmentForFirstGrade() {
        PromptTemplateService service = new PromptTemplateService(new PromptBuilderHelper());

        String prompt = service.buildPrompt(
                DocumentType.EXAM,
                List.of(skill("EF01LP05", "Reconhecer o sistema de escrita alfabetica", "Língua Portuguesa", "1º ano")),
                "1º ano",
                "Língua Portuguesa",
                "Separação de sílabas",
                "40 minutos",
                null,
                5,
                true
        );

        assertThat(prompt)
                .contains("ALFABETIZACAO_INICIAL")
                .contains("atividade visual de alfabetização")
                .contains("figuras permitidas")
                .contains("SEPARAR_SILABAS")
                .contains("LETRA_INICIAL")
                .contains("\"atividadesVisuais\"")
                .contains("\"caixasResposta\"");
        assertThat(prompt)
                .doesNotContain("EXATAMENTE 5 questões")
                .doesNotContain("\"questoes\"");
    }

    @Test
    void buildPromptUsesInitialYearsExamGuidanceFromMasterPrompt() {
        PromptTemplateService service = new PromptTemplateService(new PromptBuilderHelper());

        String prompt = service.buildPrompt(
                DocumentType.EXAM,
                List.of(skill("EF03MA05", "Utilizar diferentes procedimentos de cálculo", "Matemática", "3º ano")),
                "3º ano",
                "Matemática",
                "As quatro operações",
                "40 minutos",
                null,
                4,
                true
        );

        assertThat(prompt)
                .contains("Anos Iniciais")
                .contains("3 opções")
                .contains("Clara, direta")
                .doesNotContain("5 alternativas");
    }

    @Test
    void buildPromptUsesFinalYearsExamGuidanceFromMasterPrompt() {
        PromptTemplateService service = new PromptTemplateService(new PromptBuilderHelper());

        String prompt = service.buildPrompt(
                DocumentType.EXAM,
                List.of(skill("EF08HI05", "Identificar e analisar processos históricos", "História", "8º ano")),
                "8º ano",
                "História",
                "A Crise de 1929",
                "50 minutos",
                null,
                5,
                true
        );

        assertThat(prompt)
                .contains("Anos Finais")
                .contains("4 opções")
                .contains("capacidade de análise");
    }

    @Test
    void buildPromptUsesHighSchoolExamGuidanceFromMasterPrompt() {
        PromptTemplateService service = new PromptTemplateService(new PromptBuilderHelper());

        String prompt = service.buildPrompt(
                DocumentType.EXAM,
                List.of(skill("EM13CHS101", "Analisar e comparar narrativas sobre o passado", "História", "Ensino Médio")),
                "Ensino Médio",
                "História",
                "Globalização",
                "60 minutos",
                null,
                5,
                true
        );

        assertThat(prompt)
                .contains("Ensino Médio")
                .contains("5 Alternativas")
                .contains("gabarito deve conter");
    }

    @Test
    void buildPromptUsesEjaExamGuidanceFromMasterPrompt() {
        PromptTemplateService service = new PromptTemplateService(new PromptBuilderHelper());

        String prompt = service.buildPrompt(
                DocumentType.EXAM,
                List.of(skill("EJAMA01", "Resolver problemas financeiros do cotidiano", "Matemática", "EJA")),
                "EJA",
                "Matemática",
                "Educação financeira para o dia a dia",
                "40 minutos",
                null,
                4,
                true
        );

        assertThat(prompt)
                .contains("EJA")
                .contains("mundo do trabalho")
                .contains("3-4 opções")
                .contains("infantilize");
    }

    @Test
    void buildPromptUsesLevelSpecificRubricGuidanceFromMasterPrompt() {
        PromptTemplateService service = new PromptTemplateService(new PromptBuilderHelper());

        String initialYearsPrompt = service.buildPrompt(
                DocumentType.RUBRIC,
                List.of(skill("EF03LP05", "Planejar e produzir textos", "Língua Portuguesa", "3º ano")),
                "3º ano",
                "Língua Portuguesa",
                "Produção de texto",
                "50 minutos",
                null,
                null,
                true
        );
        String highSchoolPrompt = service.buildPrompt(
                DocumentType.RUBRIC,
                List.of(skill("EM13LGG103", "Analisar o funcionamento da linguagem", "Língua Portuguesa", "Ensino Médio")),
                "Ensino Médio",
                "Língua Portuguesa",
                "Redação para vestibular",
                "50 minutos",
                null,
                null,
                true
        );
        String ejaPrompt = service.buildPrompt(
                DocumentType.RUBRIC,
                List.of(skill("EJALP01", "Interpretar textos informativos", "Língua Portuguesa", "EJA")),
                "EJA",
                "Língua Portuguesa",
                "Apresentação de um tema do cotidiano",
                "50 minutos",
                null,
                null,
                true
        );

        assertThat(initialYearsPrompt)
                .contains("3-4 critérios principais")
                .contains("Precisa de Ajuda");
        assertThat(highSchoolPrompt)
                .contains("5-6 critérios principais")
                .contains("autonomia intelectual");
        assertThat(ejaPrompt)
                .contains("Conexão com a Realidade")
                .contains("evitando infantilização");
    }

    @Test
    void buildPromptUsesLevelSpecificReportGuidanceFromMasterPrompt() {
        PromptTemplateService service = new PromptTemplateService(new PromptBuilderHelper());

        String earlyChildhoodPrompt = service.buildPrompt(
                DocumentType.REPORT,
                List.of(skill("EI03EO04", "Comunicar ideias e sentimentos", "O Eu, o Outro e o Nós", "Crianças pequenas")),
                "Crianças pequenas",
                "O Eu, o Outro e o Nós",
                "Relatório do período",
                "50 minutos",
                "Aluno: Maria; pontos fortes: criatividade; dificuldade: compartilhar materiais",
                null,
                true
        );
        String ejaPrompt = service.buildPrompt(
                DocumentType.REPORT,
                List.of(skill("EJAGEO01", "Interpretar documentos do cotidiano", "Geografia", "EJA")),
                "EJA",
                "Geografia",
                "Relatório do período",
                "50 minutos",
                "Aluno: Carlos; pontos fortes: experiência profissional",
                null,
                true
        );

        assertThat(earlyChildhoodPrompt)
                .contains("Educação Infantil - Relatório")
                .contains("Desenvolvimento integral")
                .contains("NUNCA use termos como");
        assertThat(ejaPrompt)
                .contains("EJA - Relatório de Desempenho")
                .contains("vida profissional")
                .contains("infantilize");
    }

    private BNCCSkill skill(String code, String description, String subject, String grade) {
        return BNCCSkill.builder()
                .id(10L)
                .code(code)
                .description(description)
                .subject(subject)
                .grade(grade)
                .build();
    }
}
