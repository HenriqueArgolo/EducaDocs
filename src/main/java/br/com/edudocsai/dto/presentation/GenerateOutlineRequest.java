package br.com.edudocsai.dto.presentation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GenerateOutlineRequest(
        @NotBlank(message = "O assunto/tema nao pode ser vazio")
        @Size(max = 180, message = "O tema deve ter no maximo 180 caracteres")
        String topic,

        @NotBlank(message = "A serie/nivel de ensino e obrigatorio")
        String grade,

        @NotBlank(message = "A materia/disciplina e obrigatoria")
        String subject,

        @NotNull(message = "A quantidade de slides e obrigatoria")
        Integer numberOfSlides,

        @Size(max = 1000, message = "Instrucoes adicionais devem ter no maximo 1000 caracteres")
        String additionalInstructions
) {}
