package br.com.edudocsai.service;

import br.com.edudocsai.config.AiProperties;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.exception.AiProviderException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AIServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void generateUsesGeminiWhenPrimaryProviderReturnsValidJson() throws Exception {
        WebClient gemini = webClientReturning(geminiBody("{\"titulo\":\"Plano\",\"tipo\":\"LESSON_PLAN\",\"conteudo\":{}}"));
        WebClient openRouter = webClientFailing();
        AIService service = new AIService(gemini, openRouter, properties(), objectMapper);

        AiGeneratedDocument result = service.generate(DocumentType.LESSON_PLAN, "prompt");

        assertThat(result.title()).isEqualTo("Plano");
        assertThat(result.contentJson()).contains("\"tipo\" : \"LESSON_PLAN\"");
    }

    @Test
    void generateFallsBackToOpenRouterWhenGeminiFails() throws Exception {
        WebClient gemini = webClientFailing();
        WebClient openRouter = webClientReturning(openRouterBody("{\"titulo\":\"Rubrica\",\"tipo\":\"RUBRIC\",\"conteudo\":{}}"));
        AIService service = new AIService(gemini, openRouter, properties(), objectMapper);

        AiGeneratedDocument result = service.generate(DocumentType.RUBRIC, "prompt");

        assertThat(result.title()).isEqualTo("Rubrica");
        assertThat(result.contentJson()).contains("\"tipo\" : \"RUBRIC\"");
    }

    @Test
    void generateJsonObjectReturnsStructuredJsonWithoutTitleOrTypeRequirement() throws Exception {
        String lessonPlanContent = """
                {
                  "objectives": ["Identificar fracoes equivalentes"],
                  "contents": ["Representacao de fracoes"],
                  "methodology": {
                    "introduction": {"durationMinutes": 10, "description": "Ativar conhecimentos previos"},
                    "development": {"durationMinutes": 30, "description": "Resolver situacoes-problema"},
                    "closing": {"durationMinutes": 10, "description": "Sistematizar aprendizagens"}
                  },
                  "resources": ["Quadro branco", "Cartoes de fracoes", "Caderno"],
                  "evaluation": {"observableCriteria": ["Identifica fracoes equivalentes"]}
                }
                """;
        WebClient gemini = webClientReturning(geminiBody(lessonPlanContent));
        WebClient openRouter = webClientFailing();
        AIService service = new AIService(gemini, openRouter, properties(), objectMapper);

        String result = service.generateJsonObject("prompt");

        assertThat(result).contains("\"objectives\" :");
        assertThat(result).doesNotContain("\"tipo\"");
        assertThat(result).doesNotContain("\"titulo\"");
    }

    @Test
    void generateJsonObjectRejectsTopLevelArrayFromBothProviders() throws Exception {
        String arrayContent = "[{\"objectives\":[]}]";
        WebClient gemini = webClientReturning(geminiBody(arrayContent));
        WebClient openRouter = webClientReturning(openRouterBody(arrayContent));
        AIService service = new AIService(gemini, openRouter, properties(), objectMapper);

        assertThatThrownBy(() -> service.generateJsonObject("prompt"))
                .isInstanceOf(AiProviderException.class);
    }

    private AiProperties properties() {
        return new AiProperties(
                new AiProperties.Provider("https://gemini.example", "gemini-key", "gemini-1.5-flash"),
                new AiProperties.Provider("https://openrouter.example", "openrouter-key", "deepseek/deepseek-chat")
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

    private WebClient webClientFailing() {
        return WebClient.builder()
                .baseUrl("https://example.test")
                .exchangeFunction(request -> Mono.error(new RuntimeException("provider down")))
                .build();
    }

    private String geminiBody(String aiJson) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "candidates", List.of(Map.of(
                        "content", Map.of(
                                "parts", List.of(Map.of("text", aiJson))
                        )
                ))
        ));
    }

    private String openRouterBody(String aiJson) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "choices", List.of(Map.of(
                        "message", Map.of("content", aiJson)
                ))
        ));
    }
}
