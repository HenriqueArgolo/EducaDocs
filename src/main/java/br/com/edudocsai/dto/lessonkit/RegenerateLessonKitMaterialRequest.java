package br.com.edudocsai.dto.lessonkit;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

public record RegenerateLessonKitMaterialRequest(
        @Min(1) @Max(10) Integer activityCount,
        @Min(1) @Max(20) Integer exercisesPerActivity,
        @Pattern(regexp = "ESCREVER|MARCAR|ASSOCIAR|COMPLETAR|VERDADEIRO_FALSO|MISTA") String format,
        @Pattern(regexp = "PRATICA|REVISAO|DIAGNOSTICA|AVALIATIVA") String purpose,
        @Pattern(regexp = "APOIO|REGULAR|DESAFIO") String difficulty,
        @Pattern(regexp = "INDIVIDUAL|DUPLA|GRUPO") String modality
) {
    public static RegenerateLessonKitMaterialRequest recommended() {
        return new RegenerateLessonKitMaterialRequest(1, 5, "MISTA", "PRATICA", "REGULAR", "INDIVIDUAL");
    }
}
