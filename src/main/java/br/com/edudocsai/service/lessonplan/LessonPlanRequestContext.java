package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.DocumentType;

import java.util.List;

public record LessonPlanRequestContext(
        DocumentType documentType,
        List<Long> bnccSkillIds,
        String topic,
        String grade,
        String subject,
        String durationText,
        int totalMinutes,
        String additionalInstructions
) {
    public LessonPlanRequestContext {
        bnccSkillIds = List.copyOf(bnccSkillIds);
    }
}
