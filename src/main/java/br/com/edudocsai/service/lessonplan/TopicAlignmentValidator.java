package br.com.edudocsai.service.lessonplan;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TopicAlignmentValidator {

    private static final Set<String> STOP_WORDS = Set.of("de", "da", "do", "das", "dos", "e", "a", "o", "as", "os");

    public int score(String topic, LessonPlanContent content) {
        Set<String> topicTokens = meaningfulTokens(topic);
        if (topicTokens.isEmpty()) {
            return 0;
        }
        Set<String> generatedTokens = meaningfulTokens(String.join(" ",
                String.join(" ", content.objectives()),
                String.join(" ", content.contents()),
                content.methodology().introduction().description(),
                content.methodology().development().description(),
                content.methodology().closing().description(),
                String.join(" ", content.resources()),
                String.join(" ", content.evaluation().observableCriteria())
        ));
        long matched = topicTokens.stream().filter(generatedTokens::contains).count();
        int score = (int) Math.round((matched * 100.0) / topicTokens.size());
        return Math.min(100, score);
    }

    private Set<String> meaningfulTokens(String value) {
        return Arrays.stream(LessonPlanTextNormalizer.normalize(value).split(" "))
                .filter(token -> token.length() >= 3)
                .filter(token -> !STOP_WORDS.contains(token))
                .map(this::canonicalize)
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
    }

    private String canonicalize(String token) {
        if (token.endsWith("oes") || token.endsWith("aes")) {
            return token.substring(0, token.length() - 3);
        }
        if (token.endsWith("ao")) {
            return token.substring(0, token.length() - 2);
        }
        if (token.endsWith("s")) {
            return token.substring(0, token.length() - 1);
        }
        return token;
    }
}
