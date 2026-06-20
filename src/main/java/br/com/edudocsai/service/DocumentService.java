package br.com.edudocsai.service;

import br.com.edudocsai.dto.document.DocumentResponse;
import br.com.edudocsai.dto.document.GenerateDocumentRequest;
import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.GenerationRequest;
import br.com.edudocsai.entity.Role;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.ForbiddenException;
import br.com.edudocsai.exception.NotFoundException;
import br.com.edudocsai.repository.DocumentRepository;
import br.com.edudocsai.repository.GenerationRequestRepository;
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

    @Transactional
    public DocumentResponse generate(GenerateDocumentRequest request) {
        User user = currentUserService.getCurrentUser();
        usageLimitService.assertCanGenerate(user);
        List<BNCCSkill> bnccSkills = bnccService.validateAndLoad(request.bnccSkillIds());

        GenerationRequest generationRequest = generationRequestRepository.save(GenerationRequest.builder()
                .user(user)
                .documentType(request.documentType())
                .bnccSkillIds(request.bnccSkillIds())
                .topic(request.topic().trim())
                .additionalInstructions(blankToNull(request.additionalInstructions()))
                .build());

        String prompt = promptTemplateService.buildPrompt(
                request.documentType(),
                bnccSkills,
                request.topic().trim(),
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

        usageLimitService.increment(user);
        return toResponse(document);
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
}
