package br.com.edudocsai.dto.lessonkit;

import br.com.edudocsai.entity.LessonKitMaterialStatus;
import br.com.edudocsai.entity.LessonKitMaterialType;

public record LessonKitMaterialResponse(
        Long id,
        LessonKitMaterialType type,
        LessonKitMaterialStatus status,
        String content,
        String generationError,
        Long version
) {}
