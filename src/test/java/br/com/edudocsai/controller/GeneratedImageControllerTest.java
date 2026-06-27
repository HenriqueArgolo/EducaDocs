package br.com.edudocsai.controller;

import br.com.edudocsai.entity.GeneratedImageAsset;
import br.com.edudocsai.exception.NotFoundException;
import br.com.edudocsai.repository.GeneratedImageAssetRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GeneratedImageControllerTest {

    @Mock
    private GeneratedImageAssetRepository repository;

    @Test
    void returnsStoredImageWithImmutablePublicCache() {
        byte[] bytes = new byte[]{1, 2, 3};
        GeneratedImageAsset asset = GeneratedImageAsset.builder()
                .id(42L)
                .cacheKey("key")
                .subject("vaca")
                .prompt("prompt")
                .model("gemini-3.1-flash-image")
                .mimeType("image/png")
                .imageData(bytes)
                .width(512)
                .height(512)
                .build();
        when(repository.findById(42L)).thenReturn(Optional.of(asset));
        GeneratedImageController controller = new GeneratedImageController(repository);

        ResponseEntity<byte[]> response = controller.getGeneratedImage(42L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/png");
        assertThat(response.getHeaders().getCacheControl())
                .contains("public")
                .contains("max-age=31536000")
                .contains("immutable");
        assertThat(response.getBody()).containsExactly(bytes);
    }

    @Test
    void rejectsUnknownImageId() {
        when(repository.findById(404L)).thenReturn(Optional.empty());
        GeneratedImageController controller = new GeneratedImageController(repository);

        assertThatThrownBy(() -> controller.getGeneratedImage(404L))
                .isInstanceOf(NotFoundException.class);
    }
}
