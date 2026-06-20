package br.com.edudocsai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "edudocs.usage")
public record UsageProperties(int dailyGenerationLimit) {
}
