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
        validateKit(content.kit());
    }

    private void validateKit(CompleteLessonKit kit) {
        if (kit == null) {
            throw new LessonPlanValidationException("kit aula completa obrigatorio");
        }
        validateStudentActivity(kit.studentActivity());
        validateTeacherAnswerKey(kit.teacherAnswerKey());
        validateAssessmentInstrument(kit.assessmentInstrument());
        validatePedagogicalEvidence(kit.pedagogicalEvidence());
        validateInclusiveAdaptations(kit.inclusiveAdaptations());
    }

    private void validateStudentActivity(StudentActivity activity) {
        if (activity == null) {
            throw new LessonPlanValidationException("Kit invalido: atividade do aluno");
        }
        requireText(activity.title(), "atividade do aluno");
        requireText(activity.context(), "atividade do aluno");
        requireText(activity.expectedProduct(), "atividade do aluno");
        requireSize(activity.instructions(), 3, Integer.MAX_VALUE, "atividade do aluno");
        requireSize(activity.questions(), 3, Integer.MAX_VALUE, "atividade do aluno");
        requireNonBlank(activity.instructions(), "atividade do aluno");
        requireNonBlank(activity.questions(), "atividade do aluno");
    }

    private void validateTeacherAnswerKey(TeacherAnswerKey answerKey) {
        if (answerKey == null) {
            throw new LessonPlanValidationException("Kit invalido: gabarito do professor");
        }
        requireSize(answerKey.expectedAnswers(), 3, Integer.MAX_VALUE, "gabarito do professor");
        requireSize(answerKey.teacherGuidance(), 2, Integer.MAX_VALUE, "gabarito do professor");
        requireNonBlank(answerKey.expectedAnswers(), "gabarito do professor");
        requireNonBlank(answerKey.teacherGuidance(), "gabarito do professor");
    }

    private void validateAssessmentInstrument(AssessmentInstrument instrument) {
        if (instrument == null) {
            throw new LessonPlanValidationException("Kit invalido: instrumento avaliativo");
        }
        requireSize(instrument.criteria(), 3, Integer.MAX_VALUE, "instrumento avaliativo");
        requireSize(instrument.evidenceCollection(), 2, Integer.MAX_VALUE, "instrumento avaliativo");
        requireNonBlank(instrument.criteria(), "instrumento avaliativo");
        requireNonBlank(instrument.evidenceCollection(), "instrumento avaliativo");
    }

    private void validatePedagogicalEvidence(PedagogicalEvidence evidence) {
        if (evidence == null) {
            throw new LessonPlanValidationException("Kit invalido: evidencias pedagogicas");
        }
        requireSize(evidence.observableEvidences(), 3, Integer.MAX_VALUE, "evidencias pedagogicas");
        requireSize(evidence.recordsForCoordination(), 2, Integer.MAX_VALUE, "evidencias pedagogicas");
        requireNonBlank(evidence.observableEvidences(), "evidencias pedagogicas");
        requireNonBlank(evidence.recordsForCoordination(), "evidencias pedagogicas");
    }

    private void validateInclusiveAdaptations(InclusiveAdaptations adaptations) {
        if (adaptations == null) {
            throw new LessonPlanValidationException("Kit invalido: adaptacoes inclusivas");
        }
        requireSize(adaptations.readingSupport(), 2, Integer.MAX_VALUE, "adaptacoes inclusivas");
        requireSize(adaptations.participationSupport(), 2, Integer.MAX_VALUE, "adaptacoes inclusivas");
        requireSize(adaptations.simplifiedAlternatives(), 2, Integer.MAX_VALUE, "adaptacoes inclusivas");
        requireNonBlank(adaptations.readingSupport(), "adaptacoes inclusivas");
        requireNonBlank(adaptations.participationSupport(), "adaptacoes inclusivas");
        requireNonBlank(adaptations.simplifiedAlternatives(), "adaptacoes inclusivas");
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

    private void requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new LessonPlanValidationException("Texto obrigatorio invalido em " + field);
        }
    }

    private void requireNonBlank(List<String> values, String field) {
        for (String value : values) {
            requireText(value, field);
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
