package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.BNCCSkill;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
                    .map(skill -> Map.of(
                            "codigo", skill.getCode(),
                            "descricao", skill.getDescription()
                    ))
                    .toList());
            root.put("objetivosDeAprendizagem", content.objectives());
            root.put("conteudo", content.contents());
            root.put("metodologia", Map.of(
                    "introducao", stage(content.methodology().introduction()),
                    "desenvolvimento", stage(content.methodology().development()),
                    "fechamento", stage(content.methodology().closing())
            ));
            root.put("recursosDidaticos", content.resources());
            root.put("avaliacao", Map.of("criteriosObservaveis", content.evaluation().observableCriteria()));
            root.put("tempoEstimado", Map.of(
                    "introducao", content.methodology().introduction().durationMinutes(),
                    "desenvolvimento", content.methodology().development().durationMinutes(),
                    "fechamento", content.methodology().closing().durationMinutes(),
                    "total", context.totalMinutes()
            ));
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
        } catch (Exception exception) {
            throw new LessonPlanValidationException("Nao foi possivel montar plano de aula final", exception);
        }
    }

    private Map<String, Object> stage(LessonStage stage) {
        return Map.of(
                "tempoMinutos", stage.durationMinutes(),
                "descricao", stage.description()
        );
    }
}
