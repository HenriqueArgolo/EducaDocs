package br.com.edudocsai.service;

import br.com.edudocsai.config.ImageGenerationProperties;
import br.com.edudocsai.exception.AiProviderException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class GeminiImageClient {

    private final WebClient webClient;
    private final ImageGenerationProperties properties;
    private final ObjectMapper objectMapper;

    public GeminiImageClient(
            @Qualifier("geminiImageWebClient") WebClient webClient,
            ImageGenerationProperties properties,
            ObjectMapper objectMapper
    ) {
        this.webClient = webClient;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public GeneratedImage generate(String prompt) {
        if (!properties.enabled() || !properties.hasApiKey()) {
            throw new AiProviderException("Geracao de imagem Gemini nao configurada");
        }

        String response = webClient.post()
                .uri("/v1beta/interactions")
                .header("x-goog-api-key", properties.apiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(buildPayload(prompt))
                .exchangeToMono(this::readResponse)
                .timeout(Duration.ofSeconds(120))
                .onErrorMap(error -> error instanceof AiProviderException
                        ? error
                        : new AiProviderException("Erro ao gerar imagem com Gemini", error))
                .block();

        if (response == null || response.isBlank()) {
            throw new AiProviderException("Gemini retornou resposta de imagem vazia");
        }
        return extractImage(response);
    }

    Map<String, Object> buildPayload(String prompt) {
        return Map.of(
                "model", properties.model(),
                "input", List.of(Map.of("type", "text", "text", prompt)),
                "response_format", Map.of(
                        "type", "image",
                        "mime_type", "image/jpeg",
                        "aspect_ratio", "1:1",
                        "image_size", properties.imageSize()
                ),
                "store", false
        );
    }

    private Mono<String> readResponse(ClientResponse response) {
        return response.bodyToMono(String.class)
                .defaultIfEmpty("")
                .flatMap(body -> {
                    if (response.statusCode().isError()) {
                        String sanitized = body.replaceAll("\"data\"\\s*:\\s*\"[^\"]+\"", "\"data\":\"[omitted]\"");
                        if (sanitized.length() > 600) {
                            sanitized = sanitized.substring(0, 600);
                        }
                        return Mono.error(new AiProviderException(
                                "Gemini Image retornou HTTP %d: %s".formatted(response.statusCode().value(), sanitized)
                        ));
                    }
                    return Mono.just(body);
                });
    }

    private GeneratedImage extractImage(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode selected = null;
            for (JsonNode step : root.path("steps")) {
                for (JsonNode content : step.path("content")) {
                    if ("image".equals(content.path("type").asText()) && !content.path("data").asText().isBlank()) {
                        selected = content;
                    }
                }
            }

            if (selected == null) {
                throw new AiProviderException("Gemini nao retornou imagem na resposta");
            }

            byte[] bytes = Base64.getDecoder().decode(selected.path("data").asText());
            String mimeType = selected.path("mime_type").asText("image/png");
            if (bytes.length == 0) {
                throw new AiProviderException("Gemini retornou imagem vazia");
            }
            return new GeneratedImage(mimeType, bytes);
        } catch (AiProviderException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new AiProviderException("Nao foi possivel ler a imagem retornada pelo Gemini", exception);
        }
    }

    public record GeneratedImage(String mimeType, byte[] bytes) {
    }
}
