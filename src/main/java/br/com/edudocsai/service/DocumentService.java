package br.com.edudocsai.service;

import br.com.edudocsai.dto.document.DocumentResponse;
import br.com.edudocsai.dto.document.GenerateDocumentRequest;
import br.com.edudocsai.dto.document.CreateDocumentRequest;
import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.GenerationRequest;
import br.com.edudocsai.entity.Role;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.ForbiddenException;
import br.com.edudocsai.exception.NotFoundException;
import br.com.edudocsai.repository.ClassroomTimelineItemRepository;
import br.com.edudocsai.repository.DocumentRepository;
import br.com.edudocsai.repository.StudentRepository;
import br.com.edudocsai.repository.GenerationRequestRepository;
import br.com.edudocsai.repository.LessonKitRepository;
import br.com.edudocsai.repository.LessonKitMaterialRepository;
import br.com.edudocsai.service.lessonplan.LessonPlanGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final CurrentUserService currentUserService;
    private final BNCCService bnccService;
    private final UsageLimitService usageLimitService;
    private final PromptTemplateService promptTemplateService;
    private final AIService aiService;
    private final DocumentGeneratorService documentGeneratorService;
    private final GenerationRequestRepository generationRequestRepository;
    private final DocumentRepository documentRepository;
    private final LessonPlanGenerationService lessonPlanGenerationService;
    private final ClassroomTimelineItemRepository classroomTimelineItemRepository;
    private final StudentRepository studentRepository;
    private final ActivityImageEnricher activityImageEnricher;
    private final LessonKitRepository lessonKitRepository;
    private final LessonKitMaterialRepository lessonKitMaterialRepository;

    @Transactional
    public DocumentResponse generate(GenerateDocumentRequest request) {
        User user = currentUserService.getCurrentUser();
        usageLimitService.assertCanGenerate(user);
        Document document = request.documentType() == DocumentType.LESSON_PLAN
                ? lessonPlanGenerationService.generate(user, request)
                : generateGeneric(user, request);
        usageLimitService.increment(user);

        if (request.timelineItemId() != null && request.documentType() != DocumentType.LESSON_PLAN) {
            classroomTimelineItemRepository.findById(request.timelineItemId()).ifPresent(item -> {
                item.setDocument(document);
                item.setStatus(br.com.edudocsai.entity.TimelineItemStatus.COMPLETED);
                classroomTimelineItemRepository.save(item);
            });
        }

        return toResponse(document);
    }

    @Transactional
    public DocumentResponse create(CreateDocumentRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        GenerationRequest genReq = null;
        if (request.generationRequestId() != null) {
            genReq = generationRequestRepository.findById(request.generationRequestId())
                    .orElse(null);
        }
        Document document = documentRepository.save(Document.builder()
                .user(currentUser)
                .generationRequest(genReq)
                .type(request.type())
                .title(limitTitle(request.title()))
                .content(request.content())
                .build());
        return toResponse(document);
    }

    private Document generateGeneric(User user, GenerateDocumentRequest request) {
        List<BNCCSkill> bnccSkills = bnccService.validateAndLoad(request.bnccSkillIds());
        String selectedGrade = firstNonBlank(request.grade(), summarizeGrades(bnccSkills));
        String selectedSubject = firstNonBlank(request.subject(), summarizeSubjects(bnccSkills));

        GenerationRequest generationRequest = generationRequestRepository.save(GenerationRequest.builder()
                .user(user)
                .documentType(request.documentType())
                .bnccSkillIds(request.bnccSkillIds())
                .topic(request.topic().trim())
                .grade(selectedGrade)
                .subject(selectedSubject)
                .duration(normalizeDuration(request.duration()))
                .additionalInstructions(blankToNull(request.additionalInstructions()))
                .templateStyle(request.templateStyle() != null ? request.templateStyle() : br.com.edudocsai.entity.TemplateStyle.INSTITUTIONAL)
                .numberOfQuestions(request.numberOfQuestions())
                .includeHeader(request.includeHeader())
                .build());

        String studentNeeds = "";
        if (request.classroomId() != null) {
            List<br.com.edudocsai.entity.Student> students = studentRepository.findByClassroomIdOrderByCreatedAtDesc(request.classroomId());
            if (!students.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                for (br.com.edudocsai.entity.Student student : students) {
                    if (student.getNeeds() != null && !student.getNeeds().isBlank()) {
                        sb.append(student.getName()).append(": ").append(student.getNeeds()).append("\n");
                    }
                }
                studentNeeds = sb.toString();
            }
        }

        String prompt = promptTemplateService.buildPrompt(
                request.documentType(),
                bnccSkills,
                selectedGrade,
                selectedSubject,
                request.topic().trim(),
                normalizeDuration(request.duration()),
                request.additionalInstructions(),
                request.numberOfQuestions(),
                request.includeHeader(),
                studentNeeds
        );
        log.info("Generating document userId={} type={} bnccCount={}", user.getId(), request.documentType(), bnccSkills.size());
        AiGeneratedDocument generated = aiService.generate(request.documentType(), prompt);

        String contentJson = generated.contentJson();
        if (request.documentType() == DocumentType.EXAM) {
            contentJson = activityImageEnricher.enrich(contentJson, selectedGrade, request.topic().trim());
        }

        Document document = documentRepository.save(Document.builder()
                .user(user)
                .generationRequest(generationRequest)
                .type(request.documentType())
                .title(limitTitle(generated.title()))
                .content(contentJson)
                .build());
        return document;
    }

    @Transactional(readOnly = true)
    public DocumentResponse getById(Long id) {
        User currentUser = currentUserService.getCurrentUser();
        Document document = getAuthorizedDocument(id, currentUser);
        return toResponse(document);
    }

    @Transactional(readOnly = true)
    public Page<DocumentResponse> getUserDocuments(Long userId, Pageable pageable) {
        User currentUser = currentUserService.getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN && !currentUser.getId().equals(userId)) {
            throw new ForbiddenException("Professor nao pode acessar documentos de outro usuario");
        }
        return documentRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public byte[] exportDocx(Long id, br.com.edudocsai.entity.TemplateStyle overrideStyle) {
        User currentUser = currentUserService.getCurrentUser();
        Document document = getAuthorizedDocument(id, currentUser);
        return documentGeneratorService.generateDocx(document, overrideStyle);
    }

    private Document getAuthorizedDocument(Long id, User currentUser) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Documento nao encontrado"));
        if (currentUser.getRole() != Role.ADMIN && !document.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Acesso negado ao documento");
        }
        return document;
    }

    @Transactional
    public DocumentResponse update(Long id, br.com.edudocsai.dto.document.UpdateDocumentRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Document document = getAuthorizedDocument(id, currentUser);
        document.setTitle(limitTitle(request.title()));
        document.setContent(request.content());
        return toResponse(documentRepository.save(document));
    }

    private DocumentResponse toResponse(Document document) {
        var kit = lessonKitRepository.findBySourceDocumentId(document.getId()).orElse(null);
        int readyMaterials = kit == null ? 0 : (int) lessonKitMaterialRepository.findByKitIdOrderByType(kit.getId())
                .stream().filter(material -> material.getStatus() == br.com.edudocsai.entity.LessonKitMaterialStatus.READY).count();
        return new DocumentResponse(
                document.getId(),
                document.getUser().getId(),
                document.getType(),
                document.getGenerationRequest() == null || document.getGenerationRequest().getTemplateStyle() == null
                        ? br.com.edudocsai.entity.TemplateStyle.INSTITUTIONAL
                        : document.getGenerationRequest().getTemplateStyle(),
                document.getTitle(),
                document.getGenerationRequest() == null ? null : document.getGenerationRequest().getGrade(),
                document.getGenerationRequest() == null ? null : document.getGenerationRequest().getSubject(),
                document.getContent(),
                document.getCreatedAt(),
                kit == null ? null : kit.getId(),
                kit == null ? null : kit.getStatus(),
                kit == null ? null : readyMaterials
        );
    }

    private String limitTitle(String title) {
        if (title == null || title.isBlank()) {
            return "Documento pedagogico";
        }
        String trimmed = title.trim();
        return trimmed.length() > 180 ? trimmed.substring(0, 180) : trimmed;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeDuration(String duration) {
        return duration == null || duration.isBlank() ? "50 minutos" : duration.trim();
    }

    private String firstNonBlank(String preferred, String fallback) {
        return preferred == null || preferred.isBlank() ? fallback : preferred.trim();
    }

    private String summarizeGrades(List<BNCCSkill> skills) {
        return summarize(skills.stream().map(BNCCSkill::getGrade).toList());
    }

    private String summarizeSubjects(List<BNCCSkill> skills) {
        return summarize(skills.stream().map(BNCCSkill::getSubject).toList());
    }

    private String summarize(List<String> values) {
        String joined = values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));
        return joined.isBlank() ? null : joined;
    }
}
