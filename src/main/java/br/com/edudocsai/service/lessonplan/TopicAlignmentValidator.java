package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.PlanningPeriod;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TopicAlignmentValidator {

    private static final Set<String> STOP_WORDS = Set.of("de", "da", "do", "das", "dos", "e", "a", "o", "as", "os");

    public int score(String topic, LessonPlanContent content) {
        return score(topic, content, PlanningPeriod.SINGLE);
    }

    public int score(String topic, LessonPlanContent content, PlanningPeriod period) {
        Set<String> topicTokens = meaningfulTokens(topic);
        if (topicTokens.isEmpty()) {
            return 0;
        }
        int officialPlanScore = scoreAgainst(topicTokens, officialPlanText(content));
        if (content.kit() == null) {
            return officialPlanScore;
        }
        int kitScore = scoreAgainst(topicTokens, kitText(content.kit()));
        if (period == PlanningPeriod.SINGLE) {
            return Math.min(officialPlanScore, kitScore);
        } else {
            return kitScore < 50 ? Math.min(officialPlanScore, kitScore) : officialPlanScore;
        }
    }

    private int scoreAgainst(Set<String> topicTokens, String generatedText) {
        Set<String> generatedTokens = meaningfulTokens(generatedText);
        long matched = topicTokens.stream().filter(generatedTokens::contains).count();
        int score = (int) Math.round((matched * 100.0) / topicTokens.size());
        return Math.min(100, score);
    }

    private String officialPlanText(LessonPlanContent content) {
        return String.join(" ",
                String.join(" ", content.objectives()),
                String.join(" ", content.contents()),
                planActivitiesText(content),
                String.join(" ", content.resources()),
                String.join(" ", content.evaluation().observableCriteria())
        );
    }

    private String planActivitiesText(LessonPlanContent content) {
        if (content.methodology() != null) {
            return String.join(" ",
                    content.methodology().introduction().description(),
                    content.methodology().development().description(),
                    content.methodology().closing().description()
            );
        }
        if (content.weeklyPlan() != null) {
            return content.weeklyPlan().toString();
        }
        return content.monthlyPlan() == null ? "" : content.monthlyPlan().toString();
    }

    private String kitText(CompleteLessonKit kit) {
        if (kit == null) {
            return "";
        }
        return String.join(" ",
                studentActivityText(kit.studentActivity()),
                teacherAnswerKeyText(kit.teacherAnswerKey()),
                assessmentInstrumentText(kit.assessmentInstrument()),
                pedagogicalEvidenceText(kit.pedagogicalEvidence()),
                inclusiveAdaptationsText(kit.inclusiveAdaptations())
        );
    }

    private String studentActivityText(StudentActivity activity) {
        if (activity == null) {
            return "";
        }
        return String.join(" ",
                value(activity.title()),
                value(activity.context()),
                String.join(" ", safe(activity.instructions())),
                String.join(" ", safe(activity.questions())),
                value(activity.expectedProduct())
        );
    }

    private String teacherAnswerKeyText(TeacherAnswerKey answerKey) {
        if (answerKey == null) {
            return "";
        }
        return String.join(" ",
                String.join(" ", safe(answerKey.expectedAnswers())),
                String.join(" ", safe(answerKey.teacherGuidance()))
        );
    }

    private String assessmentInstrumentText(AssessmentInstrument instrument) {
        if (instrument == null) {
            return "";
        }
        return String.join(" ",
                String.join(" ", safe(instrument.criteria())),
                String.join(" ", safe(instrument.evidenceCollection()))
        );
    }

    private String pedagogicalEvidenceText(PedagogicalEvidence evidence) {
        if (evidence == null) {
            return "";
        }
        return String.join(" ",
                String.join(" ", safe(evidence.observableEvidences())),
                String.join(" ", safe(evidence.recordsForCoordination()))
        );
    }

    private String inclusiveAdaptationsText(InclusiveAdaptations adaptations) {
        if (adaptations == null) {
            return "";
        }
        return String.join(" ",
                String.join(" ", safe(adaptations.readingSupport())),
                String.join(" ", safe(adaptations.participationSupport())),
                String.join(" ", safe(adaptations.simplifiedAlternatives()))
        );
    }

    private java.util.List<String> safe(java.util.List<String> values) {
        return values == null ? java.util.List.of() : values;
    }

    private String value(String value) {
        return value == null ? "" : value;
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
