package br.com.edudocsai.service.lessonplan;

public class LessonPlanValidationException extends RuntimeException {

    public LessonPlanValidationException(String message) {
        super(message);
    }

    public LessonPlanValidationException(String message, Throwable cause) {
        super(message, cause);
    }
}
