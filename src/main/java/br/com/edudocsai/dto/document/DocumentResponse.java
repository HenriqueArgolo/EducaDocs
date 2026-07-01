package br.com.edudocsai.dto.document;

import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.TemplateStyle;

import java.time.OffsetDateTime;
import br.com.edudocsai.entity.LessonKitStatus;

public record DocumentResponse(
        Long id,
        Long userId,
        DocumentType type,
        TemplateStyle templateStyle,
        String title,
        String grade,
        String subject,
        String content,
        OffsetDateTime createdAt,
        Long kitId,
        LessonKitStatus kitStatus,
        Integer readyMaterialCount
) {
}
