package br.com.edudocsai.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EarlyLiteracySupportTest {

    @Test
    void identifiesCommonFirstGradeSpellingsAsInitialLiteracy() {
        assertThat(EarlyLiteracySupport.isInitialLiteracyGrade("1º ano")).isTrue();
        assertThat(EarlyLiteracySupport.isInitialLiteracyGrade("1° ano")).isTrue();
        assertThat(EarlyLiteracySupport.isInitialLiteracyGrade("1o ano")).isTrue();
        assertThat(EarlyLiteracySupport.isInitialLiteracyGrade("primeiro ano")).isTrue();
        assertThat(EarlyLiteracySupport.isInitialLiteracyGrade("2º ano")).isFalse();
    }
}
