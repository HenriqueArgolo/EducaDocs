package br.com.edudocsai.dto.presentation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePresentationRequest(
        @NotBlank(message = "O titulo e obrigatorio")
        @Size(max = 180, message = "O titulo deve ter no maximo 180 caracteres")
        String title,

        @NotBlank(message = "O tema e obrigatorio")
        @Size(max = 180, message = "O tema deve ter no maximo 180 caracteres")
        String topic,

        @NotBlank(message = "A serie e obrigatoria")
        String grade,

        @NotBlank(message = "A materia e obrigatoria")
        String subject,

        @NotBlank(message = "O JSON dos slides e obrigatorio")
        String slidesJson
) {}
