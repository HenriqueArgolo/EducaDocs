package br.com.edudocsai.dto.document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateDocumentRequest(
        @NotBlank(message = "Titulo nao pode ser vazio")
        @Size(max = 180, message = "Titulo deve ter no maximo 180 caracteres")
        String title,

        @NotBlank(message = "Conteudo nao pode ser vazio")
        String content
) {
}
