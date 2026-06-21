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
            require(root, "objectives");
            require(root, "contents");
            JsonNode methodology = require(root, "methodology");
            JsonNode evaluation = require(root, "evaluation");
            rejectUnknownFields(methodology, METHODOLOGY_FIELDS, "methodology");
            rejectUnknownFields(require(methodology, "introduction"), STAGE_FIELDS, "methodology.introduction");
            rejectUnknownFields(require(methodology, "development"), STAGE_FIELDS, "methodology.development");
            rejectUnknownFields(require(methodology, "closing"), STAGE_FIELDS, "methodology.closing");
            rejectUnknownFields(evaluation, EVALUATION_FIELDS, "evaluation");
            LessonPlanContent content = objectMapper.treeToValue(root, LessonPlanContent.class);
            requireNonBlankLists(content);
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

    private void requireNonBlankLists(LessonPlanContent content) {
        requireList(content.objectives(), "objectives");
        requireList(content.contents(), "contents");
        requireList(content.resources(), "resources");
        requireList(content.evaluation().observableCriteria(), "evaluation.observableCriteria");
    }

    private void requireList(java.util.List<String> values, String field) {
        if (values == null || values.isEmpty() || values.stream().anyMatch(value -> value == null || value.isBlank())) {
            throw new LessonPlanValidationException("Lista obrigatoria invalida: " + field);
        }
    }
}
