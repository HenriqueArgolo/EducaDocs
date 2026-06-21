package br.com.edudocsai.service.lessonplan;

public record CompleteLessonKit(
        StudentActivity studentActivity,
        TeacherAnswerKey teacherAnswerKey,
        AssessmentInstrument assessmentInstrument,
        PedagogicalEvidence pedagogicalEvidence,
        InclusiveAdaptations inclusiveAdaptations
) {
}
