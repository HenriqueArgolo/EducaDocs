package br.com.edudocsai.service.lessonplan;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class TemplateValidator {

    private static final Set<String> OBSERVABLE_VERBS = Set.of(
            "identificar", "reconhecer", "comparar", "analisar", "argumentar", "interpretar",
            "resolver", "relacionar", "descrever", "explicar", "classificar", "avaliar"
    );

    private static final Set<String> CRITERION_ACTION_VERBS = Set.of(
            "identifica", "relaciona", "interpreta", "compara", "registra", "argumenta",
            "resolve", "explica", "analisa", "descreve", "justifica", "aplica"
    );

    public void validate(LessonPlanContent content, int totalMinutes) {
        requireSize(content.objectives(), 3, 5, "objetivos");
        for (String objective : content.objectives()) {
            String firstWord = firstWord(objective);
            if (!OBSERVABLE_VERBS.contains(firstWord)) {
                throw new LessonPlanValidationException("Objetivo deve iniciar com verbo observavel: " + objective);
            }
        }
        requireSize(content.contents(), 3, Integer.MAX_VALUE, "conteudos");
        requireSize(content.resources(), 3, Integer.MAX_VALUE, "recursos");
        requireSize(content.evaluation().observableCriteria(), 3, Integer.MAX_VALUE, "criterios avaliativos");
        rejectGenericAssessment(content.evaluation().observableCriteria());
        validateObservableCriteria(content.evaluation().observableCriteria());
        validateStage(content.methodology().introduction(), 5, 15, "introducao");
        validateStage(content.methodology().development(), 20, 40, "desenvolvimento");
        validateStage(content.methodology().closing(), 5, 15, "fechamento");
        int sum = content.methodology().introduction().durationMinutes()
                + content.methodology().development().durationMinutes()
                + content.methodology().closing().durationMinutes();
        if (sum != totalMinutes) {
            throw new LessonPlanValidationException("A soma das etapas deve ser igual a duracao informada");
        }
    }

    private void validateStage(LessonStage stage, int min, int max, String name) {
        if (stage == null || stage.durationMinutes() == null || stage.description() == null || stage.description().isBlank()) {
            throw new LessonPlanValidationException("Etapa metodologica invalida: " + name);
        }
        if (stage.durationMinutes() < min || stage.durationMinutes() > max) {
            throw new LessonPlanValidationException("Tempo invalido para " + name);
        }
    }

    private void requireSize(List<String> values, int min, int max, String field) {
        if (values == null || values.size() < min || values.size() > max) {
            throw new LessonPlanValidationException("Quantidade invalida em " + field);
        }
    }

    private void rejectGenericAssessment(List<String> criteria) {
        boolean onlyParticipation = criteria.stream()
                .map(LessonPlanTextNormalizer::normalize)
                .allMatch(value -> value.equals("participacao") || value.equals("participacao dos alunos"));
        if (onlyParticipation) {
            throw new LessonPlanValidationException("Avaliacao deve conter criterios observaveis");
        }
    }

    private void validateObservableCriteria(List<String> criteria) {
        for (String criterion : criteria) {
            if (!containsCriterionActionVerb(criterion)) {
                throw new LessonPlanValidationException("Avaliacao deve conter criterios observaveis");
            }
        }
    }

    private boolean containsCriterionActionVerb(String criterion) {
        String normalized = LessonPlanTextNormalizer.normalize(criterion);
        for (String word : normalized.split(" ")) {
            if (CRITERION_ACTION_VERBS.contains(word)) {
                return true;
            }
        }
        return false;
    }

    private String firstWord(String value) {
        String normalized = LessonPlanTextNormalizer.normalize(value);
        int space = normalized.indexOf(' ');
        return space < 0 ? normalized : normalized.substring(0, space);
    }
}
