package br.com.edudocsai.dto.classroom;

import br.com.edudocsai.entity.TimelineItemStatus;
import br.com.edudocsai.entity.TimelineItemType;

import java.time.ZonedDateTime;

public record ClassroomTimelineItemDto(
    Long id,
    String title,
    String description,
    Integer orderIndex,
    TimelineItemStatus status,
    TimelineItemType type,
    Long documentId,
    Long kitId,
    Long activityId,
    Long presentationId,
    ZonedDateTime createdAt,
    ZonedDateTime targetDate
) {}
