package br.com.edudocsai.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class EarlyLiteracyWordBankTest {

    @Test
    void candidatesForTopicPrioritizesFarmAnimals() {
        var candidates = EarlyLiteracyWordBank.candidatesForTopic("animais da fazenda");

        assertThat(candidates)
                .extracting(EarlyLiteracyWordBank.Entry::word)
                .containsSubsequence("VACA", "PATO", "GALO");
        assertThat(candidates.get(0).categories()).contains("animais");
    }

    @Test
    void candidatesForTopicPrioritizesFruits() {
        var candidates = EarlyLiteracyWordBank.candidatesForTopic("frutas");

        assertThat(candidates)
                .extracting(EarlyLiteracyWordBank.Entry::word)
                .containsSubsequence("UVA", "BANANA", "MELAO");
        assertThat(candidates.subList(0, 3))
                .extracting(EarlyLiteracyWordBank.Entry::figure)
                .containsExactly("uva", "banana", "melao");
    }

    @Test
    void promptBlockIncludesWordsFiguresAndSyllables() {
        String promptBlock = EarlyLiteracyWordBank.promptBlock("animais da fazenda");

        assertThat(promptBlock)
                .contains("VACA | figura: vaca | silabas: VA-CA")
                .contains("PATO | figura: pato | silabas: PA-TO")
                .doesNotContain("INTERPRETE O TEXTO");
    }

    @Test
    void candidatesForTopicPrioritizesChristmas() {
        var candidates = EarlyLiteracyWordBank.candidatesForTopic("natal");

        assertThat(candidates)
                .extracting(EarlyLiteracyWordBank.Entry::word)
                .contains("SINO", "VELA", "RENA");
        assertThat(candidates.get(0).categories()).contains("natal");
    }

    @Test
    void candidatesForTopicWithNoMatchReturnsAllEntries() {
        var candidates = EarlyLiteracyWordBank.candidatesForTopic("non-existent-topic");

        assertThat(candidates).hasSize(EarlyLiteracyWordBank.allEntries().size());
    }
}
