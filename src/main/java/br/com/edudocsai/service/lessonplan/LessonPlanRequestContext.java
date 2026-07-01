package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.PlanningPeriod;
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
        Long timelineItemId,
        PlanningPeriod planningPeriod,
        Integer lessonsPerWeek
) {
    public LessonPlanRequestContext {
        bnccSkillIds = List.copyOf(bnccSkillIds);
        if (planningPeriod == null) planningPeriod = PlanningPeriod.SINGLE;
    }

    /** Construtor de compatibilidade com 12 parâmetros (sem lessonsPerWeek). */
    public LessonPlanRequestContext(
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
            Long timelineItemId,
            PlanningPeriod planningPeriod
    ) {
        this(documentType, bnccSkillIds, topic, grade, subject, durationText,
                totalMinutes, additionalInstructions, templateStyle, classroomId, timelineItemId, planningPeriod, null);
    }

    /** Construtor de compatibilidade sem periodicidade (usa SINGLE por padrão). */
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
        this(documentType, bnccSkillIds, topic, grade, subject, durationText,
                totalMinutes, additionalInstructions, templateStyle, null, null, PlanningPeriod.SINGLE, null);
    }
}
