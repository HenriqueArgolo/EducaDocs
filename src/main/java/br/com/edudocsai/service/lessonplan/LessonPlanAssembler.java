package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.BNCCSkill;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LessonPlanAssembler {

    private final ObjectMapper objectMapper;

    public String assembleJson(LessonPlanRequestContext context, List<BNCCSkill> skills, LessonPlanContent content) {
        try {
            Map<String, Object> root = new java.util.LinkedHashMap<>();
            root.put("tema", context.topic());
            root.put("disciplina", context.subject());
            root.put("ano", context.grade());
            root.put("habilidadesBncc", skills.stream()
                    .map(this::bnccSkill)
                    .toList());
            root.put("objetivosDeAprendizagem", content.objectives());
            root.put("conteudo", content.contents());
            root.put("metodologia", methodology(content.methodology()));
            root.put("recursosDidaticos", content.resources());
            root.put("avaliacao", evaluation(content.evaluation()));
            root.put("kitAulaCompleta", kit(content.kit()));
            root.put("tempoEstimado", estimatedTime(context, content.methodology()));
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
        } catch (Exception exception) {
            throw new LessonPlanValidationException("Nao foi possivel montar plano de aula final", exception);
        }
    }

    private Map<String, Object> bnccSkill(BNCCSkill skill) {
        Map<String, Object> bnccSkill = new LinkedHashMap<>();
        bnccSkill.put("codigo", skill.getCode());
        bnccSkill.put("descricao", skill.getDescription());
        return bnccSkill;
    }

    private Map<String, Object> methodology(Methodology methodology) {
        Map<String, Object> methodologyMap = new LinkedHashMap<>();
        methodologyMap.put("introducao", stage(methodology.introduction()));
        methodologyMap.put("desenvolvimento", stage(methodology.development()));
        methodologyMap.put("fechamento", stage(methodology.closing()));
        return methodologyMap;
    }

    private Map<String, Object> stage(LessonStage stage) {
        Map<String, Object> stageMap = new LinkedHashMap<>();
        stageMap.put("tempoMinutos", stage.durationMinutes());
        stageMap.put("descricao", stage.description());
        return stageMap;
    }

    private Map<String, Object> evaluation(Evaluation evaluation) {
        Map<String, Object> evaluationMap = new LinkedHashMap<>();
        evaluationMap.put("criteriosObservaveis", evaluation.observableCriteria());
        return evaluationMap;
    }

    private Map<String, Object> kit(CompleteLessonKit kit) {
        Map<String, Object> kitMap = new LinkedHashMap<>();
        kitMap.put("atividadeAluno", studentActivity(kit.studentActivity()));
        kitMap.put("gabaritoProfessor", teacherAnswerKey(kit.teacherAnswerKey()));
        kitMap.put("instrumentoAvaliativo", assessmentInstrument(kit.assessmentInstrument()));
        kitMap.put("evidenciasPedagogicas", pedagogicalEvidence(kit.pedagogicalEvidence()));
        kitMap.put("adaptacoesInclusivas", inclusiveAdaptations(kit.inclusiveAdaptations()));
        return kitMap;
    }

    private Map<String, Object> studentActivity(StudentActivity activity) {
        Map<String, Object> activityMap = new LinkedHashMap<>();
        activityMap.put("titulo", activity.title());
        activityMap.put("contexto", activity.context());
        activityMap.put("orientacoes", activity.instructions());
        activityMap.put("questoes", activity.questions());
        activityMap.put("produtoEsperado", activity.expectedProduct());
        return activityMap;
    }

    private Map<String, Object> teacherAnswerKey(TeacherAnswerKey answerKey) {
        Map<String, Object> answerKeyMap = new LinkedHashMap<>();
        answerKeyMap.put("respostasEsperadas", answerKey.expectedAnswers());
        answerKeyMap.put("orientacoesProfessor", answerKey.teacherGuidance());
        return answerKeyMap;
    }

    private Map<String, Object> assessmentInstrument(AssessmentInstrument instrument) {
        Map<String, Object> instrumentMap = new LinkedHashMap<>();
        instrumentMap.put("criterios", instrument.criteria());
        instrumentMap.put("coletaEvidencias", instrument.evidenceCollection());
        return instrumentMap;
    }

    private Map<String, Object> pedagogicalEvidence(PedagogicalEvidence evidence) {
        Map<String, Object> evidenceMap = new LinkedHashMap<>();
        evidenceMap.put("evidenciasObservaveis", evidence.observableEvidences());
        evidenceMap.put("registrosParaCoordenacao", evidence.recordsForCoordination());
        return evidenceMap;
    }

    private Map<String, Object> inclusiveAdaptations(InclusiveAdaptations adaptations) {
        Map<String, Object> adaptationsMap = new LinkedHashMap<>();
        adaptationsMap.put("apoioLeitura", adaptations.readingSupport());
        adaptationsMap.put("apoioParticipacao", adaptations.participationSupport());
        adaptationsMap.put("alternativasSimplificadas", adaptations.simplifiedAlternatives());
        return adaptationsMap;
    }

    private Map<String, Object> estimatedTime(LessonPlanRequestContext context, Methodology methodology) {
        Map<String, Object> estimatedTime = new LinkedHashMap<>();
        estimatedTime.put("introducao", methodology.introduction().durationMinutes());
        estimatedTime.put("desenvolvimento", methodology.development().durationMinutes());
        estimatedTime.put("fechamento", methodology.closing().durationMinutes());
        estimatedTime.put("total", context.totalMinutes());
        return estimatedTime;
    }
}
