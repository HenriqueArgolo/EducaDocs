package br.com.edudocsai.service;

import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

final class EarlyLiteracyWordBank {

    private static final List<Entry> ENTRIES = List.of(
            entry("VACA", "vaca", List.of("VA", "CA"), "animais", "fazenda", "bichos"),
            entry("PATO", "pato", List.of("PA", "TO"), "animais", "fazenda", "bichos"),
            entry("GALO", "galo", List.of("GA", "LO"), "animais", "fazenda", "bichos"),
            entry("CAVALO", "cavalo", List.of("CA", "VA", "LO"), "animais", "fazenda", "bichos"),
            entry("OVELHA", "ovelha", List.of("O", "VE", "LHA"), "animais", "fazenda", "bichos"),
            entry("PORCO", "porco", List.of("POR", "CO"), "animais", "fazenda", "bichos"),
            entry("GATO", "gato", List.of("GA", "TO"), "animais", "casa", "bichos"),
            entry("SAPO", "sapo", List.of("SA", "PO"), "animais", "natureza", "bichos"),
            entry("UVA", "uva", List.of("U", "VA"), "frutas", "alimentos"),
            entry("BANANA", "banana", List.of("BA", "NA", "NA"), "frutas", "alimentos"),
            entry("MELAO", "melao", List.of("ME", "LAO"), "frutas", "alimentos"),
            entry("PERA", "pera", List.of("PE", "RA"), "frutas", "alimentos"),
            entry("LIMAO", "limao", List.of("LI", "MAO"), "frutas", "alimentos"),
            entry("BOLO", "bolo", List.of("BO", "LO"), "alimentos", "casa", "festa"),
            entry("BOLA", "bola", List.of("BO", "LA"), "brinquedos", "escola", "natal"),
            entry("DADO", "dado", List.of("DA", "DO"), "brinquedos", "escola"),
            entry("MALA", "mala", List.of("MA", "LA"), "objetos", "casa", "escola"),
            entry("CASA", "casa", List.of("CA", "SA"), "casa", "objetos"),
            entry("LIVRO", "livro", List.of("LI", "VRO"), "escola", "objetos"),
            entry("LAPIS", "lapis", List.of("LA", "PIS"), "escola", "objetos"),
            entry("COLA", "cola", List.of("CO", "LA"), "escola", "objetos"),
            entry("SOL", "sol", List.of("SOL"), "natureza", "ceu"),
            entry("LUA", "lua", List.of("LU", "A"), "natureza", "ceu"),
            entry("FLOR", "flor", List.of("FLOR"), "natureza", "plantas"),
            entry("ABELHA", "abelha", List.of("A", "BE", "LHA"), "natureza", "animais"),
            entry("CARRO", "carro", List.of("CAR", "RO"), "transportes", "cidade"),
            entry("MOTO", "moto", List.of("MO", "TO"), "transportes", "cidade"),
            entry("TREM", "trem", List.of("TREM"), "transportes", "cidade"),
            entry("BARCO", "barco", List.of("BAR", "CO"), "transportes", "cidade"),
            entry("SINO", "sino", List.of("SI", "NO"), "natal", "casa", "objetos"),
            entry("VELA", "vela", List.of("VE", "LA"), "natal", "casa", "objetos"),
            entry("RENA", "rena", List.of("RE", "NA"), "natal", "animais", "bichos"),
            entry("ANJO", "anjo", List.of("AN", "JO"), "natal", "ceu"),
            entry("MEIA", "meia", List.of("MEI", "A"), "natal", "vestuario", "objetos"),
            entry("NOEL", "noel", List.of("NO", "EL"), "natal", "pessoas"),
            entry("ESTRELA", "estrela", List.of("ES", "TRE", "LA"), "natal", "natureza", "ceu"),
            entry("PRESENTE", "presente", List.of("PRE", "SEN", "TE"), "natal", "festa", "brinquedos"),
            entry("PINHEIRO", "pinheiro", List.of("PI", "NHEI", "RO"), "natal", "natureza", "plantas"),
            entry("SACI", "saci", List.of("SA", "CI"), "folclore", "bichos", "pessoas", "personagens"),
            entry("CUCA", "cuca", List.of("CU", "CA"), "folclore", "bichos", "personagens"),
            entry("IARA", "iara", List.of("I", "A", "RA"), "folclore", "natureza", "ceu", "personagens"),
            entry("MULA", "mula", List.of("MU", "LA"), "folclore", "animais", "bichos", "personagens"),
            entry("BOTO", "boto", List.of("BO", "TO"), "folclore", "animais", "bichos", "personagens"),
            entry("BOITATA", "boitata", List.of("BOI", "TA", "TA"), "folclore", "bichos", "personagens"),
            entry("CURUPIRA", "curupira", List.of("CU", "RU", "PI", "RA"), "folclore", "natureza", "personagens"),
            entry("LOBISOMEM", "lobisomem", List.of("LO", "BI", "SO", "MEM"), "folclore", "animais", "bichos", "personagens")
    );

