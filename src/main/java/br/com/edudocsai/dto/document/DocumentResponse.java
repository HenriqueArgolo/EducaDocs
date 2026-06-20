package br.com.edudocsai.dto.document;

import br.com.edudocsai.entity.DocumentType;

import java.time.OffsetDateTime;

public record DocumentResponse(
        Long id,
        Long userId,
        DocumentType type,
        String title,
        String content,
        OffsetDateTime createdAt
) {
}
