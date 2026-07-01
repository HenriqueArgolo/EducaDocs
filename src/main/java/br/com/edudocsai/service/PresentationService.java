package br.com.edudocsai.service;

import br.com.edudocsai.dto.presentation.CreatePresentationRequest;
import br.com.edudocsai.dto.presentation.GeneratePresentationRequest;
import br.com.edudocsai.dto.presentation.PresentationResponse;
import br.com.edudocsai.entity.Presentation;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.ForbiddenException;
import br.com.edudocsai.exception.NotFoundException;
import br.com.edudocsai.repository.PresentationRepository;
import br.com.edudocsai.repository.StudentRepository;
import br.com.edudocsai.entity.Student;
import br.com.edudocsai.service.PromptBuilderHelper;
import br.com.edudocsai.service.PromptBuilderHelper.GradeLevel;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PresentationService {

    private final PresentationRepository presentationRepository;
    private final CurrentUserService currentUserService;
    private final UsageLimitService usageLimitService;
    private final AIService aiService;
    private final ObjectMapper objectMapper;
    private final StudentRepository studentRepository;
    private final PromptBuilderHelper promptBuilderHelper;
    private final PromptModuleCatalog promptModuleCatalog;

    @Transactional(readOnly = true)
    public Page<PresentationResponse> getPresentations(String search, Pageable pageable) {
        User currentUser = currentUserService.getCurrentUser();
        if (search == null || search.isBlank()) {
            return presentationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId(), pageable)
                    .map(this::toResponse);
        }
        return presentationRepository.searchPresentations(currentUser.getId(), search, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public PresentationResponse getById(Long id) {
        Presentation presentation = presentationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Apresentação não encontrada"));

        User currentUser = currentUserService.getCurrentUser();
        if (!presentation.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Você não tem permissão para acessar esta apresentação");
        }

        return toResponse(presentation);
    }

    @Transactional
    public PresentationResponse create(CreatePresentationRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Presentation presentation = presentationRepository.save(Presentation.builder()
                .title(request.title())
                .topic(request.topic())
                .grade(request.grade())
                .subject(request.subject())
                .slidesJson(request.slidesJson())
                .user(currentUser)
                .build());
        return toResponse(presentation);
    }

    @Transactional
    public PresentationResponse generate(GeneratePresentationRequest request) {
        User user = currentUserService.getCurrentUser();
        usageLimitService.assertCanGenerate(user);

        log.info("Generating slides presentation for topic='{}' user={}", request.topic(), user.getId());

        String prompt = buildPrompt(request);
        String jsonResult = aiService.generateJsonObject(prompt);

        String title = "Apresentação: " + request.topic();
        try {
            JsonNode root = objectMapper.readTree(jsonResult);
            if (root.has("titulo") && !root.get("titulo").asText().isBlank()) {
                title = root.get("titulo").asText();
            }
        } catch (Exception e) {
            log.warn("Failed to parse presentation JSON for title extraction. error={}", e.getMessage());
        }

        Presentation presentation = presentationRepository.save(Presentation.builder()
                .title(limitTitle(title))
                .topic(request.topic())
                .grade(request.grade())
                .subject(request.subject())
                .slidesJson(jsonResult)
                .user(user)
                .build());

        usageLimitService.increment(user);

        return toResponse(presentation);
    }

    @Transactional
    public void delete(Long id) {
        Presentation presentation = presentationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Apresentação não encontrada"));

        User currentUser = currentUserService.getCurrentUser();
        if (!presentation.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Você não tem permissão para excluir esta apresentação");
        }

        presentationRepository.delete(presentation);
    }

    private String buildPrompt(GeneratePresentationRequest request) {
        GradeLevel level = promptBuilderHelper.classifyGrade(request.grade());
        String basePrompt = promptBuilderHelper.getBasePrompt();
        String personaPrompt = promptBuilderHelper.getPersonaPrompt(level);

        String studentNeedsText = "";
        if (request.classroomId() != null) {
            List<Student> students = studentRepository.findByClassroomIdOrderByCreatedAtDesc(request.classroomId());
            if (!students.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                for (Student student : students) {
                    if (student.getNeeds() != null && !student.getNeeds().isBlank()) {
                        sb.append(student.getName()).append(": ").append(student.getNeeds()).append("\n");
                    }
                }
                studentNeedsText = sb.toString();
            }
        }
        String inclusionPrompt = promptBuilderHelper.getInclusionPrompt(studentNeedsText);

        int minSlides = 6;
        int maxSlides = 9;
        String suggestedStructure = switch (level) {
            case INFANTIL -> promptModuleCatalog.getPromptByKey("presentation_structure_infantil");
            case FUNDAMENTAL_1_ANO -> promptModuleCatalog.getPromptByKey("presentation_structure_fundamental_1_ano");
            case FUNDAMENTAL_INICIAIS -> promptModuleCatalog.getPromptByKey("presentation_structure_fundamental_iniciais");
            case FUNDAMENTAL_FINAIS -> promptModuleCatalog.getPromptByKey("presentation_structure_fundamental_finais");
            case ENSINO_MEDIO -> promptModuleCatalog.getPromptByKey("presentation_structure_ensino_medio");
            case EJA -> promptModuleCatalog.getPromptByKey("presentation_structure_eja");
        };

        String additional = request.additionalInstructions() != null && !request.additionalInstructions().isBlank()
                ? "\nInstruções específicas complementares do professor:\n" + request.additionalInstructions()
                : "";

        String taskTemplate = promptModuleCatalog.getPromptByKey("presentation_generation_base_prompt");
        String taskPrompt = taskTemplate.formatted(
                request.grade(),
                request.subject(),
                request.topic(),
                additional,
                minSlides,
                maxSlides,
                suggestedStructure
        );

        return String.join("\n\n",
                basePrompt,
                personaPrompt,
                inclusionPrompt,
                taskPrompt
        );
    }

    private String limitTitle(String title) {
        if (title.length() > 180) {
            return title.substring(0, 177) + "...";
        }
        return title;
    }

    private PresentationResponse toResponse(Presentation presentation) {
        return new PresentationResponse(
                presentation.getId(),
                presentation.getTitle(),
                presentation.getTopic(),
                presentation.getGrade(),
                presentation.getSubject(),
                presentation.getSlidesJson(),
                presentation.getCreatedAt()
        );
    }
}
