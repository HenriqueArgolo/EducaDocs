package br.com.edudocsai.service.lessonplan;

import java.util.List;
import com.fasterxml.jackson.databind.JsonNode;

public record LessonPlanContent(
        List<String> objectives,
        List<String> contents,
        Methodology methodology,
        JsonNode weeklyPlan,
        JsonNode monthlyPlan,
        List<String> resources,
        Evaluation evaluation,
        CompleteLessonKit kit
) {
    public LessonPlanContent(
            List<String> objectives,
            List<String> contents,
            Methodology methodology,
            List<String> resources,
            Evaluation evaluation,
            CompleteLessonKit kit
    ) {
        this(objectives, contents, methodology, null, null, resources, evaluation, kit);
    }
}
