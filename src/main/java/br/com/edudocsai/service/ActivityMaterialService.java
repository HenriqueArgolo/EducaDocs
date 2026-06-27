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
            formatRule.append("\nATENÇÃO ESPECIAL (Pedagogia para Alfabetização/Educação Infantil):\n" +
                    "- Como os alunos estão na fase de alfabetização ou pré-escola, evite questões complexas com textos longos ou dependência de leitura fluente.\n" +
                    "- Para Fichas de Atividades (WORKSHEET), priorize comandos simples, sonoros e motores (ex: 'Cubra o pontilhado', 'Identifique a letra inicial', 'Ligue a figura ao som', 'Pinte o desenho').\n" +
                    "- Use palavras curtas e simples (ex: animais, objetos do dia a dia) para as atividades.\n");
        }

        if (isInitialLiteracyWorksheet) {
            formatRule.append("""

                    CONTRATO OBRIGATÓRIO PARA WORKSHEET DE ALFABETIZAÇÃO INICIAL:
                    - Ignore MARCAR/ESCREVER/MISTA como formato textual tradicional; eles devem virar ações visuais simples.
                    - Gere uma folha parecida com atividades reais de 1º ano: figuras, palavras em CAIXA ALTA, sílabas, letras, caixas para completar, ligar/circular/pintar.
                    - Cada comando deve ter no máximo 8 palavras.
                    - Não use textos longos, interpretação textual, ordem alfabética sem apoio visual, pergunta discursiva, resposta por extenso ou 4 alternativas complexas.
                    - Use somente estas figuras permitidas: %s.
                    - Use somente estes tipos: %s.
                    - Use preferencialmente as palavras do banco temático abaixo. Se o tema for específico, escolha as palavras mais próximas do assunto.
                    - O gabarito deve existir apenas para o professor; o renderer de aluno não deve depender dele.

                    Banco tematico de palavras:
                    %s

                    Schema obrigatório para este WORKSHEET:
                    {
                      "titulo": "Título curto da ficha",
                      "layout": "ALFABETIZACAO_VISUAL_V2",
                      "descricao": "Orientação breve para o professor",
                      "instrucoes_alunos": "Professor(a), leia os comandos em voz alta.",
                      "schemaVersion": 2,
                      "exercicios": [
                        {
                          "numero": 1,
                          "tipo": "SEPARAR_SILABAS",
                          "comando": "Separe as sílabas.",
                          "itens": [
                            {"palavra": "BOLO", "figura": "bolo", "caixasResposta": 2}
                          ],
                          "gabarito": "BO-LO"
                        },
                        {
                          "numero": 2,
                          "tipo": "LETRA_INICIAL",
                          "comando": "Pinte a letra inicial.",
                          "itens": [
                            {"palavra": "SAPO", "figura": "sapo", "opcoes": ["S", "P", "O"], "resposta": "S"}
                          ],
                          "gabarito": "S"
                        }
                      ]
                    }
                    O contrato ALFABETIZACAO_VISUAL_V2 acima prevalece sobre qualquer exemplo genérico de WORKSHEET abaixo.
                    """.formatted(
                    EarlyLiteracySupport.allowedFiguresForPrompt(),
                    EarlyLiteracySupport.allowedActivityTypesForPrompt(),
                    EarlyLiteracySupport.wordBankForPrompt(request.topic())
            ));
        } else if (request.type() == ActivityType.WORKSHEET && request.questionFormat() != null) {
            switch (request.questionFormat().toUpperCase()) {
                case "MARCAR":
                    formatRule.append("\nRegra de Formato Obrigatória: Todas as questões geradas na Ficha de exercícios (exercicios) devem ser OBRIGATORIAMENTE de múltipla escolha (\"tipo\": \"multipla_escolha\"), contendo exatamente 4 opções de resposta no array 'opcoes' de cada questão.\n");
                    break;
                case "ESCREVER":
                    formatRule.append("\nRegra de Formato Obrigatória: Todas as questões geradas na Ficha de exercícios (exercicios) devem ser OBRIGATORIAMENTE de resposta escrita (\"tipo\": \"resposta_escrita\") para o aluno responder por extenso. O array 'opcoes' deve ser retornado vazio [].\n");
                    break;
                case "MISTA":
                    formatRule.append("\nRegra de Formato Obrigatória: A Ficha de exercícios (exercicios) deve conter uma mistura equilibrada de questões de múltipla escolha (\"tipo\": \"multipla_escolha\", com 4 opções) e questões de resposta escrita (\"tipo\": \"resposta_escrita\", com opções vazias).\n");
                    break;
            }
        }

        String additional = request.additionalInstructions() != null && !request.additionalInstructions().isBlank()
                ? "Instrucoes especificas complementares do professor:\n" + request.additionalInstructions()
                : "";

        return """
        Você é um especialista em educação infantil, alfabetização e metodologias ativas.
        Gere um recurso didático estruturado em português para o nível "%s" na disciplina "%s", sobre o tema: "%s".
        
        Tipo de recurso a ser gerado: %s.
        %s
        %s
        
        Seja altamente pedagógico, lúdico, engajador e adequado para a idade indicada.
        A saída deve ser exclusivamente um objeto JSON estrito com a seguinte estrutura de acordo com o tipo:
        
        Caso tipo seja COLORING_BOOK (Livro de colorir infantil):
        {
          "titulo": "Título lúdico do Livro de Colorir (Ex: O Grande Safari da Leitura)",
          "descricao": "Texto curto orientando o professor sobre o foco motor ou cognitivo desta atividade",
          "instrucoes_alunos": "Instruções divertidas em tom infantil ensinando a criança sobre o tema e o que colorir",
          "paginas": [
            {
              "numero": 1,
              "titulo_pagina": "Título ou Letra da Página (Ex: A de Abelha)",
              "descricao_desenho": "Descrição detalhada do desenho para guiar o professor ou geração de imagens posterior (Ex: Um lindo leão amigável sorrindo embaixo de uma árvore de acácia sob o sol)",
              "palavras_chave_imagem": "2 ou 3 termos descritivos simples em inglês para buscar o desenho no Unsplash (Ex: cute lion outline coloring page)",
              "texto_apoio": "Palavra ou frase curta em caixa alta para a criança praticar caligrafia ou leitura (Ex: LEÃO, ABELHA, A, B, 1, 2)",
              "svg_content": "Código SVG completo, válido, limpo e autossuficiente (começando com <svg> e terminando com </svg>). Você DEVE OBRIGATORIAMENTE fornecer um SVG simples contendo apenas o contorno da LETRA INICIAL do texto de apoio em tamanho gigante (Ex: se o texto de apoio for 'LEÃO', use a letra 'L'. Se for 'REI', use 'R'. Se for 'SOL', use 'S'). Use EXATAMENTE a estrutura de texto: <svg viewBox='0 0 100 100'><text x='50%%' y='75%%' font-size='75' font-family='sans-serif' font-weight='bold' text-anchor='middle' fill='none' stroke='black' stroke-width='3'>L</text></svg>. Substitua apenas a letra 'L' pela letra correspondente. NÃO tente desenhar objetos complexos."
            }
          ]
        }
        
        Caso tipo seja WORKSHEET (Ficha de exercícios escritos), exceto quando houver contrato ALFABETIZACAO_VISUAL acima:
        {
          "titulo": "Título da Ficha de Atividades (Ex: Desafio Prático das Frações)",
          "descricao": "Orientações pedagógicas sobre a competência trabalhada",
          "instrucoes_alunos": "Instruções claras sobre como responder às questões",
          "exercicios": [
            {
              "numero": 1,
              "enunciado": "Comando claro da pergunta. Para níveis de Educação Infantil e 1º Ano (Alfabetização), use comandos visuais e práticos, como 'Pinte as letras iniciais', 'Ligue a figura à sua sílaba inicial', 'Escreva a letra A nas pautas', evite comandos que exijam leitura fluente de textos longos",
              "tipo": "multipla_escolha" | "resposta_escrita" | "desenho" | "associar",
              "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"], // preencher apenas se for multipla_escolha, caso contrário deixar array vazio. Para alfabetização, as opções podem ser letras (ex: ['A', 'B', 'C', 'D']) ou sílabas/palavras simples
              "gabarito": "Resposta curta ou letra/número correto esperado para autocorreção do professor"
            }
          ]
        }
        
        Caso tipo seja FLASHCARD (Cartões de memorização rápida):
        {
          "titulo": "Título do Conjunto de Cartões",
          "descricao": "Instruções sobre como usar esses flashcards em dinâmicas de memorização ativa na sala",
          "instrucoes_alunos": "Como o aluno deve ler e chutar a resposta antes de virar o cartão",
          "fichas": [
            {
              "frente": "Informação ou pergunta impressa na frente (Ex: H2O)",
              "verso": "Resposta ou explicação detalhada impressa no verso (Ex: Água - Composta por dois átomos de hidrogênio e um de oxigênio)"
            }
          ]
        }
        
        Caso tipo seja GAME (Dinâmica de jogo lúdico):
        {
          "titulo": "Nome do Jogo ou Brincadeira Pedagógica",
          "descricao": "Competências socioemocionais ou físicas que o jogo exercita",
          "instrucoes_alunos": "Introdução empolgante para convidar a turma ao jogo",
          "regras": ["Regra 1 clara", "Regra 2 clara"],
          "passo_a_passo": ["Preparação da sala", "Como dar início", "Critério de pontuação ou vitória"],
          "perguntas_jogo": ["Lista de cartas, termos, palavras ou perguntas a serem recortadas ou sorteadas durante a dinâmica"]
        }
        
        Garanta que o JSON retornado seja válido e bem formatado. Não insira nenhum caractere como ```json ou marcações Markdown no início ou fim. Retorne apenas o objeto JSON delimitado por chaves {}.
        """.formatted(
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
