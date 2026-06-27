package br.com.edudocsai.dto.bncc;

import jakarta.validation.constraints.NotBlank;

public record RecommendBNCCRequest(
        @NotBlank(message = "A serie/ano e obrigatorio")
        String grade,

        @NotBlank(message = "A materia/disciplina e obrigatoria")
        String subject,

        @NotBlank(message = "O tema/assunto e obrigatorio")
        String topic
) {}
