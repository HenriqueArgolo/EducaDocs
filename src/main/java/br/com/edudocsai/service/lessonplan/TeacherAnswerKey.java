package br.com.edudocsai.service.lessonplan;

import java.util.List;

public record TeacherAnswerKey(
        List<String> expectedAnswers,
        List<String> teacherGuidance
) {
}
