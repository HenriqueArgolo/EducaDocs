package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.dto.document.GenerateDocumentRequest;
import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.GenerationRequest;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.AiProviderException;
import br.com.edudocsai.repository.DocumentRepository;
import br.com.edudocsai.repository.GenerationRequestRepository;
import br.com.edudocsai.service.AIService;
import br.com.edudocsai.service.BNCCService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonPlanGenerationService {

    private static final int MAX_ATTEMPTS = 3;
    private static final int MIN_ACCEPTABLE_SCORE = 90;

    private final LessonPlanRequestValidator requestValidator;
    private final BNCCService bnccService;
    private final BnccCompatibilityValidator bnccCompatibilityValidator;
    private final LessonPlanPromptBuilder promptBuilder;
    private final AIService aiService;
    private final LessonPlanAiParser parser;
    private final TemplateValidator templateValidator;
    private final TopicAlignmentValidator topicAlignmentValidator;
    private final QualityValidator qualityValidator;
    private final LessonPlanAssembler assembler;
    private final GenerationRequestRepository generationRequestRepository;
    private final DocumentRepository documentRepository;

    public Document generate(User user, GenerateDocumentRequest request) {
        LessonPlanRequestContext context = requestValidator.validate(request);
        List<BNCCSkill> skills = bnccService.validateAndLoad(context.bnccSkillIds());
        bnccCompatibilityValidator.validate(context.grade(), context.subject(), skills);
        String prompt = promptBuilder.build(context, skills);
        RuntimeException lastFailure = null;
        String finalJson = null;

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                finalJson = generateValidContentJson(context, skills, prompt);
                break;
            } catch (RuntimeException exception) {
                lastFailure = exception;
            }
        }

        if (finalJson == null) {
            throw new AiProviderException("Nao foi possivel gerar plano de aula valido apos 3 tentativas", lastFailure);
        }
        return save(user, context, finalJson);
    }

    private String generateValidContentJson(LessonPlanRequestContext context, List<BNCCSkill> skills, String prompt) {
        LessonPlanContent content = parser.parse(aiService.generateJsonObject(prompt));
        templateValidator.validate(content, context.totalMinutes());
        int topicScore = topicAlignmentValidator.score(context.topic(), content);
        if (topicScore < MIN_ACCEPTABLE_SCORE) {
            throw new LessonPlanValidationException("Plano de aula desalinhado ao tema informado");
        }
        QualityScore qualityScore = qualityValidator.score(content, topicScore, true);
        qualityValidator.assertAcceptable(qualityScore);
        return assembler.assembleJson(context, skills, content);
    }

    private Document save(User user, LessonPlanRequestContext context, String finalJson) {
        GenerationRequest generationRequest = generationRequestRepository.save(GenerationRequest.builder()
                .user(user)
                .documentType(DocumentType.LESSON_PLAN)
                .bnccSkillIds(context.bnccSkillIds())
                .topic(context.topic())
                .grade(context.grade())
                .subject(context.subject())
                .duration(context.durationText())
                .additionalInstructions(context.additionalInstructions())
                .build());

        return documentRepository.save(Document.builder()
                .user(user)
                .generationRequest(generationRequest)
                .type(DocumentType.LESSON_PLAN)
                .title(limitTitle("Plano de aula - " + context.topic()))
                .content(finalJson)
                .build());
    }

    private String limitTitle(String title) {
        return title.length() > 180 ? title.substring(0, 180) : title;
    }
}
