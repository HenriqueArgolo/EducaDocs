package br.com.edudocsai.dto.activity;

import br.com.edudocsai.entity.ActivityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateActivityRequest(
        @NotBlank(message = "O titulo e obrigatorio")
        @Size(max = 180, message = "O titulo deve ter no maximo 180 caracteres")
        String title,

        String description,

        @NotNull(message = "O tipo e obrigatorio")
        ActivityType type,

        @NotBlank(message = "A serie e obrigatoria")
        String grade,

        @NotBlank(message = "A materia e obrigatoria")
        String subject,

        @NotBlank(message = "O conteudo e obrigatorio")
        String content,

        String thumbnailUrl,

        boolean isPublic
) {}
