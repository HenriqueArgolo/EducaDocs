package br.com.edudocsai.dto.classroom;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStudentRequest(
    @NotBlank(message = "O nome do aluno é obrigatório")
    @Size(max = 180)
    String name,

    @Size(max = 4000)
    String needs
) {}
