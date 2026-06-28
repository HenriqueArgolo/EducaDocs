package br.com.edudocsai.service.lessonplan;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Iterator;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LessonPlanAiParser {

    private static final Set<String> ROOT_FIELDS = Set.of("objectives", "contents", "methodology", "weeklyPlan", "monthlyPlan", "resources", "evaluation", "kit");
    private static final Set<String> METHODOLOGY_FIELDS = Set.of("introduction", "development", "closing");
    private static final Set<String> STAGE_FIELDS = Set.of("durationMinutes", "description");
    private static final Set<String> EVALUATION_FIELDS = Set.of("observableCriteria");
    private static final Set<String> KIT_FIELDS = Set.of("studentActivity", "teacherAnswerKey", "assessmentInstrument", "pedagogicalEvidence", "inclusiveAdaptations");
    private static final Set<String> STUDENT_ACTIVITY_FIELDS = Set.of("title", "context", "instructions", "questions", "expectedProduct");
    private static final Set<String> TEACHER_ANSWER_KEY_FIELDS = Set.of("expectedAnswers", "teacherGuidance");
    private static final Set<String> ASSESSMENT_INSTRUMENT_FIELDS = Set.of("criteria", "evidenceCollection");
    private static final Set<String> PEDAGOGICAL_EVIDENCE_FIELDS = Set.of("observableEvidences", "recordsForCoordination");
    private static final Set<String> INCLUSIVE_ADAPTATIONS_FIELDS = Set.of("readingSupport", "participationSupport", "simplifiedAlternatives");

    private final ObjectMapper objectMapper;

    public LessonPlanContent parse(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(extractJsonObject(rawJson));
            requireObject(root, "root");
            rejectUnknownFields(root, ROOT_FIELDS, "root");
            requireStringList(root, "objectives", "objectives");
            requireStringList(root, "contents", "contents");
            requireStringList(root, "resources", "resources");
            
            if (root.has("methodology") && !root.path("methodology").isNull()) {
                JsonNode methodology = root.get("methodology");
                rejectUnknownFields(methodology, METHODOLOGY_FIELDS, "methodology");
                requireStage(require(methodology, "introduction"), "methodology.introduction");
                requireStage(require(methodology, "development"), "methodology.development");
                requireStage(require(methodology, "closing"), "methodology.closing");
            } else if (!root.has("weeklyPlan") && !root.has("monthlyPlan")) {
                throw new LessonPlanValidationException("Missing required field 'methodology' or 'weeklyPlan' or 'monthlyPlan'");
            }
            
            JsonNode evaluation = require(root, "evaluation");
            rejectUnknownFields(evaluation, EVALUATION_FIELDS, "evaluation");
            requireStringList(evaluation, "observableCriteria", "evaluation.observableCriteria");
            JsonNode kit = require(root, "kit");
            requireKit(kit);
            LessonPlanContent content = objectMapper.treeToValue(root, LessonPlanContent.class);
            return content;
        } catch (LessonPlanValidationException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new LessonPlanValidationException("Resposta da IA nao segue o schema do plano de aula", exception);
        }
    }

    private String extractJsonObject(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            throw new LessonPlanValidationException("Resposta da IA esta vazia");
        }
        String normalized = rawJson.trim();
        int start = normalized.indexOf('{');
        int end = normalized.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new LessonPlanValidationException("Resposta da IA nao contem objeto JSON");
        }
        return normalized.substring(start, end + 1);
    }

    private JsonNode require(JsonNode node, String field) {
        JsonNode child = node.path(field);
        if (child.isMissingNode() || child.isNull()) {
            throw new LessonPlanValidationException("Campo obrigatorio ausente: " + field);
        }
        return child;
    }

    private void requireObject(JsonNode node, String path) {
        if (!node.isObject()) {
            throw new LessonPlanValidationException("Campo deve ser objeto: " + path);
        }
    }

    private void rejectUnknownFields(JsonNode node, Set<String> allowed, String path) {
        requireObject(node, path);
        Iterator<String> fields = node.fieldNames();
        while (fields.hasNext()) {
            String field = fields.next();
            if (!allowed.contains(field)) {
                throw new LessonPlanValidationException("Campo nao permitido em " + path + ": " + field);
            }
        }
    }

    private void requireStage(JsonNode stage, String path) {
        rejectUnknownFields(stage, STAGE_FIELDS, path);
        JsonNode durationMinutes = require(stage, "durationMinutes", path + ".durationMinutes");
        if (!durationMinutes.isIntegralNumber()) {
            throw new LessonPlanValidationException("Campo deve ser inteiro: " + path + ".durationMinutes");
        }
        JsonNode description = require(stage, "description", path + ".description");
        requireText(description, path + ".description");
    }

    private void requireKit(JsonNode kit) {
        rejectUnknownFields(kit, KIT_FIELDS, "kit");
        requireStudentActivity(require(kit, "studentActivity", "kit.studentActivity"), "kit.studentActivity");
        requireTeacherAnswerKey(require(kit, "teacherAnswerKey", "kit.teacherAnswerKey"), "kit.teacherAnswerKey");
        requireAssessmentInstrument(require(kit, "assessmentInstrument", "kit.assessmentInstrument"), "kit.assessmentInstrument");
        requirePedagogicalEvidence(require(kit, "pedagogicalEvidence", "kit.pedagogicalEvidence"), "kit.pedagogicalEvidence");
        requireInclusiveAdaptations(require(kit, "inclusiveAdaptations", "kit.inclusiveAdaptations"), "kit.inclusiveAdaptations");
    }

    private void requireStudentActivity(JsonNode node, String path) {
        rejectUnknownFields(node, STUDENT_ACTIVITY_FIELDS, path);
        requireText(require(node, "title", path + ".title"), path + ".title");
        requireText(require(node, "context", path + ".context"), path + ".context");
        requireStringList(node, "instructions", path + ".instructions");
        requireStringList(node, "questions", path + ".questions");
        requireText(require(node, "expectedProduct", path + ".expectedProduct"), path + ".expectedProduct");
    }

    private void requireTeacherAnswerKey(JsonNode node, String path) {
        rejectUnknownFields(node, TEACHER_ANSWER_KEY_FIELDS, path);
        requireStringList(node, "expectedAnswers", path + ".expectedAnswers");
        requireStringList(node, "teacherGuidance", path + ".teacherGuidance");
    }

    private void requireAssessmentInstrument(JsonNode node, String path) {
        rejectUnknownFields(node, ASSESSMENT_INSTRUMENT_FIELDS, path);
        requireStringList(node, "criteria", path + ".criteria");
        requireStringList(node, "evidenceCollection", path + ".evidenceCollection");
    }

    private void requirePedagogicalEvidence(JsonNode node, String path) {
        rejectUnknownFields(node, PEDAGOGICAL_EVIDENCE_FIELDS, path);
        requireStringList(node, "observableEvidences", path + ".observableEvidences");
        requireStringList(node, "recordsForCoordination", path + ".recordsForCoordination");
    }

    private void requireInclusiveAdaptations(JsonNode node, String path) {
        rejectUnknownFields(node, INCLUSIVE_ADAPTATIONS_FIELDS, path);
        requireStringList(node, "readingSupport", path + ".readingSupport");
        requireStringList(node, "participationSupport", path + ".participationSupport");
        requireStringList(node, "simplifiedAlternatives", path + ".simplifiedAlternatives");
    }

    private void requireStringList(JsonNode node, String field, String path) {
        JsonNode values = require(node, field);
        if (!values.isArray() || values.isEmpty()) {
            throw new LessonPlanValidationException("Lista obrigatoria invalida: " + path);
        }
        for (JsonNode value : values) {
            requireText(value, path);
        }
    }

    private JsonNode require(JsonNode node, String field, String path) {
        JsonNode child = node.path(field);
        if (child.isMissingNode() || child.isNull()) {
            throw new LessonPlanValidationException("Campo obrigatorio ausente: " + path);
        }
        return child;
    }

    private void requireText(JsonNode node, String path) {
        if (!node.isTextual() || node.asText().isBlank()) {
            throw new LessonPlanValidationException("Campo texto obrigatorio invalido: " + path);
        }
    }
}
