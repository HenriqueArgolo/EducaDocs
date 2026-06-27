package br.com.edudocsai.service;

import br.com.edudocsai.config.ImageGenerationProperties;
import br.com.edudocsai.entity.GeneratedImageAsset;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Slf4j
@Service
public class ActivityImageEnricher {

    private static final List<String> DESCRIPTOR_FIELDS = List.of(
            "figura",
            "figure",
            "descricao_desenho",
            "palavras_chave_imagem"
    );

    private final ObjectMapper objectMapper;
    private final GeneratedImageAssetService assetService;
    private final ImageGenerationProperties properties;
    private final Executor executor;

    public ActivityImageEnricher(
            ObjectMapper objectMapper,
            GeneratedImageAssetService assetService,
            ImageGenerationProperties properties,
            @Qualifier("imageGenerationExecutor") Executor executor
    ) {
        this.objectMapper = objectMapper;
        this.assetService = assetService;
        this.properties = properties;
        this.executor = executor;
    }

    public String enrich(String json, String grade, String topic) {
        if (!properties.enabled() || !properties.hasApiKey() || json == null || json.isBlank()) {
            return json;
        }

        try {
            JsonNode root = objectMapper.readTree(json);
            Map<String, DescriptorGroup> groups = new LinkedHashMap<>();
            collectDescriptors(root, groups);
            if (groups.isEmpty()) {
                return json;
            }

            int limit = Math.max(0, properties.maxAssetsPerActivity());
            List<DescriptorGroup> selected = groups.values().stream().limit(limit).toList();
            Map<String, CompletableFuture<Optional<GeneratedImageAsset>>> futures = new LinkedHashMap<>();
            for (DescriptorGroup group : selected) {
                futures.put(group.key(), CompletableFuture.supplyAsync(
                        () -> assetService.resolve(group.subject()),
                        executor
                ));
            }

            for (DescriptorGroup group : selected) {
                Optional<GeneratedImageAsset> asset = futures.get(group.key()).join();
                if (asset.isEmpty() || asset.get().getId() == null) {
                    continue;
                }
                String imageUrl = "/images/generated/" + asset.get().getId();
                group.nodes().forEach(node -> node.put("imagemUrl", imageUrl));
            }
            return objectMapper.writeValueAsString(root);
        } catch (Exception exception) {
            log.warn("Activity image enrichment skipped grade={} topic={} reason={}",
                    grade, topic, exception.getMessage());
            return json;
        }
    }

    private void collectDescriptors(JsonNode node, Map<String, DescriptorGroup> groups) {
        if (node == null) {
            return;
        }
        if (node.isObject()) {
            ObjectNode object = (ObjectNode) node;
            String existingUrl = object.path("imagemUrl").asText();
            if (existingUrl.isBlank()) {
                String subject = descriptor(object);
                if (subject != null) {
                    String key = normalize(subject);
                    DescriptorGroup group = groups.computeIfAbsent(
                            key,
                            ignored -> new DescriptorGroup(key, subject, new ArrayList<>())
                    );
                    group.nodes().add(object);
                }
            }
            object.elements().forEachRemaining(child -> collectDescriptors(child, groups));
        } else if (node.isArray()) {
            node.elements().forEachRemaining(child -> collectDescriptors(child, groups));
        }
    }

    private String descriptor(ObjectNode object) {
        for (String field : DESCRIPTOR_FIELDS) {
            String value = object.path(field).asText().strip();
            if (!value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String normalize(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private record DescriptorGroup(String key, String subject, List<ObjectNode> nodes) {
    }
}

