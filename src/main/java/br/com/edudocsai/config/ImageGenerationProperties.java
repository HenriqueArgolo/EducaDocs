package br.com.edudocsai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "edudocs.ai.image")
public record ImageGenerationProperties(
        boolean enabled,
        String baseUrl,
        String apiKey,
        String model,
        String imageSize,
        int maxAttempts,
        int maxAssetsPerActivity,
        int maxConcurrency
) {

    public boolean hasApiKey() {
        return apiKey != null && !apiKey.isBlank();
    }
}

