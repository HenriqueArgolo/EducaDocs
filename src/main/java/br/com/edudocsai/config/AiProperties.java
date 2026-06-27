package br.com.edudocsai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "edudocs.ai")
public record AiProperties(Provider gemini, Provider openrouter, Provider deepseek) {

    public record Provider(String baseUrl, String apiKey, String model) {

        public boolean hasApiKey() {
            return apiKey != null && !apiKey.isBlank();
        }
    }
}
