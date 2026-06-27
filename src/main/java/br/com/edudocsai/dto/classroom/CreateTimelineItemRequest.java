package br.com.edudocsai.dto.classroom;

import br.com.edudocsai.entity.TimelineItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTimelineItemRequest(
    @NotBlank(message = "O título é obrigatório")
    @Size(max = 180)
    String title,

    String description,

    @NotNull(message = "O tipo do evento é obrigatório")
    TimelineItemType type,

    Long documentId,
    Long activityId,
    Long presentationId
) {}
