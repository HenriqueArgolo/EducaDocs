package br.com.edudocsai.service;

import java.text.Normalizer;
import java.util.Locale;

final class EarlyLiteracySupport {

    private EarlyLiteracySupport() {
    }

    static boolean isInitialLiteracyGrade(String grade) {
        if (grade == null || grade.isBlank()) {
            return false;
        }

        String normalized = Normalizer.normalize(grade, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replace('º', 'o')
                .replace('ª', 'a')
                .replace('°', 'o');

        return normalized.contains("infantil")
                || normalized.contains("alfabetiza")
                || normalized.contains("1o")
                || normalized.matches(".*\\b1\\s*(ano|serie)\\b.*")
                || normalized.contains("primeiro ano");
    }

    static String allowedFiguresForPrompt() {
        return EarlyLiteracyWordBank.allEntries().stream()
                .map(EarlyLiteracyWordBank.Entry::figure)
                .distinct()
                .reduce((first, second) -> first + ", " + second)
                .orElse("bola, bolo, casa, dado, mala, gato, pato, sapo");
    }

    static String allowedActivityTypesForPrompt() {
        return "SEPARAR_SILABAS, LETRA_INICIAL, LIGAR_FIGURA_PALAVRA, COMPLETAR_PALAVRA, CIRCULAR_LETRA, CONTAR_LETRAS, CACA_LETRA, CACA_PALAVRAS, CRUZADINHA, PINTAR_CENA, LIGAR_COLUNAS";
    }

    static String wordBankForPrompt(String topic) {
        return EarlyLiteracyWordBank.promptBlock(topic);
    }
}
