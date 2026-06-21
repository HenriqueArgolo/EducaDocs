package br.com.edudocsai.service.lessonplan;

import java.util.List;

public record AssessmentInstrument(
        List<String> criteria,
        List<String> evidenceCollection
) {
}
