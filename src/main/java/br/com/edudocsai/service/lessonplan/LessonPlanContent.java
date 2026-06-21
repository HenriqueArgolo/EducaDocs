package br.com.edudocsai.service.lessonplan;

import java.util.List;

public record LessonPlanContent(
        List<String> objectives,
        List<String> contents,
        Methodology methodology,
        List<String> resources,
        Evaluation evaluation,
        CompleteLessonKit kit
) {
}
