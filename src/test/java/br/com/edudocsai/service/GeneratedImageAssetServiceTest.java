package br.com.edudocsai.service;

import br.com.edudocsai.config.ImageGenerationProperties;
import br.com.edudocsai.entity.GeneratedImageAsset;
import br.com.edudocsai.exception.AiProviderException;
import br.com.edudocsai.repository.GeneratedImageAssetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GeneratedImageAssetServiceTest {

    @Mock
    private GeneratedImageAssetRepository repository;
    @Mock
    private GeminiImageClient imageClient;
    @Mock
    private ImageBinaryValidator binaryValidator;
    @Mock
    private GeminiImageQualityValidator qualityValidator;

    private GeneratedImageAssetService service;

    @BeforeEach
    void setUp() {
        service = new GeneratedImageAssetService(
                repository,
                imageClient,
                binaryValidator,
                qualityValidator,
                properties()
        );
    }

    @Test
    void reusesCachedAssetWithoutCallingProvider() {
        GeneratedImageAsset cached = asset(7L, "vaca");
        when(repository.findByCacheKey(anyString())).thenReturn(Optional.of(cached));

        Optional<GeneratedImageAsset> result = service.resolve(" VACA ");

        assertThat(result).contains(cached);
        verify(imageClient, never()).generate(anyString());
    }

    @Test
    void generatesValidatesAndStoresCacheMiss() {
        byte[] bytes = "valid-png".getBytes(StandardCharsets.UTF_8);
        GeneratedImageAsset saved = asset(9L, "vaca");
        when(repository.findByCacheKey(anyString())).thenReturn(Optional.empty());
        when(imageClient.generate(anyString())).thenReturn(new GeminiImageClient.GeneratedImage("image/png", bytes));
        when(binaryValidator.validate("image/png", bytes))
                .thenReturn(new ImageBinaryValidator.ValidationResult(true, "ok", 512, 512));
        when(qualityValidator.validate("vaca", "image/png", bytes))
                .thenReturn(new GeminiImageQualityValidator.ValidationResult(true, "ok"));
        when(repository.save(any(GeneratedImageAsset.class))).thenReturn(saved);

        Optional<GeneratedImageAsset> result = service.resolve("vaca");

        assertThat(result).contains(saved);
        verify(repository).save(any(GeneratedImageAsset.class));
    }

    @Test
    void retriesRejectedImageAndStoresNextApprovedResult() {
        byte[] first = "first-image".getBytes(StandardCharsets.UTF_8);
        byte[] second = "second-image".getBytes(StandardCharsets.UTF_8);
        GeneratedImageAsset saved = asset(10L, "pato");
        when(repository.findByCacheKey(anyString())).thenReturn(Optional.empty());
        when(imageClient.generate(anyString()))
                .thenReturn(new GeminiImageClient.GeneratedImage("image/png", first))
                .thenReturn(new GeminiImageClient.GeneratedImage("image/png", second));
        when(binaryValidator.validate("image/png", first))
                .thenReturn(new ImageBinaryValidator.ValidationResult(false, "borda", 512, 512));
        when(binaryValidator.validate("image/png", second))
                .thenReturn(new ImageBinaryValidator.ValidationResult(true, "ok", 512, 512));
        when(qualityValidator.validate("pato", "image/png", second))
                .thenReturn(new GeminiImageQualityValidator.ValidationResult(true, "ok"));
        when(repository.save(any(GeneratedImageAsset.class))).thenReturn(saved);

        Optional<GeneratedImageAsset> result = service.resolve("pato");

        assertThat(result).contains(saved);
        verify(imageClient, org.mockito.Mockito.times(2)).generate(anyString());
    }

    @Test
    void returnsEmptyWhenEveryAttemptFails() {
        when(repository.findByCacheKey(anyString())).thenReturn(Optional.empty());
        when(imageClient.generate(anyString())).thenThrow(new RuntimeException("provider unavailable"));

        Optional<GeneratedImageAsset> result = service.resolve("galo");

        assertThat(result).isEmpty();
        verify(imageClient, org.mockito.Mockito.times(3)).generate(anyString());
        verify(repository, never()).save(any());
    }

    @Test
    void doesNotRetryWhenPrepaymentCreditsAreDepleted() {
        when(repository.findByCacheKey(anyString())).thenReturn(Optional.empty());
        when(imageClient.generate(anyString()))
                .thenThrow(new AiProviderException("HTTP 429: prepayment credits are depleted"));

        Optional<GeneratedImageAsset> result = service.resolve("ovelha");

        assertThat(result).isEmpty();
        verify(imageClient).generate(anyString());
    }

    private GeneratedImageAsset asset(Long id, String subject) {
        return GeneratedImageAsset.builder()
                .id(id)
                .cacheKey("cache-key-" + id)
                .subject(subject)
                .prompt("prompt")
                .model("gemini-3.1-flash-image")
                .mimeType("image/png")
                .imageData(new byte[]{1, 2, 3})
                .width(512)
                .height(512)
                .build();
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
}
