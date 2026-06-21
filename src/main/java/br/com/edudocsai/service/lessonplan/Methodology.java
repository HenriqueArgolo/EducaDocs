package br.com.edudocsai.service.lessonplan;

public record Methodology(
        LessonStage introduction,
        LessonStage development,
        LessonStage closing
) {
}
