package br.com.edudocsai.service.lessonkit;

import br.com.edudocsai.dto.lessonkit.*;
import br.com.edudocsai.entity.*;
import br.com.edudocsai.exception.BadRequestException;
import br.com.edudocsai.exception.ForbiddenException;
import br.com.edudocsai.exception.NotFoundException;
import br.com.edudocsai.repository.*;
import br.com.edudocsai.service.CurrentUserService;
import br.com.edudocsai.service.AIService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class LessonKitService {
    private final CurrentUserService currentUserService;
    private final DocumentRepository documentRepository;
    private final LessonKitRepository kitRepository;
    private final LessonKitMaterialRepository materialRepository;
    private final LessonKitContentMapper contentMapper;
    private final AIService aiService;
    private final LessonKitPromptBuilder promptBuilder;
    private final LessonKitMaterialExportService exportService;

    @Transactional
    public LessonKitResponse createFromPlan(Long documentId) {
        User user = currentUserService.getCurrentUser();
        Optional<LessonKit> existing = kitRepository.findBySourceDocumentIdAndUserId(documentId, user.getId());
        if (existing.isPresent()) return toResponse(existing.get());

        Document plan = documentRepository.findById(documentId)
                .orElseThrow(() -> new NotFoundException("Plano de aula nao encontrado"));
        authorize(plan, user);
        if (plan.getType() != DocumentType.LESSON_PLAN) {
            throw new BadRequestException("Somente planos de aula podem originar um kit");
        }

        Map<LessonKitMaterialType, String> extracted = contentMapper.extract(plan.getContent());
        boolean hadEmbeddedKit = extracted.size() == 5;
        if (extracted.size() < 5) {
            String generated = aiService.generateJsonObject(promptBuilder.completeKit(plan));
            extracted = contentMapper.extract(generated);
            if (extracted.size() < 5) {
                throw new BadRequestException("A IA nao retornou todos os materiais do kit");
            }
        }
        LessonKitStatus status = LessonKitStatus.READY;
        LessonKit kit = kitRepository.save(LessonKit.builder()
                .user(user).sourceDocument(plan).title(buildTitle(plan)).status(status).build());
        saveMaterial(kit, LessonKitMaterialType.LESSON_PLAN, plan.getContent(), LessonKitMaterialStatus.READY);
        for (LessonKitMaterialType type : derivedTypes()) {
            String content = extracted.get(type);
            saveMaterial(kit, type, content == null ? "{}" : content,
                    content == null ? LessonKitMaterialStatus.QUEUED : LessonKitMaterialStatus.READY);
        }
        if (hadEmbeddedKit) {
            plan.setContent(contentMapper.withoutEmbeddedKit(plan.getContent()));
            documentRepository.save(plan);
        }
        return toResponse(kit);
    }

    @Transactional(readOnly = true)
    public LessonKitResponse get(Long id) {
        return toResponse(getAuthorized(id));
    }

    @Transactional(readOnly = true)
    public byte[] exportDocx(Long kitId, LessonKitMaterialType type) {
        LessonKit kit = getAuthorized(kitId);
        LessonKitMaterial material = materialRepository.findByKitIdAndType(kitId, type)
                .orElseThrow(() -> new NotFoundException("Material do kit nao encontrado"));
        if (material.getStatus() != LessonKitMaterialStatus.READY) {
            throw new BadRequestException("O material precisa estar pronto antes da exportacao");
        }
        return exportService.export(kit.getTitle(), type, material.getContent());
    }

    @Transactional(readOnly = true)
    public byte[] exportPdf(Long kitId, LessonKitMaterialType type) {
        LessonKit kit = getAuthorized(kitId);
        LessonKitMaterial material = materialRepository.findByKitIdAndType(kitId, type)
                .orElseThrow(() -> new NotFoundException("Material do kit nao encontrado"));
        if (material.getStatus() != LessonKitMaterialStatus.READY) {
            throw new BadRequestException("O material precisa estar pronto antes da exportacao");
        }
        return exportService.exportPdf(kit.getTitle(), type, material.getContent());
    }

    @Transactional
    public LessonKitMaterialResponse update(Long kitId, LessonKitMaterialType type,
                                            UpdateLessonKitMaterialRequest request) {
        LessonKit kit = getAuthorized(kitId);
        LessonKitMaterial material = materialRepository.findByKitIdAndType(kit.getId(), type)
                .orElseThrow(() -> new NotFoundException("Material do kit nao encontrado"));
        if (!Objects.equals(material.getVersion(), request.version())) {
            throw new br.com.edudocsai.exception.ConflictException("Material foi alterado; recarregue antes de salvar");
        }
        material.setContent(request.content());
        material.setStatus(LessonKitMaterialStatus.READY);
        material.setGenerationError(null);
        return toMaterialResponse(materialRepository.save(material));
    }

    @Transactional
    public LessonKitMaterialResponse regenerate(Long kitId, LessonKitMaterialType type) {
        return regenerate(kitId, type, RegenerateLessonKitMaterialRequest.recommended());
    }

    @Transactional
    public LessonKitMaterialResponse regenerate(Long kitId, LessonKitMaterialType type,
                                                RegenerateLessonKitMaterialRequest request) {
        if (type == LessonKitMaterialType.LESSON_PLAN) {
            throw new BadRequestException("O plano deve ser editado na pagina original");
        }
        LessonKit kit = getAuthorized(kitId);
        LessonKitMaterial material = materialRepository.findByKitIdAndType(kitId, type)
                .orElseThrow(() -> new NotFoundException("Material do kit nao encontrado"));
        String generated = aiService.generateJsonObject(
                promptBuilder.singleMaterial(kit.getSourceDocument(), type, request));
        String refreshed = contentMapper.extract(generated).get(type);
        if (refreshed == null) {
            throw new BadRequestException("O plano de origem nao possui conteudo valido para este material");
        }
        material.setContent(refreshed);
        material.setStatus(LessonKitMaterialStatus.READY);
        material.setGenerationError(null);
        return toMaterialResponse(materialRepository.save(material));
    }

    private LessonKit getAuthorized(Long id) {
        User user = currentUserService.getCurrentUser();
        LessonKit kit = kitRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Kit de aula nao encontrado"));
        if (user.getRole() != Role.ADMIN && !kit.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Acesso negado ao kit de aula");
        }
        return kit;
    }

    private void authorize(Document plan, User user) {
        if (user.getRole() != Role.ADMIN && !plan.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Acesso negado ao plano de aula");
        }
    }

    private void saveMaterial(LessonKit kit, LessonKitMaterialType type, String content,
                              LessonKitMaterialStatus status) {
        materialRepository.save(LessonKitMaterial.builder().kit(kit).type(type)
                .content(content).status(status).build());
    }

    private List<LessonKitMaterialType> derivedTypes() {
        return List.of(LessonKitMaterialType.STUDENT_ACTIVITY, LessonKitMaterialType.TEACHER_ANSWER_KEY,
                LessonKitMaterialType.ASSESSMENT, LessonKitMaterialType.PEDAGOGICAL_EVIDENCE,
                LessonKitMaterialType.INCLUSIVE_ADAPTATIONS);
    }

    private LessonKitResponse toResponse(LessonKit kit) {
        Document plan = kit.getSourceDocument();
        List<LessonKitMaterialResponse> materialResponses = materialRepository
                .findByKitIdOrderByType(kit.getId()).stream().map(this::toMaterialResponse).toList();
        String grade = plan.getGenerationRequest() == null ? null : plan.getGenerationRequest().getGrade();
        String subject = plan.getGenerationRequest() == null ? null : plan.getGenerationRequest().getSubject();
        return new LessonKitResponse(kit.getId(), plan.getId(), kit.getTitle(), kit.getStatus(), grade,
                subject, topic(plan.getContent(), plan.getTitle()), materialResponses,
                kit.getCreatedAt(), kit.getUpdatedAt());
    }

    private LessonKitMaterialResponse toMaterialResponse(LessonKitMaterial material) {
        return new LessonKitMaterialResponse(material.getId(), material.getType(), material.getStatus(),
                material.getContent(), material.getGenerationError(), material.getVersion());
    }

    private String buildTitle(Document plan) {
        String grade = plan.getGenerationRequest() == null ? null : plan.getGenerationRequest().getGrade();
        String subject = plan.getGenerationRequest() == null ? null : plan.getGenerationRequest().getSubject();
        String suffix = String.join(" — ", java.util.stream.Stream.of(grade, subject)
                .filter(value -> value != null && !value.isBlank()).toList());
        return suffix.isBlank() ? "Kit de Aula — " + plan.getTitle() : "Kit de Aula Semanal — " + suffix;
    }

    private String topic(String content, String fallback) {
        try {
            JsonNode root = new ObjectMapper().readTree(content);
            String value = root.path("tema").asText("");
            return value.isBlank() ? fallback : value;
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private String completeKitPrompt(Document plan) {
        return """
                Gere somente os materiais complementares para o plano de aula abaixo.
                Responda com JSON puro no formato exato:
                {"kitAulaCompleta":{"atividadeAluno":{"titulo":"","contexto":"","orientacoes":[],"questoes":[],"produtoEsperado":""},"gabaritoProfessor":{"respostasEsperadas":[],"orientacoesProfessor":[]},"instrumentoAvaliativo":{"criterios":[],"coletaEvidencias":[]},"evidenciasPedagogicas":{"evidenciasObservaveis":[],"registrosParaCoordenacao":[]},"adaptacoesInclusivas":{"apoioLeitura":[],"apoioParticipacao":[],"alternativasSimplificadas":[]}}}
                Todo conteúdo deve estar alinhado ao tema, ano, disciplina e BNCC do plano. Não use markdown.
                PLANO:
                """ + plan.getContent();
    }

    private String singleMaterialPrompt(Document plan, LessonKitMaterialType type) {
        String key = switch (type) {
            case STUDENT_ACTIVITY -> "atividadeAluno";
            case TEACHER_ANSWER_KEY -> "gabaritoProfessor";
            case ASSESSMENT -> "instrumentoAvaliativo";
            case PEDAGOGICAL_EVIDENCE -> "evidenciasPedagogicas";
            case INCLUSIVE_ADAPTATIONS -> "adaptacoesInclusivas";
            case LESSON_PLAN -> throw new BadRequestException("Tipo de material invalido");
        };
        return "Regere somente " + key + " para o plano abaixo. Responda com JSON puro no formato "
                + "{\"kitAulaCompleta\":{\"" + key + "\":{...}}}. Preserve alinhamento ao tema e BNCC. PLANO: "
                + plan.getContent();
    }
}
