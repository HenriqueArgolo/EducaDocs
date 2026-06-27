package br.com.edudocsai.service;

import br.com.edudocsai.config.AiProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class GeminiImageQualityValidatorTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void approvesImageWhenAllSemanticChecksPass() throws Exception {
        String validationJson = """
                {"subjectMatch":true,"noText":true,"isolated":true,"printable":true,"reason":"ok"}
                """;
        GeminiImageQualityValidator validator = new GeminiImageQualityValidator(
                webClientReturning(geminiBody(validationJson)),
                properties(),
                objectMapper
        );

        GeminiImageQualityValidator.ValidationResult result = validator.validate(
                "vaca",
                "image/png",
                "image-bytes".getBytes(StandardCharsets.UTF_8)
        );

        assertThat(result.approved()).isTrue();
        assertThat(result.reason()).isEqualTo("ok");
    }

    @Test
    void rejectsImageWhenSubjectDoesNotMatch() throws Exception {
        String validationJson = """
                {"subjectMatch":false,"noText":true,"isolated":true,"printable":true,"reason":"parece um cavalo"}
                """;
        GeminiImageQualityValidator validator = new GeminiImageQualityValidator(
                webClientReturning(geminiBody(validationJson)),
                properties(),
                objectMapper
        );

        GeminiImageQualityValidator.ValidationResult result = validator.validate(
                "vaca",
                "image/png",
                "image-bytes".getBytes(StandardCharsets.UTF_8)
        );

        assertThat(result.approved()).isFalse();
        assertThat(result.reason()).contains("cavalo");
    }

    private AiProperties properties() {
        return new AiProperties(
                new AiProperties.Provider("https://gemini.example", "gemini-key", "gemini-2.5-flash"),
                new AiProperties.Provider("https://openrouter.example", "openrouter-key", "model"),
                new AiProperties.Provider("https://deepseek.example", "deepseek-key", "model")
        );
    }

    private WebClient webClientReturning(String body) {
        return WebClient.builder()
                .baseUrl("https://example.test")
                .exchangeFunction(request -> Mono.just(ClientResponse.create(HttpStatus.OK)
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .body(body)
                        .build()))
                .build();
    }

    private String geminiBody(String aiJson) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "candidates", List.of(Map.of(
                        "content", Map.of("parts", List.of(Map.of("text", aiJson)))
                ))
        ));
    }
}

