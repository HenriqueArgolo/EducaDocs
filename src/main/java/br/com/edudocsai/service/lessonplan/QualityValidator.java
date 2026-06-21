package br.com.edudocsai.service.lessonplan;

import org.springframework.stereotype.Service;

@Service
public class QualityValidator {

    public QualityScore score(LessonPlanContent content, int topicAlignment, boolean bnccCompatible) {
        int structure = 100;
        int bnccAlignment = bnccCompatible ? 100 : 0;
        int pedagogicalQuality = pedagogicalQuality(content);
        int clarity = clarity(content);
        int finalScore = Math.round(
                structure * 0.25f
                        + bnccAlignment * 0.25f
                        + topicAlignment * 0.25f
                        + pedagogicalQuality * 0.15f
                        + clarity * 0.10f
        );
        return new QualityScore(structure, bnccAlignment, topicAlignment, pedagogicalQuality, clarity, finalScore);
    }

    public void assertAcceptable(QualityScore score) {
        if (score.finalScore() < 90) {
            throw new LessonPlanValidationException("Plano de aula reprovado no validador de qualidade");
        }
    }

    private int pedagogicalQuality(LessonPlanContent content) {
        boolean hasActiveDevelopment = LessonPlanTextNormalizer.normalize(activePedagogicalText(content))
                .matches(".*(atividade|resolver|comparar|grupo|dupla|participa|registrar|organizar|ordenar|explicar).*");
        return hasActiveDevelopment ? 100 : 80;
    }

    private String activePedagogicalText(LessonPlanContent content) {
        CompleteLessonKit kit = content.kit();
        if (kit == null || kit.studentActivity() == null) {
            return content.methodology().development().description();
        }
        StudentActivity activity = kit.studentActivity();
        return String.join(" ",
                content.methodology().development().description(),
                value(activity.context()),
                String.join(" ", safe(activity.instructions())),
                String.join(" ", safe(activity.questions())),
                value(activity.expectedProduct())
        );
    }

    private java.util.List<String> safe(java.util.List<String> values) {
        return values == null ? java.util.List.of() : values;
    }

    private String value(String value) {
        return value == null ? "" : value;
    }

    private int clarity(LessonPlanContent content) {
        int totalItems = content.objectives().size()
                + content.contents().size()
                + content.resources().size()
                + content.evaluation().observableCriteria().size();
        return totalItems >= 12 ? 100 : 85;
    }
}
