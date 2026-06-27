package br.com.edudocsai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

final class EarlyLiteracyWorksheetNormalizer {

    private static final List<String> TYPE_SEQUENCE = List.of(
            "SEPARAR_SILABAS",
            "LETRA_INICIAL",
            "LIGAR_FIGURA_PALAVRA",
            "COMPLETAR_PALAVRA",
            "CONTAR_LETRAS",
            "CIRCULAR_LETRA"
    );

    private final ObjectMapper objectMapper;

    EarlyLiteracyWorksheetNormalizer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    String normalize(String generatedJson, String topic, int requestedExerciseCount) {
        int exerciseCount = Math.max(3, Math.min(requestedExerciseCount, 5));
        JsonNode root = parseObject(generatedJson);
        List<ObjectNode> exercises = readValidExercises(root, topic);

        int fillIndex = 0;
        while (exercises.size() < exerciseCount) {
            exercises.add(fallbackExercise(exercises.size() + 1, fillIndex++, topic));
        }

        if (distinctTypes(exercises).size() < 2) {
            exercises.clear();
            for (int index = 0; index < exerciseCount; index++) {
                exercises.add(fallbackExercise(index + 1, index, topic));
            }
        }

        ObjectNode output = objectMapper.createObjectNode();
        output.put("titulo", text(root, "titulo", "Atividade de alfabetizacao"));
        output.put("layout", "ALFABETIZACAO_VISUAL_V2");
        output.put("descricao", text(root, "descricao", "Ficha visual para alfabetizacao inicial."));
        output.put("instrucoes_alunos", "Professor(a), leia os comandos em voz alta.");
        output.put("schemaVersion", 2);

        ArrayNode exerciseArray = output.putArray("exercicios");
        for (int index = 0; index < exerciseCount; index++) {
            ObjectNode exercise = exercises.get(index);
            exercise.put("numero", index + 1);
            exerciseArray.add(exercise);
        }

        ArrayNode teacherNotes = output.putArray("orientacoesProfessor");
        teacherNotes.add("Observe se a crianca reconhece letras, silabas e relacao figura-palavra.");
        teacherNotes.add("Leia os comandos em voz alta e aceite resposta por apontar, pintar, ligar ou falar.");

        return output.toString();
    }

    private List<ObjectNode> readValidExercises(JsonNode root, String topic) {
        List<ObjectNode> exercises = new ArrayList<>();
        JsonNode source = root.path("exercicios").isArray() ? root.path("exercicios") : root.path("atividadesVisuais");
        if (!source.isArray()) {
            return exercises;
        }

        for (JsonNode node : source) {
            ObjectNode sanitized = sanitizeExercise(node, exercises.size() + 1, topic);
            if (sanitized != null) {
                exercises.add(sanitized);
            }
        }
        return exercises;
    }

    private ObjectNode sanitizeExercise(JsonNode node, int number, String topic) {
        String type = normalizeType(text(node, "tipo", ""));
        if (!TYPE_SEQUENCE.contains(type)) {
            return null;
        }

        ArrayNode items = objectMapper.createArrayNode();
        JsonNode sourceItems = node.path("itens");
        if (sourceItems.isArray()) {
            for (JsonNode itemNode : sourceItems) {
                EarlyLiteracyWordBank.Entry entry = EarlyLiteracyWordBank
                        .findByWordOrFigure(text(itemNode, "palavra", ""), text(itemNode, "figura", ""))
                        .orElse(null);
                if (entry != null && EarlyLiteracyWordBank.candidatesForTopic(topic).contains(entry)) {
                    items.add(itemForType(type, entry, itemNode));
                }
            }
        }

        if (items.isEmpty()) {
            return null;
        }

        ObjectNode exercise = objectMapper.createObjectNode();
        exercise.put("numero", number);
        exercise.put("tipo", type);
        String command = text(node, "comando", "");
        exercise.put("comando", isShortCommand(command) ? command : commandFor(type));
        exercise.set("itens", items);
        exercise.put("gabarito", text(node, "gabarito", generatedAnswer(type, items)));
        return exercise;
    }

    private ObjectNode fallbackExercise(int number, int index, String topic) {
        String type = TYPE_SEQUENCE.get(Math.floorMod(index, TYPE_SEQUENCE.size()));
        ObjectNode exercise = objectMapper.createObjectNode();
        exercise.put("numero", number);
        exercise.put("tipo", type);
        exercise.put("comando", commandFor(type));

        ArrayNode items = exercise.putArray("itens");
        if ("LIGAR_FIGURA_PALAVRA".equals(type)) {
            for (int offset = 0; offset < 3; offset++) {
                items.add(itemForType(type, EarlyLiteracyWordBank.fallbackEntry(index + offset, topic), null));
            }
        } else {
            items.add(itemForType(type, EarlyLiteracyWordBank.fallbackEntry(index, topic), null));
        }

        exercise.put("gabarito", generatedAnswer(type, items));
        return exercise;
    }

