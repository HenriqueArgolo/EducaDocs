package br.com.edudocsai.service;

import br.com.edudocsai.dto.presentation.CreatePresentationRequest;
import br.com.edudocsai.dto.presentation.GeneratePresentationRequest;
import br.com.edudocsai.dto.presentation.PresentationResponse;
import br.com.edudocsai.dto.presentation.RefinePresentationRequest;
import br.com.edudocsai.dto.presentation.GenerateOutlineRequest;
import br.com.edudocsai.dto.presentation.OutlineResponse;
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

    @Transactional
    public PresentationResponse update(Long id, CreatePresentationRequest request) {
        Presentation presentation = presentationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Apresentação não encontrada"));

        User currentUser = currentUserService.getCurrentUser();
        if (!presentation.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Você não tem permissão para atualizar esta apresentação");
        }

        presentation.setTitle(limitTitle(request.title()));
        presentation.setTopic(request.topic());
        presentation.setGrade(request.grade());
        presentation.setSubject(request.subject());
        presentation.setSlidesJson(request.slidesJson());

        Presentation saved = presentationRepository.save(presentation);
        return toResponse(saved);
    }

    @Transactional
    public PresentationResponse refine(Long id, RefinePresentationRequest request) {
        Presentation presentation = presentationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Apresentação não encontrada"));

        User currentUser = currentUserService.getCurrentUser();
        if (!presentation.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Você não tem permissão para refinar esta apresentação");
        }

        log.info("Refining presentation id={} with instruction='{}' user={}", id, request.instruction(), currentUser.getId());

        String prompt = buildRefinementPrompt(presentation, request);
        String jsonResult = aiService.generateJsonObject(prompt);

        String title = presentation.getTitle();
        try {
            JsonNode root = objectMapper.readTree(jsonResult);
            if (root.has("titulo") && !root.get("titulo").asText().isBlank()) {
                title = root.get("titulo").asText();
            }
        } catch (Exception e) {
            log.warn("Failed to parse presentation JSON for title extraction in refinement. error={}", e.getMessage());
        }

        presentation.setTitle(limitTitle(title));
        presentation.setSlidesJson(jsonResult);
        Presentation saved = presentationRepository.save(presentation);

        return toResponse(saved);
    }

    @Transactional
    public OutlineResponse generateOutline(GenerateOutlineRequest request) {
        log.info("Generating presentation outline for topic='{}'", request.topic());
        String basePrompt = promptBuilderHelper.getBasePrompt();
        String promptTemplate = """
                ## TASK: GERAR ROTEIRO DE SLIDES PEDAGÓGICOS
                Você é um especialista em design instrucional e pedagogia.
                Crie um roteiro sequencial sugerido (esboço/outline) para uma apresentação de slides baseada no assunto solicitado.
                
                Especificações:
                - Tema Central: %s
                - Série/Ano de Ensino: %s
                - Disciplina: %s
                - Quantidade de slides: %d
                - Instruções Pedagógicas Extras: %s
                
                Instruções de Qualidade:
                - Crie exatamente %d tópicos de slides, que representem a progressão pedagógica da aula (desde a introdução, conceitos chave, desafios/prática, recapitulando e encerramento).
                - Escreva em Português do Brasil com linguagem adequada à faixa etária dos alunos.
                - Os tópicos devem ser claros, concisos e focados em ensino ativo.
                
                Retorne OBRIGATORIAMENTE apenas um objeto JSON contendo o campo "outline" mapeado para uma lista (array de strings) contendo os títulos propostos para cada um dos slides.
                Exemplo:
                {
                  "outline": [
                    "Slide 1: Introdução ao Tema",
                    "Slide 2: Conceito A",
                    "Slide 3: Conceito B",
                    "Slide 4: Desafio Prático",
                    "Slide 5: Resumo e Fechamento"
                  ]
                }
                
                Não adicione markdown (```json), comentários ou qualquer texto fora do JSON. Retorne apenas o JSON puro.
                """;

        String prompt = promptTemplate.formatted(
                request.topic(),
                request.grade(),
                request.subject(),
                request.numberOfSlides(),
                request.additionalInstructions() != null ? request.additionalInstructions() : "",
                request.numberOfSlides()
        );

        String jsonResult = aiService.generateJsonObject(String.join("\n\n", basePrompt, prompt));

        try {
            JsonNode root = objectMapper.readTree(jsonResult);
            JsonNode outlineNode = root.path("outline");
            List<String> list = new java.util.ArrayList<>();
            if (outlineNode.isArray()) {
                for (JsonNode node : outlineNode) {
                    list.add(node.asText());
                }
            }
            return new OutlineResponse(list);
        } catch (Exception e) {
            log.error("Failed to parse outline JSON. raw={}", jsonResult, e);
            throw new RuntimeException("Falha ao analisar a resposta do roteiro gerado pela IA.");
        }
    }

    private String buildRefinementPrompt(Presentation presentation, RefinePresentationRequest request) {
        String basePrompt = promptBuilderHelper.getBasePrompt();
        
        String activeSlideContext = "";
        if (request.slideIndex() != null) {
            activeSlideContext = "\n- O professor está focando no slide ativo com índice (0-based): " + request.slideIndex() + 
                                 " (Slide número " + (request.slideIndex() + 1) + "). Portanto, se a alteração for específica, aplique-a principalmente sobre este slide ou insira o novo conteúdo logo após ele.";
        }

        String refinementTemplate = """
                ## TASK: REFINAR / EDITAR APRESENTAÇÃO DE SLIDES PEDAGÓGICOS
                Você é um designer instrucional e assistente pedagógico de alto nível.
                Sua tarefa é modificar a apresentação de slides existente com base na instrução do professor.
                
                **Contexto do Curso:**
                - Tema Central: %s
                - Série/Nível de Ensino: %s
                - Disciplina: %s
                
                **Instrução de Alteração do Professor:**
                "%s"
                %s
                
                **JSON Atual da Apresentação de Slides:**
                %s
                
                ---
                **Regras de Edição e Formatação:**
                1. Analise o JSON atual e execute as alterações solicitadas pelo professor.
                2. Você pode:
                   - Modificar o conteúdo (titulo, subtitulo, pontos, notas_professor) de um ou mais slides.
                   - Adicionar novos slides caso a instrução solicite novos tópicos ou slides adicionais. Cada novo slide DEVE escolher de forma variada entre os 12 layouts disponíveis:
                     * "title_slide" (Capa com imagem split, exclusivo para o slide 1)
                     * "bullet_points" (Tópicos textuais concisos)
                     * "text_and_image" (Texto explicativo acompanhado de palavra-chave para imagem)
                     * "quote" (Frase de impacto ou questionamento)
                     * "exercise" (Desafio prático / pergunta)
                     * "summary" (Recapitulando pontos chaves com 4 blocos)
                     * "comparison" (Dois blocos de comparação lado a lado. Subtítulo DEVE ser "Tema A|Tema B", pontos[0] é a descrição do Tema A, pontos[1] a descrição do Tema B, pontos[2] é a conclusão)
                     * "numbered_steps" (Passos numerados. Subtítulo é o título do passo 1, pontos[0] desc de 1, pontos[1] título de 2, pontos[2] desc de 2, etc.)
                     * "timeline" (Linha do tempo. Subtítulo é o título do marco 1, pontos[0] desc de 1, pontos[1] título de 2, pontos[2] desc de 2, etc.)
                     * "split_columns" (Colunas com fotos. Subtítulo é o título da Coluna A, pontos[0] desc de A, pontos[1] título de B, pontos[2] desc de B)
                     * "grid_cards" (Grade de cards. Subtítulo é o título do Card 1, pontos[0] desc de 1, pontos[1] título de 2, pontos[2] desc de 2, etc.)
                     * "highlight_quote" (Imagem e citação de destaque nos pontos[0])
                   - Deletar um slide caso solicitado de forma explícita.
                   - Traduzir os textos se solicitado.
                   - Reordenar a sequência de slides.
                3. O campo "palavras_chave_imagem" deve conter palavras-chave em inglês curtas e relevantes para que o sistema busque fotos no Unsplash.
                4. O campo "notas_professor" deve conter um roteiro curto orientando a fala do professor (30-60 palavras).
                5. Certifique-se de que a quantidade de texto nos slides seja concisa (máx. 3-4 linhas curtas).
                6. Após qualquer adição, deleção ou reordenação, você DEVE recalcular os números dos slides ("slide_number") para que fiquem sequenciais de 1 até N.
                7. Retorne OBRIGATORIAMENTE apenas o objeto JSON atualizado contendo as chaves:
                   {
                     "titulo": "Título da apresentação",
                     "slides": [
                        {
                          "slide_number": 1,
                          "layout": "bullet_points",
                          "titulo": "Título do slide",
                          "subtitulo": "Subtítulo do slide (opcional)",
                          "pontos": ["Ponto 1", "Ponto 2"],
                          "notas_professor": "Notas...",
                          "palavras_chave_imagem": "keywords"
                        }
                     ]
                   }
                
                Não adicione comentários, explicações nem blocos ```json no retorno. Retorne apenas o objeto JSON puro estruturado.
                """;

        return refinementTemplate.formatted(
                presentation.getTopic(),
                presentation.getGrade(),
                presentation.getSubject(),
                request.instruction(),
                activeSlideContext,
                presentation.getSlidesJson()
        );
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
