package br.com.edudocsai.service.lessonplan;

public record QualityScore(
        Integer structure,
        Integer bnccAlignment,
        Integer topicAlignment,
        Integer pedagogicalQuality,
        Integer clarity,
        Integer finalScore
) {
}
