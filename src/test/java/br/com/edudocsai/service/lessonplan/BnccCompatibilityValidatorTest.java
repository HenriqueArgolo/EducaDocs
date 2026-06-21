package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BnccCompatibilityValidatorTest {

    private final BnccCompatibilityValidator validator = new BnccCompatibilityValidator();

    @Test
    void acceptsSkillsThatMatchSelectedGradeAndSubjectAfterNormalization() {
        BNCCSkill skill = skill("EF05MA03", "Matematica", "5 ano");

        assertThatCode(() -> validator.validate("5o ano", "matematica", List.of(skill)))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsSubjectMismatchWithBnccCodeInMessage() {
        BNCCSkill skill = skill("EF05MA03", "Matematica", "5 ano");

        assertThatThrownBy(() -> validator.validate("5 ano", "Historia", List.of(skill)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EF05MA03");
    }

    @Test
    void acceptsEnsinoMedioAreaForEnsinoMedioSelection() {
        BNCCSkill skill = skill("EM13CHS103", "Ciencias Humanas e Sociais Aplicadas", "Ensino Medio");

        assertThatCode(() -> validator.validate("Ensino Medio", "Ciencias Humanas e Sociais Aplicadas", List.of(skill)))
                .doesNotThrowAnyException();
    }

    private BNCCSkill skill(String code, String subject, String grade) {
        return BNCCSkill.builder()
                .id(1L)
                .code(code)
                .description("Descricao")
                .subject(subject)
                .grade(grade)
                .build();
    }
}
