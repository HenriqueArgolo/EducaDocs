package br.com.edudocsai.service;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.DocumentType;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PromptTemplateService {

    public String buildPrompt(
            DocumentType documentType,
            List<BNCCSkill> bnccSkills,
            String topic,
            String duration,
            String additionalInstructions
    ) {
        return """
                Voce e um especialista em pedagogia brasileira e planejamento educacional alinhado ao Curriculo Nacional da Educacao Basica (BNCC).

                Sua tarefa e gerar um documento pedagogico completo e pronto para uso em escolas brasileiras.

                ## REGRAS CRITICAS (OBRIGATORIO)
                - NUNCA invente codigos BNCC.
                - Use SOMENTE as habilidades fornecidas no contexto.
                - Nao crie competencias ou habilidades inexistentes.
                - Linguagem formal, tecnica e apropriada para documentos oficiais escolares.
                - Estrutura deve estar pronta para ser usada sem edicao significativa.
                - Sempre alinhar o conteudo a BNCC e a pratica pedagogica brasileira.
                - Retorne apenas JSON valido, sem markdown e sem texto fora do JSON.

                ---

                ## CONTEXTO BNCC (FORNECIDO PELO SISTEMA)

                Ano escolar: %s

                Disciplina: %s

                Habilidades BNCC:
                %s

                ---

                ## DADOS DO PROFESSOR

                Tema: %s

                Tipo de documento: %s
                (opcoes: PLANO_DE_AULA, PROVA, RUBRICA, RELATORIO)

                Tempo de aula: %s

                Contexto adicional:
                %s

                Orientacao especifica por tipo de documento:
                %s

                ---

                ## OBJETIVO

                Gerar um documento pedagogico completo, estruturado e pronto para uso em escola publica ou privada no Brasil.

                ---

                ## ESTRUTURA OBRIGATORIA DE SAIDA

                RETORNE O RESULTADO EM JSON ESTRUTURADO:

                {
                  "title": "",
                  "objective": "",
                  "bncc_alignment": [],
                  "methodology": "",
                  "activities": [],
                  "resources": [],
                  "assessment": "",
                  "detailed_content": "",
                  "teacher_notes": ""
                }

                ---

                ## REGRAS DE QUALIDADE

                - Objetivos claros e mensuraveis.
                - Atividades progressivas no formato inicio, desenvolvimento e fechamento.
                - Metodologia alinhada a pratica construtivista/interativa.
                - Avaliacao coerente com BNCC.
                - Linguagem natural, nao robotica.
                - Conteudo aplicavel em sala de aula real.

                ---

                ## IMPORTANTE

                Se faltar informacao:
                - nao invente BNCC.
                - use apenas o que foi fornecido.
                - adapte o texto sem criar dados novos.

                Agora gere o documento completo.
                """.formatted(
                summarizeGrades(bnccSkills),
                summarizeSubjects(bnccSkills),
                formatBnccSkills(bnccSkills),
                topic,
                documentTypeForPrompt(documentType),
                blankToDefault(duration, "50 minutos"),
                blankToDefault(additionalInstructions, "Nenhuma."),
                jsonStructureFor(documentType)
        );
    }

    private String formatBnccSkills(List<BNCCSkill> skills) {
        return skills.stream()
                .map(skill -> "- %s - %s".formatted(skill.getCode(), skill.getDescription()))
                .collect(java.util.stream.Collectors.joining("\n"));
    }

    private String summarizeGrades(List<BNCCSkill> skills) {
        return summarize(skills.stream().map(BNCCSkill::getGrade).toList());
    }

    private String summarizeSubjects(List<BNCCSkill> skills) {
        return summarize(skills.stream().map(BNCCSkill::getSubject).toList());
    }

    private String summarize(List<String> values) {
        String joined = values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));
        return joined.isBlank() ? "Nao informado" : joined;
    }

    private String documentTypeForPrompt(DocumentType documentType) {
        return switch (documentType) {
            case LESSON_PLAN -> "PLANO_DE_AULA";
            case EXAM -> "PROVA";
            case RUBRIC -> "RUBRICA";
            case REPORT -> "RELATORIO";
        };
    }

    private String jsonStructureFor(DocumentType documentType) {
        return switch (documentType) {
            case LESSON_PLAN -> """
                    Plano de aula deve conter objetivo, metodologia, atividades progressivas, recursos, avaliacao e notas ao professor.
                    """;
            case EXAM -> """
                    Prova deve conter orientacoes, questoes, criterios de correcao e alinhamento BNCC em texto pronto para aplicacao.
                    """;
            case RUBRIC -> """
                    Rubrica deve conter criterios observaveis, niveis de desempenho e orientacoes de uso pelo professor.
                    """;
            case REPORT -> """
                    Relatorio deve conter contexto, analise pedagogica, observacoes, recomendacoes e proximos passos.
                    """;
        };
    }

    private String blankToDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }
}
