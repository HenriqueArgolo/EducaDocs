package br.com.edudocsai.dto.inclusion;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AdaptRequest(
        @NotBlank(message = "O conteudo original e obrigatorio")
        String content,

        @NotNull(message = "O tipo de inclusao e obrigatorio")
        InclusionType type,

        @NotBlank(message = "O titulo original e obrigatorio")
        String title,

        @NotBlank(message = "O tipo de destino (DOCUMENT ou ACTIVITY) e obrigatorio")
        String targetType
) {}