    private EarlyLiteracyWordBank() {
    }

    static List<Entry> candidatesForTopic(String topic) {
        String normalizedTopic = normalize(topic);
        List<Entry> matched = ENTRIES.stream()
                .filter(entry -> score(entry, normalizedTopic) > 0)
                .sorted(Comparator.comparingInt((Entry entry) -> score(entry, normalizedTopic)).reversed())
                .toList();

        if (!matched.isEmpty()) {
            return matched;
        }

        return ENTRIES;
    }

    static List<Entry> allEntries() {
        return ENTRIES;
    }

    static String promptBlock(String topic) {
        StringBuilder builder = new StringBuilder();
        for (Entry entry : candidatesForTopic(topic).stream().limit(16).toList()) {
            builder.append(entry.word())
                    .append(" | figura: ").append(entry.figure())
                    .append(" | silabas: ").append(String.join("-", entry.syllables()))
                    .append(" | categorias: ").append(String.join(", ", entry.categories()))
                    .append("\n");
        }
        return builder.toString();
    }

    static boolean hasFigure(String figure) {
        String normalizedFigure = normalize(figure);
        return ENTRIES.stream().anyMatch(entry -> normalize(entry.figure()).equals(normalizedFigure));
    }

    static Optional<Entry> findByWordOrFigure(String word, String figure) {
        String normalizedWord = normalize(word);
        String normalizedFigure = normalize(figure);
        return ENTRIES.stream()
                .filter(entry -> normalize(entry.word()).equals(normalizedWord)
                        || normalize(entry.figure()).equals(normalizedFigure))
                .findFirst();
    }

    static Entry fallbackEntry(int index, String topic) {
        List<Entry> candidates = candidatesForTopic(topic);
        return candidates.get(Math.floorMod(index, candidates.size()));
    }

    private static Entry entry(String word, String figure, List<String> syllables, String... categories) {
        return new Entry(word, figure, syllables, List.of(categories));
    }

    private static int score(Entry entry, String normalizedTopic) {
        if (normalizedTopic.isBlank()) {
            return 0;
        }

        int score = 0;
        for (String category : entry.categories()) {
            if (normalizedTopic.contains(normalize(category))) {
                score += 4;
            }
        }
        if (normalizedTopic.contains(normalize(entry.word())) || normalizedTopic.contains(normalize(entry.figure()))) {
            score += 6;
        }
        if (normalizedTopic.contains("fazenda") && entry.categories().contains("animais")) {
            score += 2;
        }
        if (normalizedTopic.contains("fruta") && entry.categories().contains("frutas")) {
            score += 2;
        }
        return score;
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(java.util.Locale.ROOT)
                .replaceAll("[^a-z0-9 ]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    record Entry(String word, String figure, List<String> syllables, List<String> categories) {
    }
}
