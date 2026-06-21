package br.com.edudocsai.service.lessonplan;

import java.text.Normalizer;
import java.util.Locale;

final class LessonPlanTextNormalizer {

    private LessonPlanTextNormalizer() {
    }

    static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String withoutMarks = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return withoutMarks
                .replace('º', 'o')
                .replace('ª', 'a')
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }
}
