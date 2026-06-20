package br.com.edudocsai.dto.document;

import br.com.edudocsai.entity.DocumentType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

@Schema(example = """
        {
          "documentType": "LESSON_PLAN",
          "bnccSkillIds": [1],
          "topic": "Fracoes equivalentes",
          "duration": "50 minutos",
          "additionalInstructions": "Inclua atividade em duplas e avaliacao formativa."
        }
        """)
public record GenerateDocumentRequest(
        @NotNull DocumentType documentType,
        @NotEmpty List<@NotNull Long> bnccSkillIds,
        @NotBlank @Size(max = 180) String topic,
        @Size(max = 80) String duration,
        @Size(max = 4000) String additionalInstructions
) {
}
