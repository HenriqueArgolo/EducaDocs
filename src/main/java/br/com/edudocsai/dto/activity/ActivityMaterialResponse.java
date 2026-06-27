package br.com.edudocsai.dto.activity;

import br.com.edudocsai.entity.ActivityType;

import java.time.OffsetDateTime;

public record ActivityMaterialResponse(
        Long id,
        String title,
        String description,
        ActivityType type,
        String grade,
        String subject,
        String content,
        String thumbnailUrl,
        boolean isPublic,
        Long userId,
        OffsetDateTime createdAt
) {}
