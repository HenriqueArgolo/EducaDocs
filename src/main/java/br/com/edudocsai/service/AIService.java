package br.com.edudocsai.service;

import br.com.edudocsai.config.AiProperties;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.exception.AiProviderException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AIService {

    private final WebClient geminiWebClient;
    private final WebClient openRouterWebClient;
    private final WebClient deepseekWebClient;
    private final AiProperties properties;
    private final ObjectMapper objectMapper;

    public AIService(
            @Qualifier("geminiWebClient") WebClient geminiWebClient,
            @Qualifier("openRouterWebClient") WebClient openRouterWebClient,
            @Qualifier("deepseekWebClient") WebClient deepseekWebClient,
            AiProperties properties,
            ObjectMapper objectMapper
    ) {
        this.geminiWebClient = geminiWebClient;
        this.openRouterWebClient = openRouterWebClient;
        this.deepseekWebClient = deepseekWebClient;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public AiGeneratedDocument generate(DocumentType documentType, String prompt) {
        try {
            return parseAiJson(callGemini(prompt), documentType);
        } catch (RuntimeException primaryException) {
            log.warn("Gemini provider failed. reason={}", primaryException.getMessage());
            
            if (properties.deepseek() != null && properties.deepseek().hasApiKey()) {
                try {
                    log.info("Attempting fallback to DeepSeek...");
                    return parseAiJson(callDeepSeek(prompt), documentType);
                } catch (RuntimeException dsException) {
                    log.warn("DeepSeek provider failed. reason={}", dsException.getMessage());
                    return tryOpenRouterFallback(prompt, documentType, primaryException, dsException);
                }
            } else {
                return tryOpenRouterFallback(prompt, documentType, primaryException, null);
            }
        }
    }

    private AiGeneratedDocument tryOpenRouterFallback(String prompt, DocumentType documentType, RuntimeException geminiErr, RuntimeException dsErr) {
        log.warn("Attempting fallback to OpenRouter...");
        try {
            return parseAiJson(callOpenRouter(prompt), documentType);
        } catch (RuntimeException fallbackException) {
            log.warn("OpenRouter provider failed. reason={}", fallbackException.getMessage());
            if (isRateLimit(geminiErr) || isRateLimit(dsErr) || isRateLimit(fallbackException)) {
                throw new AiProviderException("A inteligência artificial está temporariamente indisponível (alta demanda) ou com limite de requisições excedido. Por favor, aguarde um minuto antes de tentar novamente ou configure uma chave reserva.", fallbackException);
            }
            throw new AiProviderException("Falha ao gerar documento com os provedores de IA", fallbackException);
        }
    }

    public String generateJsonObject(String prompt) {
        try {
            return normalizeJsonObject(callGemini(prompt));
        } catch (RuntimeException primaryException) {
            log.warn("Gemini provider failed. reason={}", primaryException.getMessage());
            
            if (properties.deepseek() != null && properties.deepseek().hasApiKey()) {
                try {
                    log.info("Attempting fallback to DeepSeek...");
                    return normalizeJsonObject(callDeepSeek(prompt));
                } catch (RuntimeException dsException) {
                    log.warn("DeepSeek provider failed. reason={}", dsException.getMessage());
                    return tryOpenRouterFallbackJson(prompt, primaryException, dsException);
                }
            } else {
                return tryOpenRouterFallbackJson(prompt, primaryException, null);
            }
        }
    }

    private String tryOpenRouterFallbackJson(String prompt, RuntimeException geminiErr, RuntimeException dsErr) {
        log.warn("Attempting fallback to OpenRouter...");
        try {
            return normalizeJsonObject(callOpenRouter(prompt));
        } catch (RuntimeException fallbackException) {
            log.warn("OpenRouter provider failed. reason={}", fallbackException.getMessage());
            if (isRateLimit(geminiErr) || isRateLimit(dsErr) || isRateLimit(fallbackException)) {
                throw new AiProviderException("A inteligência artificial está temporariamente indisponível (alta demanda) ou com limite de requisições excedido. Por favor, aguarde um minuto antes de tentar novamente ou configure uma chave reserva.", fallbackException);
            }
            throw new AiProviderException("Falha ao gerar JSON estruturado com os provedores de IA", fallbackException);
        }
    }

    private boolean isRateLimit(Throwable error) {
        if (error == null) {
            return false;
        }
        String msg = error.getMessage();
        if (msg != null) {
            String upper = msg.toUpperCase();
            if (upper.contains("429") || 
                upper.contains("503") || 
                upper.contains("RESOURCE_EXHAUSTED") || 
                upper.contains("QUOTA EXCEEDED") || 
                upper.contains("LIMIT EXCEEDED") || 
                upper.contains("TOO MANY REQUESTS") ||
                upper.contains("UNAVAILABLE") ||
                upper.contains("HIGH DEMAND") ||
                upper.contains("TRY AGAIN LATER") ||
                upper.contains("TEMPORARY")) {
                return true;
            }
        }
        return isRateLimit(error.getCause());
    }

    private String callGemini(String prompt) {
        AiProperties.Provider gemini = properties.gemini();
        if (!gemini.hasApiKey()) {
            throw new AiProviderException("Chave Gemini nao configurada");
        }
        Map<String, Object> payload = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.4
                )
        );

        String response = geminiWebClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/v1beta/models/{model}:generateContent")
                        .queryParam("key", gemini.apiKey())
                        .build(gemini.model()))
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .exchangeToMono(clientResponse -> readProviderResponse("Gemini", clientResponse))
                .timeout(Duration.ofSeconds(60))
                .onErrorResume(error -> Mono.error(wrapProviderError("Erro no Gemini", error)))
                .block();

        if (response == null || response.isBlank()) {
            throw new AiProviderException("Gemini retornou resposta vazia");
        }
        return extractGeminiText(response);
    }

    private String callOpenRouter(String prompt) {
        AiProperties.Provider openrouter = properties.openrouter();
        if (!openrouter.hasApiKey()) {
            throw new AiProviderException("Chave OpenRouter nao configurada");
        }
        Map<String, Object> payload = Map.of(
                "model", openrouter.model(),
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", prompt
                )),
                "response_format", Map.of("type", "json_object"),
                "temperature", 0.4
        );

        String response = openRouterWebClient.post()
                .uri("/chat/completions")
                .headers(headers -> {
                    headers.setBearerAuth(openrouter.apiKey());
                    headers.set("HTTP-Referer", "https://edudocs.ai");
                    headers.set("X-Title", "EduDocs AI");
                })
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .exchangeToMono(clientResponse -> readProviderResponse("OpenRouter", clientResponse))
                .timeout(Duration.ofSeconds(60))
                .onErrorResume(error -> Mono.error(wrapProviderError("Erro no OpenRouter", error)))
                .block();

        if (response == null || response.isBlank()) {
            throw new AiProviderException("OpenRouter retornou resposta vazia");
        }
        return extractOpenRouterText(response);
    }

    private String callDeepSeek(String prompt) {
        AiProperties.Provider deepseek = properties.deepseek();
        if (deepseek == null || !deepseek.hasApiKey()) {
            throw new AiProviderException("Chave DeepSeek nao configurada");
        }
        Map<String, Object> payload = Map.of(
                "model", deepseek.model(),
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", prompt
                )),
                "response_format", Map.of("type", "json_object"),
                "temperature", 0.4
        );

        String response = deepseekWebClient.post()
                .uri("/chat/completions")
                .headers(headers -> headers.setBearerAuth(deepseek.apiKey()))
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .exchangeToMono(clientResponse -> readProviderResponse("DeepSeek", clientResponse))
                .timeout(Duration.ofSeconds(60))
                .onErrorResume(error -> Mono.error(wrapProviderError("Erro no DeepSeek", error)))
                .block();

        if (response == null || response.isBlank()) {
            throw new AiProviderException("DeepSeek retornou resposta vazia");
        }
        return extractDeepSeekText(response);
    }

    private String extractDeepSeekText(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode textNode = root.path("choices").path(0).path("message").path("content");
            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                throw new AiProviderException("DeepSeek retornou formato inesperado");
            }
            return textNode.asText();
        } catch (Exception exception) {
            throw new AiProviderException("Nao foi possivel ler resposta do DeepSeek", exception);
        }
    }

    private RuntimeException wrapProviderError(String fallbackMessage, Throwable error) {
        if (error instanceof AiProviderException aiProviderException) {
            return aiProviderException;
        }
        return new AiProviderException(fallbackMessage, error);
    }

    private Mono<String> readProviderResponse(String provider, ClientResponse response) {
        return response.bodyToMono(String.class)
                .defaultIfEmpty("")
                .flatMap(body -> {
                    if (response.statusCode().isError()) {
                        String sanitizedBody = body.replaceAll("\\s+", " ").trim();
                        if (sanitizedBody.length() > 600) {
                            sanitizedBody = sanitizedBody.substring(0, 600);
                        }
                        return Mono.error(new AiProviderException(
                                "%s retornou HTTP %s: %s".formatted(provider, response.statusCode().value(), sanitizedBody)
                        ));
                    }
                    return Mono.just(body);
                });
    }

    private String extractGeminiText(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                throw new AiProviderException("Gemini retornou formato inesperado");
            }
            return textNode.asText();
        } catch (Exception exception) {
            throw new AiProviderException("Nao foi possivel ler resposta do Gemini", exception);
        }
    }

    private String extractOpenRouterText(String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode textNode = root.path("choices").path(0).path("message").path("content");
            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                throw new AiProviderException("OpenRouter retornou formato inesperado");
            }
            return textNode.asText();
        } catch (Exception exception) {
            throw new AiProviderException("Nao foi possivel ler resposta do OpenRouter", exception);
        }
    }

    private AiGeneratedDocument parseAiJson(String rawText, DocumentType expectedType) {
        try {
            String json = extractJsonObject(rawText);
            JsonNode root = objectMapper.readTree(json);
            String type = root.path("tipo").asText();
            if (!type.isBlank() && !expectedType.name().equals(type)) {
                throw new AiProviderException("IA retornou tipo de documento divergente");
            }
            String title = firstNonBlank(root.path("titulo").asText(), root.path("title").asText(), "Documento pedagogico");
            String normalizedJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
            return new AiGeneratedDocument(title, normalizedJson);
        } catch (Exception exception) {
            throw new AiProviderException("IA nao retornou JSON estruturado valido", exception);
        }
    }

    private String normalizeJsonObject(String rawText) {
        try {
            String json = extractJsonObject(rawText);
            JsonNode root = objectMapper.readTree(json);
            if (!root.isObject()) {
                throw new AiProviderException("IA nao retornou objeto JSON");
            }
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
        } catch (AiProviderException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new AiProviderException("IA nao retornou JSON estruturado valido", exception);
        }
    }

    private String extractJsonObject(String rawText) {
        String normalized = rawText
                .replace("```json", "")
                .replace("```", "")
                .trim();
        int start = normalized.indexOf('{');
        int end = normalized.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new AiProviderException("Resposta da IA nao contem objeto JSON");
        }
        return normalized.substring(start, end + 1);
    }

    private String firstNonBlank(String first, String second, String fallback) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return fallback;
    }
}
