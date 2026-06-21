package br.com.edudocsai.service.lessonplan;

import java.util.List;

public record StudentActivity(
        String title,
        String context,
        List<String> instructions,
        List<String> questions,
        String expectedProduct
) {
}
