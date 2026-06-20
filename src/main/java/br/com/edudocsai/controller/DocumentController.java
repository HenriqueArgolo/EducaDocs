package br.com.edudocsai.controller;

import br.com.edudocsai.dto.document.DocumentResponse;
import br.com.edudocsai.dto.document.GenerateDocumentRequest;
import br.com.edudocsai.service.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
@Tag(name = "Documents", description = "Geracao, historico e exportacao de documentos")
public class DocumentController {

    private static final MediaType DOCX_MEDIA_TYPE = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private final DocumentService documentService;

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Gera documento pedagogico com IA usando BNCC validada")
    public DocumentResponse generate(@Valid @RequestBody GenerateDocumentRequest request) {
        return documentService.generate(request);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca documento por ID")
    public DocumentResponse getById(@PathVariable Long id) {
        return documentService.getById(id);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Lista historico paginado de documentos do usuario")
    public Page<DocumentResponse> getUserDocuments(
            @PathVariable Long userId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return documentService.getUserDocuments(userId, pageable);
    }

    @GetMapping("/{id}/export.docx")
    @Operation(summary = "Exporta documento em DOCX")
    public ResponseEntity<byte[]> exportDocx(@PathVariable Long id) {
        byte[] body = documentService.exportDocx(id);
        return ResponseEntity.ok()
                .contentType(DOCX_MEDIA_TYPE)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename("edudocs-documento-" + id + ".docx")
                                .build()
                                .toString()
                )
                .body(body);
    }
}
