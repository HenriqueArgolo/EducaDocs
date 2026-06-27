package br.com.edudocsai.dto.classroom;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ReorderTimelineItemsRequest(
    @NotEmpty(message = "A lista de IDs não pode estar vazia")
    List<Long> orderedItemIds
) {}
