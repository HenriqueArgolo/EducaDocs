package br.com.edudocsai.service;

import br.com.edudocsai.dto.inclusion.AdaptRequest;
import br.com.edudocsai.dto.inclusion.AdaptResponse;
import br.com.edudocsai.dto.inclusion.InclusionType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class InclusionAdaptationService {

    private final AIService aiService;
    private final PromptModuleCatalog promptModuleCatalog;

    public AdaptResponse adaptContent(AdaptRequest request) {
        log.info("Adapting content for inclusion type={} targetType={} title='{}'", 
                request.type(), request.targetType(), request.title());

        String guidelines = getGuidelines(request.type());
        String prompt = buildPrompt(request, guidelines);
        
        String adaptedContent = aiService.generateJsonObject(prompt);
        String adaptedTitle = request.title() + " - Adaptado " + request.type();

        return new AdaptResponse(adaptedTitle, adaptedContent);
    }

    private String getGuidelines(InclusionType type) {
        return switch (type) {
            case TDAH -> promptModuleCatalog.getPromptByKey("inclusion_tdah_guidelines");
            case AUTISMO -> promptModuleCatalog.getPromptByKey("inclusion_autismo_guidelines");
            case DISLEXIA -> promptModuleCatalog.getPromptByKey("inclusion_dislexia_guidelines");
        };
    }

    private String buildPrompt(AdaptRequest request, String guidelines) {
        String template = promptModuleCatalog.getPromptByKey("inclusion_adaptation_base_prompt");
        return template.formatted(request.type(), request.targetType(), request.title(), request.content(), request.type(), guidelines);
    }
}
