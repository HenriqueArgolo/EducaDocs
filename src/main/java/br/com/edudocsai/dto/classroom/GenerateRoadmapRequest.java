package br.com.edudocsai.dto.classroom;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

public record GenerateRoadmapRequest(
    @NotBlank(message = "O tema central é obrigatório")
    String theme,

    @NotNull(message = "O número de aulas é obrigatório")
    @Min(value = 1, message = "O número mínimo de aulas é 1")
    @Max(value = 24, message = "O número máximo de aulas é 24")
    Integer numberOfLessons,

    String additionalInstructions
) {}