    private ObjectNode itemForType(String type, EarlyLiteracyWordBank.Entry entry, JsonNode original) {
        ObjectNode item = objectMapper.createObjectNode();
        item.put("palavra", entry.word());
        item.put("figura", entry.figure());
        ArrayNode syllables = item.putArray("silabas");
        entry.syllables().forEach(syllables::add);

        switch (type) {
            case "SEPARAR_SILABAS" -> item.put("caixasResposta", entry.syllables().size());
            case "LETRA_INICIAL" -> {
                String answer = entry.word().substring(0, 1);
                item.set("opcoes", options(answer));
                item.put("resposta", answer);
            }
            case "COMPLETAR_PALAVRA" -> {
                item.put("lacunaIndice", 0);
                item.set("opcoes", syllableOptions(entry));
                item.put("resposta", entry.syllables().get(0));
            }
            case "CIRCULAR_LETRA", "CACA_LETRA" -> {
                String answer = entry.word().substring(0, 1);
                item.put("letraAlvo", answer);
                item.set("letras", lettersFor(entry.word()));
                item.put("resposta", answer);
            }
            case "CONTAR_LETRAS" -> {
                item.put("caixasResposta", Math.min(entry.word().length(), 8));
                item.put("resposta", entry.word().length());
            }
            default -> {
                if (original != null && original.has("caixasResposta")) {
                    item.put("caixasResposta", Math.max(1, Math.min(original.path("caixasResposta").asInt(), 6)));
                }
            }
        }
        return item;
    }

    private ArrayNode options(String answer) {
        ArrayNode options = objectMapper.createArrayNode();
        options.add(answer);
        for (String candidate : List.of("B", "M", "P", "S", "L", "C")) {
            if (!candidate.equals(answer) && options.size() < 3) {
                options.add(candidate);
            }
        }
        return options;
    }

    private ArrayNode syllableOptions(EarlyLiteracyWordBank.Entry entry) {
        ArrayNode options = objectMapper.createArrayNode();
        options.add(entry.syllables().get(0));
        for (String candidate : List.of("BA", "PA", "LA", "MA", "TO", "CA")) {
            if (!candidate.equals(entry.syllables().get(0)) && options.size() < 3) {
                options.add(candidate);
            }
        }
        return options;
    }

    private ArrayNode lettersFor(String word) {
        ArrayNode letters = objectMapper.createArrayNode();
        for (int index = 0; index < word.length(); index++) {
            letters.add(String.valueOf(word.charAt(index)));
        }
        return letters;
    }

    private String generatedAnswer(String type, ArrayNode items) {
        if (items.isEmpty()) {
            return "";
        }
        JsonNode first = items.get(0);
        return switch (type) {
            case "SEPARAR_SILABAS" -> joinArray(first.path("silabas"), "-");
            case "LETRA_INICIAL", "CIRCULAR_LETRA", "CACA_LETRA", "COMPLETAR_PALAVRA" -> first.path("resposta").asText();
            case "CONTAR_LETRAS" -> first.path("resposta").asText();
            case "LIGAR_FIGURA_PALAVRA" -> "Ligar cada figura a palavra correspondente.";
            default -> "";
        };
    }

    private String joinArray(JsonNode array, String separator) {
        List<String> values = new ArrayList<>();
        if (array.isArray()) {
            for (JsonNode value : array) {
                values.add(value.asText());
            }
        }
        return String.join(separator, values);
    }

    private Set<String> distinctTypes(List<ObjectNode> exercises) {
        Set<String> types = new LinkedHashSet<>();
        for (ObjectNode exercise : exercises) {
            types.add(exercise.path("tipo").asText());
        }
        return types;
    }

    private String normalizeType(String type) {
        String normalized = type == null ? "" : type.trim().toUpperCase(java.util.Locale.ROOT);
        if ("COMPLETAR_SILABA".equals(normalized)) {
            return "COMPLETAR_PALAVRA";
        }
        return normalized;
    }

    private String commandFor(String type) {
        return switch (type) {
            case "SEPARAR_SILABAS" -> "Separe as silabas.";
            case "LETRA_INICIAL" -> "Pinte a letra inicial.";
            case "LIGAR_FIGURA_PALAVRA" -> "Ligue figura e palavra.";
            case "COMPLETAR_PALAVRA" -> "Complete a palavra.";
            case "CIRCULAR_LETRA" -> "Circule a letra indicada.";
            case "CONTAR_LETRAS" -> "Conte as letras.";
            case "CACA_LETRA" -> "Ache a letra.";
            default -> "Faca a atividade.";
        };
    }

    private boolean isShortCommand(String command) {
        return command != null && !command.isBlank() && command.trim().split("\\s+").length <= 8;
    }

    private JsonNode parseObject(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            return node != null && node.isObject() ? node : objectMapper.createObjectNode();
        } catch (Exception ignored) {
            return objectMapper.createObjectNode();
        }
    }

    private String text(JsonNode node, String field, String fallback) {
        JsonNode value = node == null ? null : node.path(field);
        if (value != null && value.isTextual() && !value.asText().isBlank()) {
            return value.asText();
        }
        return fallback;
    }
}
