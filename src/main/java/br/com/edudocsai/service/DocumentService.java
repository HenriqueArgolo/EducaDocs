package br.com.edudocsai.service;

import br.com.edudocsai.dto.document.DocumentResponse;
import br.com.edudocsai.dto.document.GenerateDocumentRequest;
import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.GenerationRequest;
import br.com.edudocsai.entity.Role;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.ForbiddenException;
import br.com.edudocsai.exception.NotFoundException;
import br.com.edudocsai.repository.DocumentRepository;
import br.com.edudocsai.repository.GenerationRequestRepository;
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

    @Transactional
    public DocumentResponse generate(GenerateDocumentRequest request) {
        User user = currentUserService.getCurrentUser();
        usageLimitService.assertCanGenerate(user);
        Document document = request.documentType() == DocumentType.LESSON_PLAN
                ? lessonPlanGenerationService.generate(user, request)
                : generateGeneric(user, request);
        usageLimitService.increment(user);
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
                .build());

        String prompt = promptTemplateService.buildPrompt(
                request.documentType(),
                bnccSkills,
                selectedGrade,
                selectedSubject,
                request.topic().trim(),
                normalizeDuration(request.duration()),
                request.additionalInstructions()
        );
        log.info("Generating document userId={} type={} bnccCount={}", user.getId(), request.documentType(), bnccSkills.size());
        AiGeneratedDocument generated = aiService.generate(request.documentType(), prompt);

        Document document = documentRepository.save(Document.builder()
                .user(user)
                .generationRequest(generationRequest)
                .type(request.documentType())
                .title(limitTitle(generated.title()))
                .content(generated.contentJson())
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
    public byte[] exportDocx(Long id) {
        User currentUser = currentUserService.getCurrentUser();
        Document document = getAuthorizedDocument(id, currentUser);
        return documentGeneratorService.generateDocx(document);
    }

    private Document getAuthorizedDocument(Long id, User currentUser) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Documento nao encontrado"));
        if (currentUser.getRole() != Role.ADMIN && !document.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Acesso negado ao documento");
        }
        return document;
    }

    private DocumentResponse toResponse(Document document) {
        return new DocumentResponse(
                document.getId(),
                document.getUser().getId(),
                document.getType(),
                document.getTitle(),
                document.getGenerationRequest() == null ? null : document.getGenerationRequest().getGrade(),
                document.getGenerationRequest() == null ? null : document.getGenerationRequest().getSubject(),
                document.getContent(),
                document.getCreatedAt()
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
