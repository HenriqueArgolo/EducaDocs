package br.com.edudocsai.dto.activity;

import br.com.edudocsai.entity.ActivityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GenerateActivityRequest(
        @NotBlank(message = "O assunto/tema nao pode ser vazio")
        @Size(max = 180, message = "O tema deve ter no maximo 180 caracteres")
        String topic,

        @NotNull(message = "O tipo de atividade e obrigatorio")
        ActivityType type,

        @NotBlank(message = "A serie/nivel de ensino e obrigatorio")
        String grade,

        @NotBlank(message = "A materia/disciplina e obrigatorio")
        String subject,

        @Size(max = 1000, message = "Instrucoes adicionais devem ter no maximo 1000 caracteres")
        String additionalInstructions,

        String questionFormat
) {}
