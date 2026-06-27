package br.com.edudocsai.controller;

import br.com.edudocsai.dto.presentation.CreatePresentationRequest;
import br.com.edudocsai.dto.presentation.GeneratePresentationRequest;
import br.com.edudocsai.dto.presentation.PresentationResponse;
import br.com.edudocsai.service.PresentationService;
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
@RequestMapping("/presentations")
@RequiredArgsConstructor
@Tag(name = "Presentations", description = "Gerador de apresentações de slides pedagógicos")
public class PresentationController {

    private final PresentationService presentationService;

    @GetMapping
    @Operation(summary = "Lista e pesquisa apresentações de slides do usuário logado")
    public Page<PresentationResponse> getPresentations(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return presentationService.getPresentations(search, pageable);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca uma apresentação pelo ID")
    public PresentationResponse getById(@PathVariable Long id) {
        return presentationService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Salva uma apresentação de slides na conta do usuário")
    public PresentationResponse create(@Valid @RequestBody CreatePresentationRequest request) {
        return presentationService.create(request);
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Gera uma apresentação de slides por IA")
    public PresentationResponse generate(@Valid @RequestBody GeneratePresentationRequest request) {
        return presentationService.generate(request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Exclui uma apresentação de slides da conta")
    public void delete(@PathVariable Long id) {
        presentationService.delete(id);
    }
}
