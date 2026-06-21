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

    private static final Set<String> ROOT_FIELDS = Set.of("objectives", "contents", "methodology", "resources", "evaluation");
    private static final Set<String> METHODOLOGY_FIELDS = Set.of("introduction", "development", "closing");
    private static final Set<String> STAGE_FIELDS = Set.of("durationMinutes", "description");
    private static final Set<String> EVALUATION_FIELDS = Set.of("observableCriteria");

    private final ObjectMapper objectMapper;

    public LessonPlanContent parse(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(extractJsonObject(rawJson));
            requireObject(root, "root");
            rejectUnknownFields(root, ROOT_FIELDS, "root");
            requireStringList(root, "objectives", "objectives");
            requireStringList(root, "contents", "contents");
            requireStringList(root, "resources", "resources");
            JsonNode methodology = require(root, "methodology");
            JsonNode evaluation = require(root, "evaluation");
            rejectUnknownFields(methodology, METHODOLOGY_FIELDS, "methodology");
            requireStage(require(methodology, "introduction"), "methodology.introduction");
            requireStage(require(methodology, "development"), "methodology.development");
            requireStage(require(methodology, "closing"), "methodology.closing");
            rejectUnknownFields(evaluation, EVALUATION_FIELDS, "evaluation");
            requireStringList(evaluation, "observableCriteria", "evaluation.observableCriteria");
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
        String normalized = rawJson.replace("```json", "").replace("```", "").trim();
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
