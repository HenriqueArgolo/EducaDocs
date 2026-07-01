package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.dto.document.GenerateDocumentRequest;
import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.GenerationRequest;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.AiProviderException;
import br.com.edudocsai.repository.ClassroomTimelineItemRepository;
import br.com.edudocsai.repository.DocumentRepository;
import br.com.edudocsai.repository.GenerationRequestRepository;
import br.com.edudocsai.repository.StudentRepository;
import br.com.edudocsai.service.AIService;
import br.com.edudocsai.service.BNCCService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
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
    private final StudentRepository studentRepository;
    private final ClassroomTimelineItemRepository classroomTimelineItemRepository;

    public Document generate(User user, GenerateDocumentRequest request) {
        LessonPlanRequestContext context = requestValidator.validate(request);
        List<BNCCSkill> skills = bnccService.validateAndLoad(context.bnccSkillIds());
        bnccCompatibilityValidator.validate(context.grade(), context.subject(), skills);

        String pdiContext = "";
        if (context.classroomId() != null) {
            List<br.com.edudocsai.entity.Student> students = studentRepository.findByClassroomIdOrderByCreatedAtDesc(context.classroomId());
            if (!students.isEmpty()) {
                StringBuilder pdiBuilder = new StringBuilder("\nAlunos com necessidades especiais de inclusão reais nesta turma. Adapte a seção 'inclusiveAdaptations' especificamente para eles:\n");
                for (br.com.edudocsai.entity.Student student : students) {
                    if (student.getNeeds() != null && !student.getNeeds().isBlank()) {
                        pdiBuilder.append("- ").append(student.getName()).append(": ").append(student.getNeeds()).append("\n");
                    }
                }
                pdiContext = pdiBuilder.toString();
            }
        }

        String prompt = promptBuilder.build(context, skills) + pdiContext + activitySettingsPrompt(request.activitySettings());
        RuntimeException lastFailure = null;
        String finalJson = null;

        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                finalJson = generateValidContentJson(context, skills, prompt);
                break;
            } catch (RuntimeException exception) {
                log.warn(
                        "Lesson plan generation attempt failed attempt={} topic={} reason={}",
                        attempt,
                        context.topic(),
                        exception.getMessage(),
                        exception
                );
                lastFailure = exception;
            }
        }

        if (finalJson == null) {
            throw new AiProviderException("Nao foi possivel gerar plano de aula valido apos 3 tentativas", lastFailure);
        }

        Document savedDoc = save(user, context, finalJson, request.activitySettings());

        if (context.timelineItemId() != null) {
            classroomTimelineItemRepository.findById(context.timelineItemId()).ifPresent(item -> {
                item.setDocument(savedDoc);
                item.setStatus(br.com.edudocsai.entity.TimelineItemStatus.COMPLETED);
                classroomTimelineItemRepository.save(item);
            });
        }

        return savedDoc;
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

    private Document save(User user, LessonPlanRequestContext context, String finalJson,
                          br.com.edudocsai.dto.lessonkit.RegenerateLessonKitMaterialRequest activitySettings) {
        GenerationRequest generationRequest = generationRequestRepository.save(GenerationRequest.builder()
                .user(user)
                .documentType(DocumentType.LESSON_PLAN)
                .bnccSkillIds(context.bnccSkillIds())
                .topic(context.topic())
                .grade(context.grade())
                .subject(context.subject())
                .duration(context.durationText())
                .additionalInstructions(context.additionalInstructions())
                .templateStyle(context.templateStyle())
                .numberOfQuestions(0)
                .includeHeader(false)
                .planningPeriod(context.planningPeriod())
                .lessonsPerWeek(context.lessonsPerWeek())
                .activityCount(activitySettings == null ? null : activitySettings.activityCount())
                .exercisesPerActivity(activitySettings == null ? null : activitySettings.exercisesPerActivity())
                .activityFormat(activitySettings == null ? null : activitySettings.format())
                .activityPurpose(activitySettings == null ? null : activitySettings.purpose())
                .activityDifficulty(activitySettings == null ? null : activitySettings.difficulty())
                .activityModality(activitySettings == null ? null : activitySettings.modality())
                .build());

        return documentRepository.save(Document.builder()
                .user(user)
                .generationRequest(generationRequest)
                .type(DocumentType.LESSON_PLAN)
                .title(limitTitle("Plano de aula - " + context.topic()))
                .content(finalJson)
                .build());
    }

    private String activitySettingsPrompt(
            br.com.edudocsai.dto.lessonkit.RegenerateLessonKitMaterialRequest settings) {
        if (settings == null) return "";
        return """

                CONFIGURAÇÃO OBRIGATÓRIA DAS ATIVIDADES DO KIT:
                - %d folhas de atividade independentes
                - %d exercícios em cada folha
                - formato %s
                - finalidade %s
                - dificuldade %s
                - modalidade %s
                Respeite exatamente essas quantidades em kitAulaCompleta.atividadeAluno.
                """.formatted(settings.activityCount(), settings.exercisesPerActivity(), settings.format(),
                settings.purpose(), settings.difficulty(), settings.modality());
    }

    private String limitTitle(String title) {
        return title.length() > 180 ? title.substring(0, 180) : title;
    }
}
