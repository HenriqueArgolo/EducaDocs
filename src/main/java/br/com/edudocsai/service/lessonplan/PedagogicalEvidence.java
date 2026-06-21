package br.com.edudocsai.service.lessonplan;

import java.util.List;

public record PedagogicalEvidence(
        List<String> observableEvidences,
        List<String> recordsForCoordination
) {
}
