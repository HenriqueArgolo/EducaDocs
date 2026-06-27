package br.com.edudocsai.dto.presentation;

import java.time.OffsetDateTime;

public record PresentationResponse(
        Long id,
        String title,
        String topic,
        String grade,
        String subject,
        String slidesJson,
        OffsetDateTime createdAt
) {}
