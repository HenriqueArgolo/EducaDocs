package br.com.edudocsai.controller;

import br.com.edudocsai.dto.lessonkit.*;
import br.com.edudocsai.entity.LessonKitMaterialType;
import br.com.edudocsai.service.lessonkit.LessonKitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/lesson-kits")
@RequiredArgsConstructor
public class LessonKitController {
    private static final MediaType DOCX_MEDIA_TYPE = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    private final LessonKitService service;

    @PostMapping("/from-plan/{documentId}")
    @ResponseStatus(HttpStatus.CREATED)
    public LessonKitResponse create(@PathVariable Long documentId) {
        return service.createFromPlan(documentId);
    }

    @GetMapping("/{id}")
    public LessonKitResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PutMapping("/{kitId}/materials/{type}")
    public LessonKitMaterialResponse update(@PathVariable Long kitId,
            @PathVariable LessonKitMaterialType type,
            @Valid @RequestBody UpdateLessonKitMaterialRequest request) {
        return service.update(kitId, type, request);
    }

    @PostMapping("/{kitId}/materials/{type}/regenerate")
    public LessonKitMaterialResponse regenerate(@PathVariable Long kitId,
            @PathVariable LessonKitMaterialType type,
            @Valid @RequestBody(required = false) RegenerateLessonKitMaterialRequest request) {
        return service.regenerate(kitId, type,
                request == null ? RegenerateLessonKitMaterialRequest.recommended() : request);
    }

    @GetMapping("/{kitId}/materials/{type}/export.docx")
    public ResponseEntity<byte[]> exportDocx(@PathVariable Long kitId,
            @PathVariable LessonKitMaterialType type) {
        return ResponseEntity.ok()
                .contentType(DOCX_MEDIA_TYPE)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("edudocs-kit-" + kitId + "-" + type.name().toLowerCase() + ".docx")
                        .build().toString())
                .body(service.exportDocx(kitId, type));
    }

    @GetMapping("/{kitId}/materials/{type}/export.pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable Long kitId,
            @PathVariable LessonKitMaterialType type) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename("edudocs-kit-" + kitId + "-" + type.name().toLowerCase() + ".pdf")
                        .build().toString())
                .body(service.exportPdf(kitId, type));
    }
}
