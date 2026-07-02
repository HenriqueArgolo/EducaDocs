package br.com.edudocsai.dto.presentation;

import jakarta.validation.constraints.NotBlank;

public record RefinePresentationRequest(
        @NotBlank(message = "A instrução não pode ser vazia")
        String instruction,
        
        Integer slideIndex
) {}
