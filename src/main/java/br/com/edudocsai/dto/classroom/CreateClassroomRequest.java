package br.com.edudocsai.dto.classroom;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateClassroomRequest(
    @NotBlank(message = "O nome da turma é obrigatório")
    @Size(max = 120)
    String name,

    @NotBlank(message = "A disciplina é obrigatória")
    @Size(max = 120)
    String subject,

    @NotBlank(message = "O ano escolar é obrigatório")
    @Size(max = 120)
    String grade
) {}
