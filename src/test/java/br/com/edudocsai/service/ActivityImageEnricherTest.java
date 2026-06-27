package br.com.edudocsai.service;

import br.com.edudocsai.config.ImageGenerationProperties;
import br.com.edudocsai.entity.GeneratedImageAsset;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.concurrent.Executor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityImageEnricherTest {

    @Mock
    private GeneratedImageAssetService assetService;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Executor sameThreadExecutor = Runnable::run;
    private ActivityImageEnricher enricher;

    @BeforeEach
    void setUp() {
        enricher = new ActivityImageEnricher(objectMapper, assetService, properties(8), sameThreadExecutor);
    }

    @Test
    void enrichesEveryMatchingNodeAndResolvesRepeatedDescriptorOnce() throws Exception {
        String json = """
                {
                  "exercicios":[{"itens":[{"figura":"vaca"},{"figura":"VACA"}]}],
                  "paginas":[{"descricao_desenho":"um pato amigavel"}]
                }
                """;
        when(assetService.resolve("vaca")).thenReturn(Optional.of(asset(11L, "vaca")));
        when(assetService.resolve("um pato amigavel")).thenReturn(Optional.of(asset(12L, "pato")));

        JsonNode result = objectMapper.readTree(enricher.enrich(json, "1o ano", "animais da fazenda"));

        assertThat(result.path("exercicios").path(0).path("itens").path(0).path("imagemUrl").asText())
                .isEqualTo("/images/generated/11");
        assertThat(result.path("exercicios").path(0).path("itens").path(1).path("imagemUrl").asText())
                .isEqualTo("/images/generated/11");
        assertThat(result.path("paginas").path(0).path("imagemUrl").asText())
                .isEqualTo("/images/generated/12");
        verify(assetService).resolve("vaca");
        verify(assetService).resolve("um pato amigavel");
    }

    @Test
    void preservesExistingGeneratedImageUrl() {
        String json = "{\"itens\":[{\"figura\":\"vaca\",\"imagemUrl\":\"/images/generated/99\"}]}";

        String result = enricher.enrich(json, "1o ano", "fazenda");

        assertThat(result).contains("/images/generated/99");
        verify(assetService, never()).resolve("vaca");
    }

    @Test
    void limitsUniqueAssetsPerActivity() throws Exception {
        ActivityImageEnricher limited = new ActivityImageEnricher(
                objectMapper,
                assetService,
                properties(2),
                sameThreadExecutor
        );
        String json = """
                {"itens":[{"figura":"vaca"},{"figura":"pato"},{"figura":"galo"}]}
                """;
        when(assetService.resolve("vaca")).thenReturn(Optional.of(asset(1L, "vaca")));
        when(assetService.resolve("pato")).thenReturn(Optional.of(asset(2L, "pato")));

        JsonNode result = objectMapper.readTree(limited.enrich(json, "1o ano", "fazenda"));

        assertThat(result.path("itens").path(0).has("imagemUrl")).isTrue();
        assertThat(result.path("itens").path(1).has("imagemUrl")).isTrue();
        assertThat(result.path("itens").path(2).has("imagemUrl")).isFalse();
        verify(assetService, never()).resolve("galo");
    }

    @Test
    void returnsOriginalJsonWhenResolutionFails() {
        String json = "{\"itens\":[{\"figura\":\"vaca\"}]}";
        when(assetService.resolve("vaca")).thenThrow(new RuntimeException("provider unavailable"));

        String result = enricher.enrich(json, "1o ano", "fazenda");

        assertThat(result).isEqualTo(json);
    }

    private GeneratedImageAsset asset(Long id, String subject) {
        return GeneratedImageAsset.builder()
                .id(id)
                .cacheKey("key-" + id)
                .subject(subject)
                .prompt("prompt")
                .model("gemini-3.1-flash-image")
                .mimeType("image/png")
                .imageData(new byte[]{1})
                .width(512)
                .height(512)
                .build();
    }

    private ImageGenerationProperties properties(int maxAssets) {
        return new ImageGenerationProperties(
                true,
                "https://generativelanguage.googleapis.com",
                "gemini-key",
                "gemini-3.1-flash-image",
                "512",
                3,
                maxAssets,
                2
        );
    }
}

