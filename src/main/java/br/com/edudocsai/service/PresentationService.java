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
        String suggestedStructure = "";

        switch (level) {
            case INFANTIL -> {
                minSlides = 5;
                maxSlides = 7;
                suggestedStructure = """
                        - Slide 1: Capa (Título da Experiência e Imagem atraente)
                        - Slide 2: "Por que esta experiência?" (Objetivos de Aprendizagem e Desenvolvimento)
                        - Slide 3: "Como vamos fazer?" (Descrição simplificada da metodologia)
                        - Slide 4: "O que as crianças vão aprender?" (Benefícios para o desenvolvimento)
                        - Slide 5: "Materiais Necessários" (Lista visual de materiais simples)
                        - Slide 6: "Como você pode participar?" (Sugestões para pais ou educadores)
                        - Slide 7: Contato e Agradecimento""";
            }
            case FUNDAMENTAL_INICIAIS -> {
                minSlides = 7;
                maxSlides = 10;
                suggestedStructure = """
                        - Slide 1: Título da Aula e Imagem motivadora
                        - Slide 2: "O que vamos aprender hoje?" (Objetivos de Aprendizagem da BNCC e metas)
                        - Slide 3: Atividade de Aquecimento/Pergunta Geradora (com imagem)
                        - Slides 4-7: Desenvolvimento do Conteúdo (1-2 conceitos por slide, com exemplos práticos)
                        - Slide 8: Atividade Prática/Interativa (com instruções claras)
                        - Slide 9: "O que aprendemos?" (Síntese dos pontos-chave)
                        - Slide 10: Desafio/Para Casa (opcional)""";
            }
            case FUNDAMENTAL_FINAIS -> {
                minSlides = 10;
                maxSlides = 15;
                suggestedStructure = """
                        - Slide 1: Título da Aula, Nome da Disciplina e Imagem provocativa
                        - Slide 2: "O que vamos investigar?" (Objetivos de Aprendizagem da BNCC)
                        - Slide 3: Problematização Inicial/Estudo de Caso (com dados ou imagens)
                        - Slides 4-12: Desenvolvimento do Conteúdo (1-2 conceitos complexos por slide)
                        - Slide 13: "Para Refletir/Debater" (Questões abertas para discussão em grupo)
                        - Slide 14: Síntese dos Conceitos-Chave
                        - Slide 15: Sugestões de Leitura/Pesquisa""";
            }
            case ENSINO_MEDIO -> {
                minSlides = 12;
                maxSlides = 18;
                suggestedStructure = """
                        - Slide 1: Título da Aula, Área do Conhecimento e Imagem impactante
                        - Slide 2: "Questão Central" (Problematização complexa que guiará a aula)
                        - Slide 3: "Nossos Objetivos" (Competências e Habilidades da BNCC)
                        - Slides 4-15: Desenvolvimento do Conteúdo (1-2 conceitos aprofundados por slide)
                        - Slide 16: "Debate e Reflexão" (Questões abertas para discussão aprofundada)
                        - Slide 17: "Conexões com o Mundo/Projeto de Vida" (Como o tema se relaciona)
                        - Slide 18: Referências e Sugestões de Aprofundamento""";
            }
            case EJA -> {
                minSlides = 8;
                maxSlides = 12;
                suggestedStructure = """
                        - Slide 1: Título da Aula e Imagem que remeta ao cotidiano ou mundo do trabalho
                        - Slide 2: "O que já sabemos?" (Atividade de resgate de saberes prévios)
                        - Slide 3: "Por que isso é importante para nós?" (Conexão do tema com a vida)
                        - Slides 4-9: Desenvolvimento do Conteúdo (1 conceito por slide, com exemplo prático)
                        - Slide 10: "Vamos Praticar!" (Atividade prática ou discussão em grupo)
                        - Slide 11: "O que levamos para a vida?" (Síntese e aplicação do conhecimento)
                        - Slide 12: Contato e Agradecimento""";
            }
        }

        String additional = request.additionalInstructions() != null && !request.additionalInstructions().isBlank()
                ? "\nInstruções específicas complementares do professor:\n" + request.additionalInstructions()
                : "";

        String taskPrompt = """
                ## TASK: GERAR SLIDES PEDAGÓGICOS
                Gere um conjunto de slides pedagógicos estruturado em português para o nível "%s" na disciplina "%s", sobre o tema: "%s".
                %s
                
                **Instruções de Qualidade e Formatação:**
                - Número de Slides: Gere entre %d e %d slides.
                - Estrutura sugerida:
                %s
                
                - Design Visual e Estilo: Adapte a quantidade de texto (máximo 3-4 linhas/frases curtas por slide) e use termos específicos ao nível de ensino (mais lúdico para infantil/iniciais, mais acadêmico para finais/médio, andragógico e funcional para EJA).
                
                A estrutura gerada deve ser obrigatoriamente um objeto JSON contendo as propriedades abaixo:
                - "titulo": Título geral e engajador da apresentação.
                - "slides": Uma lista contendo:
                  - "slide_number": Número sequencial do slide.
                  - "layout": Escolha de forma variada e dinâmica entre os 12 layouts abaixo para tornar a apresentação visualmente rica e de altíssima qualidade:
                      * "title_slide" (Capa com imagem split, exclusivo para o slide 1)
                      * "bullet_points" (Tópicos textuais concisos)
                      * "text_and_image" (Texto explicativo acompanhado de palavra-chave para imagem)
                      * "quote" (Frase de impacto ou questionamento com autor no subtítulo)
                      * "exercise" (Desafio com pergunta nos pontos[0] e dicas/opções nos pontos[1], [2], [3])
                      * "summary" (Recapitulando pontos chaves com 4 blocos curtos nos pontos)
                      * "comparison" (Dois blocos de comparação lado a lado. Subtítulo DEVE ser "Tema A|Tema B", pontos[0] é a descrição do Tema A, pontos[1] a descrição do Tema B, pontos[2] é a conclusão/nota)
                      * "numbered_steps" (Chevrons numerados 1, 2, 3. Subtítulo é o título do passo 1, pontos[0] descrição do passo 1, pontos[1] título do passo 2, pontos[2] descrição do passo 2, pontos[3] título do passo 3, pontos[4] descrição do passo 3)
                      * "timeline" (Milestones cronológicos 1, 2, 3, 4 interligados. Subtítulo é o título do marco 1, pontos[0] descrição de 1, pontos[1] título de 2, pontos[2] descrição de 2, pontos[3] título de 3, pontos[4] descrição de 3, pontos[5] título de 4, pontos[6] descrição de 4)
                      * "split_columns" (Duas colunas com fotos e descrição abaixo. Subtítulo é o título da Coluna A, pontos[0] descrição de A, pontos[1] título da Coluna B, pontos[2] descrição de B)
                      * "grid_cards" (Grade com 3 colunas de cards. Subtítulo é o título do Card 1, pontos[0] descrição do Card 1, pontos[1] título do Card 2, pontos[2] descrição do Card 2, pontos[3] título do Card 3, pontos[4] descrição do Card 3)
                      * "highlight_quote" (Imagem à esquerda, texto introdutório no subtítulo e citação/dica em caixa de destaque nos pontos[0])
                  - "titulo": Título do slide.
                  - "subtitulo": Texto de suporte ou títulos de seção, dependendo do layout escolhido acima.
                  - "pontos": Lista (Array de strings) formatada estritamente conforme as regras do layout escolhido acima.
                  - "notas_professor": Roteiro curto com dicas pedagógicas, perguntas motivadoras e explicação para orientar o professor durante a aula (entre 30 a 60 palavras).
                  - "palavras_chave_imagem": 2 ou 3 termos descritivos em inglês para imagens do Unsplash. Para layouts que usam duas imagens (como split_columns), separe as palavras por vírgula (ex: "math classroom, geometry compass").

                Regras Cruciais:
                - Retorne APENAS um objeto JSON válido, sem qualquer texto ou markdown fora dele.
                - Respeite rigorosamente a acentuação correta em português.
                """.formatted(
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
