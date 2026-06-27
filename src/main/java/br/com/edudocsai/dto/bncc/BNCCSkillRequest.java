package br.com.edudocsai.dto.bncc;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(example = """
        {
          "code": "EF05MA03",
          "description": "Identificar e representar fracoes...",
          "subject": "Matematica",
          "grade": "5º ano"
        }
        """)
public record BNCCSkillRequest(
        @NotBlank @Size(max = 20) String code,
        @NotBlank String description,
        @NotBlank @Size(max = 160) String subject,
        @NotBlank @Size(max = 120) String grade
) {
}
