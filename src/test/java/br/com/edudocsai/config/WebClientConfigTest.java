package br.com.edudocsai.config;

import br.com.edudocsai.service.GeminiImageClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class WebClientConfigTest {

    @Test
    void imageClientAcceptsResponsesLargerThanDefaultWebClientBuffer() throws Exception {
        byte[] expected = new byte[300 * 1024];
        Arrays.fill(expected, (byte) 7);
        String body = new ObjectMapper().writeValueAsString(Map.of(
                "status", "completed",
                "steps", List.of(Map.of(
                        "content", List.of(Map.of(
                                "type", "image",
                                "mime_type", "image/jpeg",
                                "data", Base64.getEncoder().encodeToString(expected)
                        ))
                ))
        ));

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1beta/interactions", exchange -> {
            byte[] response = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        });
        server.start();

        try {
            ImageGenerationProperties properties = new ImageGenerationProperties(
                    true,
                    "http://127.0.0.1:" + server.getAddress().getPort(),
                    "gemini-key",
                    "gemini-3.1-flash-image",
                    "512",
                    3,
                    8,
                    2
            );
            WebClientConfig config = new WebClientConfig();
            GeminiImageClient client = new GeminiImageClient(
                    config.geminiImageWebClient(properties),
                    properties,
                    new ObjectMapper()
            );

            GeminiImageClient.GeneratedImage result = client.generate("draw a cow");

            assertThat(result.mimeType()).isEqualTo("image/jpeg");
            assertThat(result.bytes()).containsExactly(expected);
        } finally {
            server.stop(0);
        }
    }
}
