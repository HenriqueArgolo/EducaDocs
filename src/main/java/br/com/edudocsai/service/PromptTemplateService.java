package br.com.edudocsai.service;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.service.PromptBuilderHelper.GradeLevel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PromptTemplateService {

    private final PromptBuilderHelper promptBuilderHelper;
    private final PromptModuleCatalog promptModuleCatalog;

    public PromptTemplateService(PromptBuilderHelper promptBuilderHelper) {
        this(promptBuilderHelper, new PromptModuleCatalog());
    }

    @Autowired
    public PromptTemplateService(PromptBuilderHelper promptBuilderHelper, PromptModuleCatalog promptModuleCatalog) {
        this.promptBuilderHelper = promptBuilderHelper;
        this.promptModuleCatalog = promptModuleCatalog;
    }

    public String buildPrompt(
            DocumentType documentType,
            List<BNCCSkill> bnccSkills,
            String grade,
            String subject,
            String topic,
            String duration,
            String additionalInstructions,
            Integer numberOfQuestions,
            Boolean includeHeader
    ) {
        return buildPrompt(documentType, bnccSkills, grade, subject, topic, duration, additionalInstructions, numberOfQuestions, includeHeader, "");
    }

    public String buildPrompt(
            DocumentType documentType,
            List<BNCCSkill> bnccSkills,
            String grade,
            String subject,
            String topic,
            String duration,
            String additionalInstructions,
            Integer numberOfQuestions,
            Boolean includeHeader,
            String studentNeeds
    ) {
        GradeLevel level = promptBuilderHelper.classifyGrade(grade);
        String basePrompt = promptModuleCatalog.basePrompt();
        String personaPrompt = promptModuleCatalog.personaPrompt(level, grade);
        String inclusionPrompt = promptBuilderHelper.getInclusionPrompt(studentNeeds);

        String contextHeader = """
                ## CONTEXTO DA GERAÇÃO
                Ano escolar/Nível: %s
                Disciplina: %s
                Tema/Conteúdo: %s
                Tempo de aula/duração: %s
                Instruções adicionais/Contexto complementar: %s

                Habilidades BNCC a serem trabalhadas/avaliadas:
                %s
                """.formatted(
                blankToDefault(grade, summarizeGrades(bnccSkills)),
                blankToDefault(subject, summarizeSubjects(bnccSkills)),
                topic,
                blankToDefault(duration, "50 minutos"),
                blankToDefault(additionalInstructions, "Nenhuma."),
                formatBnccSkills(bnccSkills)
        );

        String taskPrompt = switch (documentType) {
            case EXAM -> {
                int numQuestions = numberOfQuestions != null ? numberOfQuestions : 5;
                yield promptModuleCatalog.assessmentTaskPrompt(level, grade, numQuestions);
            }
            case RUBRIC -> promptModuleCatalog.rubricTaskPrompt(level);
            case REPORT -> promptModuleCatalog.reportTaskPrompt(level);
            case LESSON_PLAN -> throw new IllegalArgumentException("LESSON_PLAN tem fluxo proprio via LessonPlanPromptBuilder");
            default -> throw new IllegalArgumentException("Tipo de documento desconhecido: " + documentType);
        };

        return String.join("\n\n",
                basePrompt,
                personaPrompt,
                inclusionPrompt,
                contextHeader,
                taskPrompt
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

    private String blankToDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }

}
