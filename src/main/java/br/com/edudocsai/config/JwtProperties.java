package br.com.edudocsai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "edudocs.security")
public record JwtProperties(String jwtSecret, long jwtExpirationMinutes) {
}
