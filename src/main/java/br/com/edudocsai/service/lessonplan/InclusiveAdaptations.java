package br.com.edudocsai.service.lessonplan;

import java.util.List;

public record InclusiveAdaptations(
        List<String> readingSupport,
        List<String> participationSupport,
        List<String> simplifiedAlternatives
) {
}
