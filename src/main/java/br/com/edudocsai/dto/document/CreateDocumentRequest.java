package br.com.edudocsai.dto.document;

import br.com.edudocsai.entity.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateDocumentRequest(
        @NotBlank(message = "O titulo e obrigatorio")
        @Size(max = 180, message = "O titulo deve ter no maximo 180 caracteres")
        String title,

        @NotNull(message = "O tipo e obrigatorio")
        DocumentType type,

        @NotBlank(message = "O conteudo e obrigatorio")
        String content,

        Long generationRequestId
) {}
