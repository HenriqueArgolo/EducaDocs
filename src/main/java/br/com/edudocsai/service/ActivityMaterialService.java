package br.com.edudocsai.service;

import br.com.edudocsai.dto.activity.ActivityMaterialResponse;
import br.com.edudocsai.dto.activity.CreateActivityRequest;
import br.com.edudocsai.dto.activity.GenerateActivityRequest;
import br.com.edudocsai.entity.ActivityMaterial;
import br.com.edudocsai.entity.ActivityType;
import br.com.edudocsai.entity.Role;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.ForbiddenException;
import br.com.edudocsai.exception.NotFoundException;
import br.com.edudocsai.repository.ActivityMaterialRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityMaterialService {

    private final ActivityMaterialRepository activityMaterialRepository;
    private final CurrentUserService currentUserService;
    private final UsageLimitService usageLimitService;
    private final AIService aiService;
    private final ActivityImageEnricher activityImageEnricher;
    private final ObjectMapper objectMapper;
    private final PromptModuleCatalog promptModuleCatalog;

    @Transactional(readOnly = true)
    public Page<ActivityMaterialResponse> getMaterials(
            ActivityType type,
            String grade,
            String subject,
            String search,
            Pageable pageable
    ) {
        User currentUser = currentUserService.getCurrentUser();
        return activityMaterialRepository.searchMaterials(
                currentUser.getId(),
                type,
                grade,
                subject,
                search,
                pageable
        ).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ActivityMaterialResponse getById(Long id) {
        ActivityMaterial material = activityMaterialRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Material didatico nao encontrado"));

        User currentUser = currentUserService.getCurrentUser();
        if (!material.isPublic() && currentUser.getRole() != Role.ADMIN && 
            (material.getUser() == null || !material.getUser().getId().equals(currentUser.getId()))) {
            throw new ForbiddenException("Voce nao tem permissao para acessar este material");
        }

        return toResponse(material);
    }

    @Transactional
    public ActivityMaterialResponse create(CreateActivityRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        ActivityMaterial material = activityMaterialRepository.save(ActivityMaterial.builder()
                .title(request.title())
                .description(request.description())
                .type(request.type())
                .grade(request.grade())
                .subject(request.subject())
                .content(request.content())
                .thumbnailUrl(request.thumbnailUrl())
                .isPublic(request.isPublic())
                .user(currentUser)
                .build());
        return toResponse(material);
    }

    @Transactional
    public ActivityMaterialResponse generate(GenerateActivityRequest request) {
        User user = currentUserService.getCurrentUser();
        usageLimitService.assertCanGenerate(user);

        log.info("Generating activity material type={} topic={} userId={}", request.type(), request.topic(), user.getId());

        String prompt = buildGenerationPrompt(request);
        String jsonResult = aiService.generateJsonObject(prompt);
        if (isInitialLiteracyWorksheet(request)) {
            jsonResult = new EarlyLiteracyWorksheetNormalizer(objectMapper)
                    .normalize(jsonResult, request.topic(), 4);
        }
        jsonResult = activityImageEnricher.enrich(jsonResult, request.grade(), request.topic());

        String title = "Atividade de " + request.subject();
        String description = "Material educativo sobre " + request.topic();

        try {
            JsonNode root = objectMapper.readTree(jsonResult);
            if (root.has("titulo") && !root.get("titulo").asText().isBlank()) {
                title = root.get("titulo").asText();
            }
            if (root.has("descricao") && !root.get("descricao").asText().isBlank()) {
                description = root.get("descricao").asText();
            }
        } catch (Exception e) {
            log.warn("Failed to parse generated activity JSON for extracting title and description. error={}", e.getMessage());
        }

        ActivityMaterial material = activityMaterialRepository.save(ActivityMaterial.builder()
                .title(limitTitle(title))
                .description(description)
                .type(request.type())
                .grade(request.grade())
                .subject(request.subject())
                .content(jsonResult)
                .isPublic(false) // Generated items are private to the user
                .user(user)
                .build());

        usageLimitService.increment(user);

        return toResponse(material);
    }

    @Transactional
    public void delete(Long id) {
        ActivityMaterial material = activityMaterialRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Material didatico nao encontrado"));

        User currentUser = currentUserService.getCurrentUser();
        if (currentUser.getRole() != Role.ADMIN && 
            (material.getUser() == null || !material.getUser().getId().equals(currentUser.getId()))) {
            throw new ForbiddenException("Voce nao tem permissao para excluir este material");
        }

        activityMaterialRepository.delete(material);
    }

    private String buildGenerationPrompt(GenerateActivityRequest request) {
        StringBuilder formatRule = new StringBuilder();
        boolean isEarlyGrade = EarlyLiteracySupport.isInitialLiteracyGrade(request.grade());
        boolean isInitialLiteracyWorksheet = isEarlyGrade && request.type() == ActivityType.WORKSHEET;

        if (isEarlyGrade) {
            formatRule.append(promptModuleCatalog.getPromptByKey("activity_generation_early_grade_rule"));
        }

        if (isInitialLiteracyWorksheet) {
            String template = promptModuleCatalog.getPromptByKey("activity_generation_literacy_worksheet_rule");
            formatRule.append(template.formatted(
                    EarlyLiteracySupport.allowedFiguresForPrompt(),
                    EarlyLiteracySupport.allowedActivityTypesForPrompt(),
                    EarlyLiteracySupport.wordBankForPrompt(request.topic())
            ));
        } else if (request.type() == ActivityType.WORKSHEET && request.questionFormat() != null) {
            switch (request.questionFormat().toUpperCase()) {
                case "MARCAR":
                    formatRule.append(promptModuleCatalog.getPromptByKey("activity_generation_marcar_rule"));
                    break;
                case "ESCREVER":
                    formatRule.append(promptModuleCatalog.getPromptByKey("activity_generation_escrever_rule"));
                    break;
                case "MISTA":
                    formatRule.append(promptModuleCatalog.getPromptByKey("activity_generation_mista_rule"));
                    break;
            }
        }

        String additional = request.additionalInstructions() != null && !request.additionalInstructions().isBlank()
                ? "Instrucoes especificas complementares do professor:\n" + request.additionalInstructions()
                : "";

        String baseTemplate = promptModuleCatalog.getPromptByKey("activity_generation_base_prompt");
        return baseTemplate.formatted(
                request.grade(),
                request.subject(),
                request.topic(),
                request.type(),
                formatRule.toString(),
                additional
        );
    }

    private boolean isInitialLiteracyWorksheet(GenerateActivityRequest request) {
        return request.type() == ActivityType.WORKSHEET
                && EarlyLiteracySupport.isInitialLiteracyGrade(request.grade());
    }

    private ActivityMaterialResponse toResponse(ActivityMaterial material) {
        return new ActivityMaterialResponse(
                material.getId(),
                material.getTitle(),
                material.getDescription(),
                material.getType(),
                material.getGrade(),
                material.getSubject(),
                material.getContent(),
                material.getThumbnailUrl(),
                material.isPublic(),
                material.getUser() == null ? null : material.getUser().getId(),
                material.getCreatedAt()
        );
    }

    private String limitTitle(String title) {
        if (title == null || title.isBlank()) {
            return "Atividade Pedagogica";
        }
        String trimmed = title.trim();
        return trimmed.length() > 180 ? trimmed.substring(0, 180) : trimmed;
    }

    @Transactional(readOnly = true)
    public byte[] getPdfFile(Long id) {
        return activityMaterialRepository.findPdfFileById(id)
                .orElseThrow(() -> new br.com.edudocsai.exception.NotFoundException("Arquivo PDF nao encontrado"));
    }

    @Transactional
    public int importLocalMaterials() {
        java.io.File dir = new java.io.File("C:\\Users\\joaoh\\Downloads\\2000.Desenhos.para.colorir.1000.Atividades.para.criancas");
        if (!dir.exists() || !dir.isDirectory()) {
            throw new br.com.edudocsai.exception.BadRequestException("Diretorio de downloads nao encontrado: " + dir.getAbsolutePath());
        }
        
        int count = 0;
        try {
            java.util.List<java.io.File> pdfFiles = new java.util.ArrayList<>();
            collectPdfFiles(dir, pdfFiles);
            
            for (java.io.File file : pdfFiles) {
                String relativePath = file.getAbsolutePath().substring(dir.getAbsolutePath().length() + 1).replace('\\', '/');
                String originalTitle = file.getName();
                if (originalTitle.endsWith(".pdf")) {
                    originalTitle = originalTitle.substring(0, originalTitle.length() - 4);
                }
                
                String title = cleanTitle(originalTitle);
                
                ActivityType type = ActivityType.WORKSHEET;
                String pathLower = relativePath.toLowerCase();
                if (pathLower.contains("colorir") || pathLower.contains("desenho")) {
                    type = ActivityType.COLORING_BOOK;
                } else if (pathLower.contains("jogo") || pathLower.contains("jogos") || pathLower.contains("labirinto")) {
                    type = ActivityType.GAME;
                } else if (pathLower.contains("flashcard") || pathLower.contains("fichas de estudo")) {
                    type = ActivityType.FLASHCARD;
                }
                
                String grade = "Educação Infantil";
                if (pathLower.contains("maternal")) {
                    grade = "Maternal";
                } else if (pathLower.contains("1º ano") || pathLower.contains("1 ano") || pathLower.contains("1o ano")) {
                    grade = "1º Ano";
                } else if (pathLower.contains("2º ano") || pathLower.contains("2 ano") || pathLower.contains("2o ano")) {
                    grade = "2º Ano";
                } else if (pathLower.contains("3º ano") || pathLower.contains("3 ano") || pathLower.contains("3o ano")) {
                    grade = "3º Ano";
                } else if (pathLower.contains("4º ano") || pathLower.contains("4 ano") || pathLower.contains("4o ano")) {
                    grade = "4º Ano";
                } else if (pathLower.contains("5º ano") || pathLower.contains("5 ano") || pathLower.contains("5o ano")) {
                    grade = "5º Ano";
                } else if (pathLower.contains("fundamental")) {
                    grade = "Ensino Fundamental";
                }
                
                String subject = "Português";
                if (pathLower.contains("matemática") || pathLower.contains("numeras") || pathLower.contains("números") || pathLower.contains("numerais") || pathLower.contains("contar") || pathLower.contains("raciocínio") || pathLower.contains("somas") || pathLower.contains("frações")) {
                    subject = "Matemática";
                } else if (pathLower.contains("português") || pathLower.contains("alfabetização") || pathLower.contains("sílabas") || pathLower.contains("leitura") || pathLower.contains("letras") || pathLower.contains("caligrafia") || pathLower.contains("bastão") || pathLower.contains("cursiva") || pathLower.contains("caça palavras") || pathLower.contains("traçar")) {
                    subject = "Português";
                } else if (pathLower.contains("artes") || pathLower.contains("desenhos") || pathLower.contains("colorir") || pathLower.contains("sem tela") || pathLower.contains("recortar")) {
                    subject = "Artes";
                } else if (pathLower.contains("inglês") || pathLower.contains("english")) {
                    subject = "Inglês";
                } else if (pathLower.contains("bíblicas") || pathLower.contains("bíblica")) {
                    subject = "Ensino Religioso";
                } else if (pathLower.contains("canções") || pathLower.contains("música")) {
                    subject = "Música";
                } else if (pathLower.contains("ciências")) {
                    subject = "Ciências";
                } else if (pathLower.contains("história")) {
                    subject = "História";
                } else if (pathLower.contains("geografia")) {
                    subject = "Geografia";
                } else {
                    if (relativePath.contains("ALFABETIZAÇÃO") || relativePath.contains("PORTUGUÊS") || relativePath.contains("SÍLABAS") || relativePath.contains("CALIGRAFIA")) {
                        subject = "Português";
                    } else if (relativePath.contains("MATEMÁTICA") || relativePath.contains("NUMERAIS")) {
                        subject = "Matemática";
                    } else if (relativePath.contains("ARTES") || relativePath.contains("DESENHOS PARA COLORIR") || relativePath.contains("ATIVIDADES SEM TELA") || relativePath.contains("COGNITIVAS")) {
                        subject = "Artes";
                    } else if (relativePath.contains("INGLÊS")) {
                        subject = "Inglês";
                    } else if (relativePath.contains("ATIVIDADES BÍBLICAS")) {
                        subject = "Ensino Religioso";
                    } else if (relativePath.contains("CANÇÕES INFANTIS")) {
                        subject = "Música";
                    } else if (relativePath.contains("CIÊNCIAS")) {
                        subject = "Ciências";
                    } else {
                        subject = (type == ActivityType.COLORING_BOOK) ? "Artes" : "Português";
                    }
                }
                
                byte[] bytes = java.nio.file.Files.readAllBytes(file.toPath());
                
                String description = "Recurso didático digital em PDF contendo atividades de " + subject + " para a série " + grade + ". Arquivo importado da biblioteca local.";
                
                ActivityMaterial material = ActivityMaterial.builder()
                        .title(limitTitle(title))
                        .description(description)
                        .type(type)
                        .grade(grade)
                        .subject(subject)
                        .content("")
                        .pdfFile(bytes)
                        .isPublic(true)
                        .build();
                        
                material = activityMaterialRepository.save(material);
                
                String contentJson = "{\"isPdf\":true,\"pdfUrl\":\"/activities/" + material.getId() + "/pdf\"}";
                material.setContent(contentJson);
                activityMaterialRepository.save(material);
                
                count++;
            }
        } catch (java.io.IOException e) {
            throw new RuntimeException("Erro ao ler arquivos PDF", e);
        }
        return count;
    }
    
    private void collectPdfFiles(java.io.File dir, java.util.List<java.io.File> list) {
        java.io.File[] files = dir.listFiles();
        if (files != null) {
            for (java.io.File f : files) {
                if (f.isDirectory()) {
                    collectPdfFiles(f, list);
                } else if (f.isFile() && f.getName().toLowerCase().endsWith(".pdf")) {
                    list.add(f);
                }
            }
        }
    }
    
    private String cleanTitle(String original) {
        String cleaned = original.replace("_compressed", "");
        cleaned = cleaned.replace("- 10 Páginas", "").replace("- 10 Pginas", "");
        cleaned = cleaned.replace(" - 10 Páginas", "").replace(" - 10 Pginas", "");
        cleaned = cleaned.replace(" - 100 Páginas", "").replace(" - 100 Pginas", "");
        cleaned = cleaned.replace(" - 12 Páginas", "").replace(" - 12 Pginas", "");
        cleaned = cleaned.replace(" - 14 Páginas", "").replace(" - 14 Pginas", "");
        cleaned = cleaned.replace(" - 20 Páginas", "").replace(" - 20 Pginas", "");
        cleaned = cleaned.replace(" - 26 Páginas", "").replace(" - 26 Pginas", "");
        cleaned = cleaned.replace(" - 78 Páginas", "").replace(" - 78 Pginas", "");
        cleaned = cleaned.replace(" - 30 Páginas", "").replace(" - 30 Pginas", "");
        cleaned = cleaned.replace(" - 231 Páginas", "").replace(" - 231 Pginas", "");
        cleaned = cleaned.replace(" - 52 Páginas", "").replace(" - 52 Pginas", "");
        cleaned = cleaned.replace("Pginas", "Páginas");
        cleaned = cleaned.replace("Pedaggicas", "Pedagógicas").replace("Pedagogicas", "Pedagógicas");
        cleaned = cleaned.replace("Bnus", "Bônus").replace("Bonus", "Bônus");
        cleaned = cleaned.replace("Nmeros", "Números").replace("Nmeros", "Números");
        cleaned = cleaned.replace("Truma", "Turma");
        cleaned = cleaned.replace("Formao", "Formação").replace("Formacao", "Formação");
        cleaned = cleaned.replace("Basto", "Bastão").replace("Bastao", "Bastão");
        cleaned = cleaned.replace("Raciocnio", "Raciocínio").replace("Raciocinio", "Raciocínio");
        cleaned = cleaned.replace("Traar", "Traçar").replace("Tracar", "Traçar");
        cleaned = cleaned.replace("Bblicas", "Bíblicas").replace("Bblica", "Bíblica").replace("Biblicas", "Bíblicas");
        cleaned = cleaned.replace("Caa", "Caça").replace("Caca", "Caça");
        cleaned = cleaned.replace("Pssaros", "Pássaros").replace("Passaros", "Pássaros");
        cleaned = cleaned.replace("Pneis", "Pôneis").replace("Poneis", "Pôneis");
        cleaned = cleaned.replace("Unicrnios", "Unicórnios").replace("Unicornios", "Unicórnios");
        cleaned = cleaned.replace("Veculos", "Veículos").replace("Veiculos", "Veículos");
        return cleaned.replace("  ", " ").strip();
    }
}
