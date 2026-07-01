package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.exception.BadRequestException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class BnccCompatibilityValidator {

    private static final Pattern GRADE_NUMBER_PATTERN = Pattern.compile("\\b(\\d{1,2})(?:[oa])?\\b");

    public void validate(String selectedGrade, String selectedSubject, List<BNCCSkill> skills) {
        if (skills == null || skills.isEmpty()) {
            throw new BadRequestException("Ao menos uma habilidade BNCC deve ser selecionada");
        }
        for (BNCCSkill skill : skills) {
            if (!sameSubject(selectedSubject, skill.getSubject(), skill.getCode()) || !compatibleGrade(selectedGrade, skill.getGrade())) {
                throw new BadRequestException("Habilidade BNCC incompativel com ano ou disciplina selecionados: " + skill.getCode());
            }
        }
    }

    private boolean sameSubject(String selectedSubject, String skillSubject, String skillCode) {
        String selected = LessonPlanTextNormalizer.normalize(selectedSubject);
        String skill = LessonPlanTextNormalizer.normalize(skillSubject);
        if (selected.equals(skill)) {
            return true;
        }
        if (skillCode == null || !skillCode.toUpperCase().startsWith("EM")) {
            return false;
        }
        return ensinoMedioArea(selected).equals(skill);
    }

    private String ensinoMedioArea(String component) {
        return switch (component) {
            case "lingua portuguesa", "lingua inglesa", "arte", "educacao fisica" ->
                    "linguagens e suas tecnologias";
            case "matematica" -> "matematica e suas tecnologias";
            case "biologia", "fisica", "quimica" -> "ciencias da natureza e suas tecnologias";
            case "historia", "geografia", "filosofia", "sociologia" ->
                    "ciencias humanas e sociais aplicadas";
            default -> "";
        };
    }

    private boolean compatibleGrade(String selectedGrade, String skillGrade) {
        String selected = LessonPlanTextNormalizer.normalize(selectedGrade);
        String skill = LessonPlanTextNormalizer.normalize(skillGrade);
        if (selected.equals(skill)) {
            return true;
        }
        if (!compatibleSchoolStage(selected, skill)) {
            return false;
        }
        if (selected.contains("ensino medio") && skill.contains("ensino medio")) {
            return true;
        }
        Integer selectedNumber = firstGradeNumber(selected);
        if (selectedNumber == null) {
            return false;
        }
        List<Integer> skillNumbers = gradeNumbers(skill);
        if (skillNumbers.size() == 1) {
            return selectedNumber.equals(skillNumbers.get(0));
        }
        if (skillNumbers.size() >= 2) {
            int start = skillNumbers.get(0);
            int end = skillNumbers.get(skillNumbers.size() - 1);
            return selectedNumber >= Math.min(start, end) && selectedNumber <= Math.max(start, end);
        }
        return false;
    }

    private boolean compatibleSchoolStage(String selectedGrade, String skillGrade) {
        String selectedStage = schoolStage(selectedGrade);
        String skillStage = schoolStage(skillGrade);
        return selectedStage.isEmpty() || skillStage.isEmpty() || selectedStage.equals(skillStage);
    }

    private String schoolStage(String value) {
        if (value.contains("ensino fundamental")) {
            return "ensino fundamental";
        }
        if (value.contains("ensino medio")) {
            return "ensino medio";
        }
        return "";
    }

    private Integer firstGradeNumber(String value) {
        Matcher matcher = GRADE_NUMBER_PATTERN.matcher(value);
        return matcher.find() ? Integer.parseInt(matcher.group(1)) : null;
    }

    private List<Integer> gradeNumbers(String value) {
        Matcher matcher = GRADE_NUMBER_PATTERN.matcher(value);
        java.util.ArrayList<Integer> numbers = new java.util.ArrayList<>();
        while (matcher.find()) {
            numbers.add(Integer.parseInt(matcher.group(1)));
        }
        return numbers;
    }
}
