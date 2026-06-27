package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.DocumentType;

import br.com.edudocsai.entity.TemplateStyle;

import java.util.List;

public record LessonPlanRequestContext(
        DocumentType documentType,
        List<Long> bnccSkillIds,
        String topic,
        String grade,
        String subject,
        String durationText,
        int totalMinutes,
        String additionalInstructions,
        TemplateStyle templateStyle,
        Long classroomId,
        Long timelineItemId
) {
    public LessonPlanRequestContext {
        bnccSkillIds = List.copyOf(bnccSkillIds);
    }

    public LessonPlanRequestContext(
            DocumentType documentType,
            List<Long> bnccSkillIds,
            String topic,
            String grade,
            String subject,
            String durationText,
            int totalMinutes,
            String additionalInstructions,
            TemplateStyle templateStyle
    ) {
        this(documentType, bnccSkillIds, topic, grade, subject, durationText, totalMinutes, additionalInstructions, templateStyle, null, null);
    }
}
