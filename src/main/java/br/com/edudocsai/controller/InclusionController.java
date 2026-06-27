package br.com.edudocsai.controller;

import br.com.edudocsai.dto.inclusion.AdaptRequest;
import br.com.edudocsai.dto.inclusion.AdaptResponse;
import br.com.edudocsai.service.InclusionAdaptationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/inclusion")
@RequiredArgsConstructor
@Tag(name = "Inclusion", description = "Adaptador de recursos didáticos para educação inclusiva (PDI)")
public class InclusionController {

    private final InclusionAdaptationService inclusionAdaptationService;

    @PostMapping("/adapt")
    @Operation(summary = "Adapta um plano de aula ou atividade para alunos com TDAH, TEA (Autismo) ou Dislexia")
    public AdaptResponse adaptContent(@Valid @RequestBody AdaptRequest request) {
        return inclusionAdaptationService.adaptContent(request);
    }
}
