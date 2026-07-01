package br.com.edudocsai.service.lessonkit;

import br.com.edudocsai.entity.LessonKitMaterialType;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class LessonKitContentMapper {
    private final ObjectMapper objectMapper;

    public Map<LessonKitMaterialType, String> extract(String content) {
        EnumMap<LessonKitMaterialType, String> result = new EnumMap<>(LessonKitMaterialType.class);
        try {
            JsonNode root = objectMapper.readTree(content);
            JsonNode kit = first(root, "kitAulaCompleta", "kit");
            if (kit == null || !kit.isObject()) return result;
            add(result, kit, LessonKitMaterialType.STUDENT_ACTIVITY, "atividadeAluno", "studentActivity");
            add(result, kit, LessonKitMaterialType.TEACHER_ANSWER_KEY, "gabaritoProfessor", "teacherAnswerKey");
            add(result, kit, LessonKitMaterialType.ASSESSMENT, "instrumentoAvaliativo", "assessmentInstrument");
            add(result, kit, LessonKitMaterialType.PEDAGOGICAL_EVIDENCE, "evidenciasPedagogicas", "pedagogicalEvidence");
            add(result, kit, LessonKitMaterialType.INCLUSIVE_ADAPTATIONS, "adaptacoesInclusivas", "inclusiveAdaptations");
            return result;
        } catch (JsonProcessingException exception) {
            return result;
        }
    }

    public String withoutEmbeddedKit(String content) {
        try {
            JsonNode parsed = objectMapper.readTree(content);
            if (!(parsed instanceof ObjectNode root)) return content;
            root.remove(List.of("kitAulaCompleta", "kit"));
            return objectMapper.writeValueAsString(root);
        } catch (JsonProcessingException exception) {
            return content;
        }
    }

    private void add(Map<LessonKitMaterialType, String> target, JsonNode kit,
                     LessonKitMaterialType type, String publicKey, String alias) throws JsonProcessingException {
        JsonNode value = first(kit, publicKey, alias);
        if (value == null || value.isNull() || value.isMissingNode()) return;
        ObjectNode wrapper = objectMapper.createObjectNode();
        wrapper.set(publicKey, value);
        target.put(type, objectMapper.writeValueAsString(wrapper));
    }

    private JsonNode first(JsonNode parent, String first, String second) {
        if (parent.has(first)) return parent.get(first);
        if (parent.has(second)) return parent.get(second);
        return null;
    }
}
