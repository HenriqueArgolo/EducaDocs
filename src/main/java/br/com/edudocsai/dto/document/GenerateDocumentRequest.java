package br.com.edudocsai.dto.document;

import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.PlanningPeriod;
import br.com.edudocsai.entity.TemplateStyle;
import br.com.edudocsai.dto.lessonkit.RegenerateLessonKitMaterialRequest;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

@Schema(example = """
        {
          "documentType": "LESSON_PLAN",
          "bnccSkillIds": [1],
          "topic": "Frações equivalentes",
          "grade": "5º ano",
          "subject": "Matemática",
          "duration": "50 minutos",
          "planningPeriod": "SINGLE",
          "additionalInstructions": "Inclua atividade em duplas e avaliação formativa."
        }
        """)
public record GenerateDocumentRequest(
        @NotNull DocumentType documentType,
        @NotEmpty List<@NotNull Long> bnccSkillIds,
        @NotBlank @Size(max = 180) String topic,
        @Size(max = 120) String grade,
        @Size(max = 180) String subject,
        @Size(max = 80) String duration,
        @Size(max = 4000) String additionalInstructions,
        TemplateStyle templateStyle,
        Integer numberOfQuestions,
        Boolean includeHeader,
        Long classroomId,
        Long timelineItemId,
        PlanningPeriod planningPeriod,
        Integer lessonsPerWeek,
        RegenerateLessonKitMaterialRequest activitySettings
) {
    public GenerateDocumentRequest(
            DocumentType documentType,
            List<Long> bnccSkillIds,
            String topic,
            String grade,
            String subject,
            String duration,
            String additionalInstructions,
            TemplateStyle templateStyle
    ) {
        this(documentType, bnccSkillIds, topic, grade, subject, duration,
                additionalInstructions, templateStyle, 5, true, null, null, PlanningPeriod.SINGLE, null, null);
    }

    public GenerateDocumentRequest(
            DocumentType documentType,
            List<Long> bnccSkillIds,
            String topic,
            String grade,
            String subject,
            String duration,
            String additionalInstructions,
            TemplateStyle templateStyle,
            Integer numberOfQuestions,
            Boolean includeHeader,
            Long classroomId,
            Long timelineItemId,
            PlanningPeriod planningPeriod
    ) {
        this(documentType, bnccSkillIds, topic, grade, subject, duration,
                additionalInstructions, templateStyle, numberOfQuestions, includeHeader, classroomId, timelineItemId, planningPeriod, null, null);
    }

    public GenerateDocumentRequest(DocumentType documentType, List<Long> bnccSkillIds, String topic,
            String grade, String subject, String duration, String additionalInstructions,
            TemplateStyle templateStyle, Integer numberOfQuestions, Boolean includeHeader,
            Long classroomId, Long timelineItemId, PlanningPeriod planningPeriod, Integer lessonsPerWeek) {
        this(documentType, bnccSkillIds, topic, grade, subject, duration, additionalInstructions,
                templateStyle, numberOfQuestions, includeHeader, classroomId, timelineItemId,
                planningPeriod, lessonsPerWeek, null);
    }

    /** Retorna a periodicidade, garantindo que nunca seja nula. */
    public PlanningPeriod effectivePlanningPeriod() {
        return planningPeriod != null ? planningPeriod : PlanningPeriod.SINGLE;
    }
}
