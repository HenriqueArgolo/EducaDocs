package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BnccCompatibilityValidatorTest {

    private final BnccCompatibilityValidator validator = new BnccCompatibilityValidator();

    @Test
    void acceptsSkillsThatMatchSelectedGradeAndSubjectAfterNormalization() {
        BNCCSkill skill = skill("EF05MA03", "Matematica", "5 ano do Ensino Fundamental");

        assertThatCode(() -> validator.validate("5º ano do Ensino Fundamental", "matemática", List.of(skill)))
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

    @ParameterizedTest
    @CsvSource({
            "Física, Ciências da Natureza e suas Tecnologias",
            "Biologia, Ciências da Natureza e suas Tecnologias",
            "Química, Ciências da Natureza e suas Tecnologias",
            "História, Ciências Humanas e Sociais Aplicadas",
            "Geografia, Ciências Humanas e Sociais Aplicadas",
            "Filosofia, Ciências Humanas e Sociais Aplicadas",
            "Sociologia, Ciências Humanas e Sociais Aplicadas",
            "Língua Inglesa, Linguagens e suas Tecnologias",
            "Arte, Linguagens e suas Tecnologias",
            "Educação Física, Linguagens e suas Tecnologias",
            "Matemática, Matemática e suas Tecnologias"
    })
    void acceptsEnsinoMedioComponentMappedToItsBnccArea(String component, String area) {
        BNCCSkill skill = skill("EM13AREA01", area, "Ensino Médio");
        assertThatCode(() -> validator.validate("1º ano do Ensino Médio", component, List.of(skill)))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsEnsinoMedioSelectionForEnsinoFundamentalSkillWithSameGradeNumber() {
        BNCCSkill skill = skill("EF01MA01", "Matematica", "1 ano do Ensino Fundamental");

        assertThatThrownBy(() -> validator.validate("1 ano do Ensino Medio", "Matematica", List.of(skill)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EF01MA01");
    }

    @Test
    void rejectsNullSkills() {
        assertThatThrownBy(() -> validator.validate("5 ano", "Matematica", null))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectsEmptySkills() {
        assertThatThrownBy(() -> validator.validate("5 ano", "Matematica", List.of()))
                .isInstanceOf(BadRequestException.class);
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
