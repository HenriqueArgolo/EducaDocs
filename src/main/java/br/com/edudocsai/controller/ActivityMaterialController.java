package br.com.edudocsai.controller;

import br.com.edudocsai.dto.activity.ActivityMaterialResponse;
import br.com.edudocsai.dto.activity.CreateActivityRequest;
import br.com.edudocsai.dto.activity.GenerateActivityRequest;
import br.com.edudocsai.entity.ActivityType;
import br.com.edudocsai.service.ActivityMaterialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/activities")
@RequiredArgsConstructor
@Tag(name = "Activities", description = "Biblioteca de recursos, desenhos para colorir e jogos")
public class ActivityMaterialController {

    private final ActivityMaterialService activityMaterialService;

    @GetMapping
    @Operation(summary = "Lista e pesquisa recursos da biblioteca com filtros")
    public Page<ActivityMaterialResponse> getMaterials(
            @RequestParam(required = false) ActivityType type,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return activityMaterialService.getMaterials(type, grade, subject, search, pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca um material didatico pelo ID")
    public ActivityMaterialResponse getById(@PathVariable Long id) {
        return activityMaterialService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cria um material didatico manualmente na biblioteca")
    public ActivityMaterialResponse create(@Valid @RequestBody CreateActivityRequest request) {
        return activityMaterialService.create(request);
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Gera um recurso didatico / livro de colorir por IA")
    public ActivityMaterialResponse generate(@Valid @RequestBody GenerateActivityRequest request) {
        return activityMaterialService.generate(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Exclui um material didatico pessoal do catalogo")
    public void delete(@PathVariable Long id) {
        activityMaterialService.delete(id);
    }

    @GetMapping("/{id}/pdf")
    @Operation(summary = "Retorna o arquivo PDF do material didático")
    public org.springframework.http.ResponseEntity<byte[]> getPdf(@PathVariable Long id) {
        byte[] pdfBytes = activityMaterialService.getPdfFile(id);
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDisposition(org.springframework.http.ContentDisposition.inline().filename("material-" + id + ".pdf").build());
        return new org.springframework.http.ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }

    @PostMapping("/import-downloads")
    @Operation(summary = "Importa PDFs locais da pasta de Downloads para o banco de dados")
    public String importDownloads() {
        int count = activityMaterialService.importLocalMaterials();
        return "Importacao concluida com sucesso! Total de arquivos importados no banco: " + count;
    }
}
