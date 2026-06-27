package br.com.edudocsai.service;

import br.com.edudocsai.config.ImageGenerationProperties;
import br.com.edudocsai.entity.GeneratedImageAsset;
import br.com.edudocsai.repository.GeneratedImageAssetRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
public class GeneratedImageAssetService {

    private static final String STYLE_VERSION = "worksheet-line-art-v1";

    private final GeneratedImageAssetRepository repository;
    private final GeminiImageClient imageClient;
    private final ImageBinaryValidator binaryValidator;
    private final GeminiImageQualityValidator qualityValidator;
    private final ImageGenerationProperties properties;

    public GeneratedImageAssetService(
            GeneratedImageAssetRepository repository,
            GeminiImageClient imageClient,
            ImageBinaryValidator binaryValidator,
            GeminiImageQualityValidator qualityValidator,
            ImageGenerationProperties properties
    ) {
        this.repository = repository;
        this.imageClient = imageClient;
        this.binaryValidator = binaryValidator;
        this.qualityValidator = qualityValidator;
        this.properties = properties;
    }

    public Optional<GeneratedImageAsset> resolve(String subject) {
        if (!properties.enabled() || !properties.hasApiKey() || subject == null || subject.isBlank()) {
            return Optional.empty();
        }

        String normalizedSubject = normalizeSubject(subject);
        String cacheKey = cacheKey(normalizedSubject);
        Optional<GeneratedImageAsset> cached = repository.findByCacheKey(cacheKey);
        if (cached.isPresent()) {
            return cached;
        }

        String prompt = buildPrompt(subject.strip());
        int attempts = Math.max(1, properties.maxAttempts());
        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                GeminiImageClient.GeneratedImage generated = imageClient.generate(prompt);
                ImageBinaryValidator.ValidationResult binary = binaryValidator.validate(
                        generated.mimeType(),
                        generated.bytes()
                );
                if (!binary.approved()) {
                    log.info("Generated image rejected by binary validation subject={} attempt={} reason={}",
                            normalizedSubject, attempt, binary.reason());
                    continue;
                }

                boolean semanticApproved = true;
                try {
                    GeminiImageQualityValidator.ValidationResult semantic = qualityValidator.validate(
                            subject.strip(),
                            generated.mimeType(),
                            generated.bytes()
                    );
                    semanticApproved = semantic.approved();
                    if (!semanticApproved) {
                        log.info("Generated image rejected by semantic validation subject={} attempt={} reason={}",
                                normalizedSubject, attempt, semantic.reason());
                    }
                } catch (RuntimeException validationFailure) {
                    log.warn("Semantic image validation unavailable; accepting binary-approved image. subject={} reason={}",
                            normalizedSubject, validationFailure.getMessage());
                }

                if (!semanticApproved) {
                    continue;
                }

                GeneratedImageAsset asset = GeneratedImageAsset.builder()
                        .cacheKey(cacheKey)
                        .subject(limit(subject.strip(), 500))
                        .prompt(prompt)
                        .model(properties.model())
                        .mimeType(generated.mimeType())
                        .imageData(generated.bytes())
                        .width(binary.width())
                        .height(binary.height())
                        .build();
                try {
                    return Optional.of(repository.save(asset));
                } catch (DataIntegrityViolationException duplicate) {
                    return repository.findByCacheKey(cacheKey);
                }
            } catch (RuntimeException generationFailure) {
                log.warn("Generated image attempt failed subject={} attempt={} reason={}",
                        normalizedSubject, attempt, generationFailure.getMessage());
                if (isNonRetryable(generationFailure)) {
                    break;
                }
            }
        }
        return Optional.empty();
    }

    String buildPrompt(String subject) {
        return """
                Create a black-and-white educational worksheet illustration for a 6 to 7 year old child.
                Subject: "%s". Interpret the subject literally, including when written in Portuguese.
                Show one complete, friendly and immediately recognizable subject, centered and isolated on a pure white background.
                Use clean black outlines with medium-thick weight: clear for printing, but not exaggerated.
                Use simple natural proportions and only a few useful interior details.
                No text, letters, numbers, labels, border, frame, scenery, shadow, gray shading, color, solid black background or cropped parts.
                Printable school worksheet line art, square composition.
                """.formatted(subject);
    }

    private String normalizeSubject(String subject) {
        String decomposed = Normalizer.normalize(subject, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return decomposed.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String cacheKey(String normalizedSubject) {
        try {
            String value = String.join("|", properties.model(), properties.imageSize(), STYLE_VERSION, normalizedSubject);
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("Nao foi possivel criar chave de cache da imagem", exception);
        }
    }

    private String limit(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private boolean isNonRetryable(Throwable error) {
        Throwable current = error;
        while (current != null) {
            String message = current.getMessage();
            if (message != null) {
                String normalized = message.toLowerCase(Locale.ROOT);
                if (normalized.contains("prepayment credits are depleted")
                        || normalized.contains("billing account")
                        || normalized.contains("invalid_request")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }
}
