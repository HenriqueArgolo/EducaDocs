package br.com.edudocsai.service;

import br.com.edudocsai.config.ImageGenerationProperties;
import br.com.edudocsai.exception.AiProviderException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GeminiImageClientTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void buildsLowCostSquareJpegRequest() {
        GeminiImageClient client = new GeminiImageClient(webClientReturning("{}"), properties(), objectMapper);

        Map<String, Object> payload = client.buildPayload("draw a cow");

        assertThat(payload).containsEntry("model", "gemini-3.1-flash-image");
        assertThat(payload).containsEntry("store", false);
        assertThat(payload.get("input")).isEqualTo(List.of(Map.of("type", "text", "text", "draw a cow")));
        assertThat(payload.get("response_format")).isEqualTo(Map.of(
                "type", "image",
                "mime_type", "image/jpeg",
                "aspect_ratio", "1:1",
                "image_size", "512"
        ));
    }

    @Test
    void extractsImageFromInteractionSteps() throws Exception {
        byte[] expected = "png-bytes".getBytes(StandardCharsets.UTF_8);
        String body = objectMapper.writeValueAsString(Map.of(
                "status", "completed",
                "steps", List.of(Map.of(
                        "type", "model_output",
                        "content", List.of(Map.of(
                                "type", "image",
                                "mime_type", "image/png",
                                "data", Base64.getEncoder().encodeToString(expected)
                        ))
                ))
        ));
        GeminiImageClient client = new GeminiImageClient(webClientReturning(body), properties(), objectMapper);

        GeminiImageClient.GeneratedImage result = client.generate("draw a cow");

        assertThat(result.mimeType()).isEqualTo("image/png");
        assertThat(result.bytes()).containsExactly(expected);
    }

    @Test
    void rejectsCompletedResponseWithoutImage() {
        GeminiImageClient client = new GeminiImageClient(
                webClientReturning("{\"status\":\"completed\",\"steps\":[]}"),
                properties(),
                objectMapper
        );

        assertThatThrownBy(() -> client.generate("draw a cow"))
                .isInstanceOf(AiProviderException.class)
                .hasMessageContaining("imagem");
    }

    private ImageGenerationProperties properties() {
        return new ImageGenerationProperties(
                true,
                "https://generativelanguage.googleapis.com",
                "gemini-key",
                "gemini-3.1-flash-image",
                "512",
                3,
                8,
                2
        );
    }

    private WebClient webClientReturning(String body) {
        return WebClient.builder()
                .baseUrl("https://example.test")
                .exchangeFunction(request -> {
                    assertThat(request.headers().getFirst("x-goog-api-key")).isEqualTo("gemini-key");
                    assertThat(request.url().getPath()).isEqualTo("/v1beta/interactions");
                    return Mono.just(ClientResponse.create(HttpStatus.OK)
                            .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .body(body)
                            .build());
                })
                .build();
    }
}
