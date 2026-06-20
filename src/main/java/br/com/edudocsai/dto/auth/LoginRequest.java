package br.com.edudocsai.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(example = """
        {
          "email": "maria@escola.com",
          "password": "SenhaForte123!"
        }
        """)
public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
) {
}
