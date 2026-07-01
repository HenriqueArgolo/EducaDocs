package br.com.edudocsai.dto.lessonkit;

import br.com.edudocsai.entity.LessonKitStatus;
import java.time.OffsetDateTime;
import java.util.List;

public record LessonKitResponse(
        Long id,
        Long sourceDocumentId,
        String title,
        LessonKitStatus status,
        String grade,
        String subject,
        String topic,
        List<LessonKitMaterialResponse> materials,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
