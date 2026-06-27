package br.com.edudocsai.controller;

import br.com.edudocsai.entity.GeneratedImageAsset;
import br.com.edudocsai.exception.NotFoundException;
import br.com.edudocsai.repository.GeneratedImageAssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/images/generated")
@RequiredArgsConstructor
public class GeneratedImageController {

    private final GeneratedImageAssetRepository repository;

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> getGeneratedImage(@PathVariable Long id) {
        GeneratedImageAsset asset = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Imagem gerada nao encontrada"));

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(asset.getMimeType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .body(asset.getImageData());
    }
}

