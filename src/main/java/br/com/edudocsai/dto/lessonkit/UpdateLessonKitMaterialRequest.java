package br.com.edudocsai.dto.lessonkit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateLessonKitMaterialRequest(
        @NotBlank String content,
        @NotNull Long version
) {}
