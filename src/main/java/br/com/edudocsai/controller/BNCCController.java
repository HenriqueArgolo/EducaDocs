package br.com.edudocsai.controller;

import br.com.edudocsai.dto.bncc.BNCCSkillRequest;
import br.com.edudocsai.dto.bncc.BNCCSkillResponse;
import br.com.edudocsai.service.BNCCService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/bncc")
@RequiredArgsConstructor
@Tag(name = "BNCC", description = "Consulta e importacao de habilidades BNCC")
public class BNCCController {

    private final BNCCService bnccService;

    @GetMapping
    @Operation(summary = "Lista habilidades BNCC filtrando por ano, disciplina e codigo")
    public List<BNCCSkillResponse> find(
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String code
    ) {
        return bnccService.find(grade, subject, code);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca habilidade BNCC por ID")
    public BNCCSkillResponse getById(@PathVariable Long id) {
        return bnccService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Importa habilidades BNCC", description = "Restrito a usuarios ADMIN.")
    public List<BNCCSkillResponse> create(@Valid @RequestBody List<@Valid BNCCSkillRequest> requests) {
        return bnccService.createAll(requests);
    }
}
