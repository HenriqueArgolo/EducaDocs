package br.com.edudocsai.service;

import br.com.edudocsai.config.AiProperties;
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
public class GeminiImageQualityValidator {

    private final WebClient webClient;
    private final AiProperties properties;
    private final ObjectMapper objectMapper;

    public GeminiImageQualityValidator(
            @Qualifier("geminiWebClient") WebClient webClient,
            AiProperties properties,
            ObjectMapper objectMapper
    ) {
        this.webClient = webClient;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public ValidationResult validate(String subject, String mimeType, byte[] bytes) {
        AiProperties.Provider gemini = properties.gemini();
        if (gemini == null || !gemini.hasApiKey()) {
            throw new AiProviderException("Chave Gemini nao configurada para validar imagem");
        }

        String response = webClient.post()
                .uri("/v1beta/models/{model}:generateContent", gemini.model())
                .header("x-goog-api-key", gemini.apiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(buildPayload(subject, mimeType, bytes))
                .exchangeToMono(this::readResponse)
                .timeout(Duration.ofSeconds(45))
                .onErrorMap(error -> error instanceof AiProviderException
                        ? error
                        : new AiProviderException("Erro ao validar imagem com Gemini", error))
                .block();

        if (response == null || response.isBlank()) {
            throw new AiProviderException("Gemini retornou validacao de imagem vazia");
        }
        return parseValidation(response);
    }

    Map<String, Object> buildPayload(String subject, String mimeType, byte[] bytes) {
        String instruction = """
                Avalie esta ilustracao para uma atividade escolar infantil. O objeto solicitado e: "%s".
                Responda somente JSON com os campos booleanos subjectMatch, noText, isolated e printable,
                alem de reason curto. Considere printable apenas se houver fundo branco, contornos pretos claros,
                espessura moderada, poucos detalhes, nenhum corte e bom reconhecimento para criancas.
                """.formatted(subject);

        return Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(
                                Map.of("text", instruction),
                                Map.of("inline_data", Map.of(
                                        "mime_type", mimeType,
                                        "data", Base64.getEncoder().encodeToString(bytes)
                                ))
                        )
                )),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0
                )
        );
    }

    private Mono<String> readResponse(ClientResponse response) {
        return response.bodyToMono(String.class)
                .defaultIfEmpty("")
                .flatMap(body -> {
                    if (response.statusCode().isError()) {
                        return Mono.error(new AiProviderException(
                                "Gemini validacao retornou HTTP " + response.statusCode().value()
                        ));
                    }
                    return Mono.just(body);
                });
    }

    private ValidationResult parseValidation(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            String raw = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText();
            String normalized = raw.replace("```json", "").replace("```", "").trim();
            JsonNode result = objectMapper.readTree(normalized);
            boolean approved = result.path("subjectMatch").asBoolean(false)
                    && result.path("noText").asBoolean(false)
                    && result.path("isolated").asBoolean(false)
                    && result.path("printable").asBoolean(false);
            return new ValidationResult(approved, result.path("reason").asText(approved ? "ok" : "reprovada"));
        } catch (Exception exception) {
            throw new AiProviderException("Nao foi possivel interpretar a validacao da imagem", exception);
        }
    }

    public record ValidationResult(boolean approved, String reason) {
    }
}

