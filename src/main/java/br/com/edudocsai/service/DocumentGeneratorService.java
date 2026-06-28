package br.com.edudocsai.service;

import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.GeneratedImageAsset;
import br.com.edudocsai.entity.GenerationRequest;
import br.com.edudocsai.entity.TemplateStyle;
import br.com.edudocsai.exception.BadRequestException;
import br.com.edudocsai.repository.GeneratedImageAssetRepository;
import br.com.edudocsai.service.PromptBuilderHelper.GradeLevel;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.util.Units;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentGeneratorService {

    private final ObjectMapper objectMapper;
    private final GeneratedImageAssetRepository imageAssetRepository;
    private final PromptBuilderHelper promptBuilderHelper;

    // ─────────────────────────────────────────────
    // CORES POR NÍVEL DE ENSINO
    // ─────────────────────────────────────────────
    private static final String COLOR_INFANTIL        = "FF6B6B"; // coral vibrante
    private static final String COLOR_FUND_1ANO       = "FF9F43"; // laranja caloroso
    private static final String COLOR_FUND_INICIAIS   = "48DBFB"; // azul claro
    private static final String COLOR_FUND_FINAIS     = "1DD1A1"; // verde-teal
    private static final String COLOR_ENSINO_MEDIO    = "5F27CD"; // roxo profissional
    private static final String COLOR_EJA             = "576574"; // cinza-azulado sóbrio
    private static final String COLOR_DEFAULT         = "2C3E50"; // azul escuro padrão

    // CORES POR TIPO DE DOCUMENTO (faixa de subtítulo)
    private static final String COLOR_LESSON_PLAN     = "0984E3"; // azul
    private static final String COLOR_EXAM            = "D63031"; // vermelho
    private static final String COLOR_RUBRIC          = "00B894"; // verde
    private static final String COLOR_REPORT          = "6C5CE7"; // violeta

    // ─────────────────────────────────────────────
    // PONTO DE ENTRADA
    // ─────────────────────────────────────────────
    public byte[] generateDocx(Document document) {
        try (XWPFDocument docx = new XWPFDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {

            JsonNode root = objectMapper.readTree(document.getContent());
            TemplateStyle style = resolveStyle(document);
            GradeLevel level = resolveGradeLevel(document);

            switch (document.getType()) {
                case LESSON_PLAN -> renderLessonPlan(docx, root, style, level, document.getGenerationRequest());
                case EXAM        -> renderExam(docx, root, style, level, document.getGenerationRequest());
                case RUBRIC      -> renderRubric(docx, root, style, level, document.getGenerationRequest());
                case REPORT      -> renderReport(docx, root, style, level, document.getGenerationRequest());
            }

            docx.write(output);
            return output.toByteArray();
        } catch (IOException e) {
            throw new BadRequestException("Não foi possível exportar o DOCX: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────
    // RESOLVERS
    // ─────────────────────────────────────────────
    private TemplateStyle resolveStyle(Document document) {
        if (document.getGenerationRequest() != null && document.getGenerationRequest().getTemplateStyle() != null) {
            return document.getGenerationRequest().getTemplateStyle();
        }
        return TemplateStyle.INSTITUTIONAL;
    }

    private GradeLevel resolveGradeLevel(Document document) {
        if (document.getGenerationRequest() != null && document.getGenerationRequest().getGrade() != null) {
            return promptBuilderHelper.classifyGrade(document.getGenerationRequest().getGrade());
        }
        return GradeLevel.FUNDAMENTAL_INICIAIS;
    }

    private String levelColor(GradeLevel level) {
        return switch (level) {
            case INFANTIL             -> COLOR_INFANTIL;
            case FUNDAMENTAL_1_ANO   -> COLOR_FUND_1ANO;
            case FUNDAMENTAL_INICIAIS -> COLOR_FUND_INICIAIS;
            case FUNDAMENTAL_FINAIS  -> COLOR_FUND_FINAIS;
            case ENSINO_MEDIO        -> COLOR_ENSINO_MEDIO;
            case EJA                 -> COLOR_EJA;
        };
    }

    private String docTypeColor(DocumentType type) {
        return switch (type) {
            case LESSON_PLAN -> COLOR_LESSON_PLAN;
            case EXAM        -> COLOR_EXAM;
            case RUBRIC      -> COLOR_RUBRIC;
            case REPORT      -> COLOR_REPORT;
        };
    }

    private String levelLabel(GradeLevel level) {
        return switch (level) {
            case INFANTIL             -> "Educação Infantil";
            case FUNDAMENTAL_1_ANO   -> "1º Ano — Alfabetização";
            case FUNDAMENTAL_INICIAIS -> "Ensino Fundamental — Anos Iniciais";
            case FUNDAMENTAL_FINAIS  -> "Ensino Fundamental — Anos Finais";
            case ENSINO_MEDIO        -> "Ensino Médio";
            case EJA                 -> "Educação de Jovens e Adultos (EJA)";
        };
    }

    // ─────────────────────────────────────────────
    // CABEÇALHO VISUAL DIFERENCIADO
    // ─────────────────────────────────────────────
    private void addVisualHeader(XWPFDocument docx, String docTypeLabel, String docTypeColor,
                                  GradeLevel level, GenerationRequest req) {
        // Linha de título do tipo de documento (cor do tipo)
        XWPFParagraph titlePar = docx.createParagraph();
        titlePar.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun titleRun = titlePar.createRun();
        titleRun.setBold(true);
        titleRun.setFontFamily("Calibri");
        titleRun.setFontSize(20);
        titleRun.setColor(docTypeColor);
        titleRun.setCapitalized(true);
        titleRun.setText(docTypeLabel);

        // Linha de nível de ensino (cor do nível)
        XWPFParagraph levelPar = docx.createParagraph();
        levelPar.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun levelRun = levelPar.createRun();
        levelRun.setBold(false);
        levelRun.setFontFamily("Calibri");
        levelRun.setFontSize(12);
        levelRun.setColor(levelColor(level));
        levelRun.setText("▌ " + levelLabel(level) + " ▐");

        addHorizontalRule(docx, docTypeColor);
        docx.createParagraph();

        // Campos institucionais em tabela 2 colunas
        if (req == null || req.getIncludeHeader() == null || req.getIncludeHeader()) {
            addHeaderTable(docx, req, level);
            docx.createParagraph();
        }
    }

    private void addHeaderTable(XWPFDocument docx, GenerationRequest req, GradeLevel level) {
        XWPFTable table = docx.createTable(3, 2);
        table.setWidth("100%");
        setTableBorderless(table);

        String grade    = req != null && req.getGrade()    != null ? req.getGrade()    : "_______________";
        String subject  = req != null && req.getSubject()  != null ? req.getSubject()  : "_______________";
        String duration = req != null && req.getDuration() != null ? req.getDuration() : "_______________";

        setCellText(table, 0, 0, "Escola: ___________________________", false, "9B9B9B", 10);
        setCellText(table, 0, 1, "Professor(a): ___________________________", false, "9B9B9B", 10);
        setCellText(table, 1, 0, "Ano/Série: " + grade, false, "9B9B9B", 10);
        setCellText(table, 1, 1, "Disciplina: " + subject, false, "9B9B9B", 10);
        setCellText(table, 2, 0, "Data: ____/____/________", false, "9B9B9B", 10);
        setCellText(table, 2, 1, "Duração: " + duration, false, "9B9B9B", 10);
    }

    private void addHorizontalRule(XWPFDocument docx, String color) {
        XWPFParagraph p = docx.createParagraph();
        CTBorder border = p.getCTP().addNewPPr().addNewPBdr().addNewBottom();
        border.setVal(STBorder.SINGLE);
        border.setSz(BigInteger.valueOf(8));
        border.setColor(color);
    }

    // ─────────────────────────────────────────────
    // PLANO DE AULA — template diferenciado por nível
    // ─────────────────────────────────────────────
    private void renderLessonPlan(XWPFDocument docx, JsonNode root, TemplateStyle style,
                                   GradeLevel level, GenerationRequest req) {
        String docColor = docTypeColor(DocumentType.LESSON_PLAN);

        if (level == GradeLevel.INFANTIL) {
            renderLessonPlanInfantil(docx, root, style, level, req, docColor);
        } else if (level == GradeLevel.FUNDAMENTAL_1_ANO) {
            renderLessonPlan1Ano(docx, root, style, level, req, docColor);
        } else if (level == GradeLevel.ENSINO_MEDIO) {
            renderLessonPlanMedio(docx, root, style, level, req, docColor);
        } else if (level == GradeLevel.EJA) {
            renderLessonPlanEJA(docx, root, style, level, req, docColor);
        } else {
            renderLessonPlanFundamental(docx, root, style, level, req, docColor);
        }
    }

    private void renderLessonPlanInfantil(XWPFDocument docx, JsonNode root, TemplateStyle style,
                                           GradeLevel level, GenerationRequest req, String docColor) {
        addVisualHeader(docx, "Proposta de Experiência Pedagógica", docColor, level, req);

        // Bloco de Campos de Experiência (BNCC)
        addColoredSectionTitle(docx, "Campo(s) de Experiência", COLOR_INFANTIL);
        addBulletList(docx, root.path("camposExperiencia"), COLOR_INFANTIL);

        addColoredSectionTitle(docx, "Objetivos de Aprendizagem e Desenvolvimento", COLOR_INFANTIL);
        addBulletList(docx, root.path("objetivosDeAprendizagem"), COLOR_INFANTIL);

        addColoredSectionTitle(docx, "Direitos de Aprendizagem Contemplados", COLOR_INFANTIL);
        addBulletList(docx, root.path("direitosAprendizagem"), COLOR_INFANTIL);

        addColoredSectionTitle(docx, "Descrição da Experiência", COLOR_INFANTIL);
        addMethodologyStages(docx, root, COLOR_INFANTIL);

        addColoredSectionTitle(docx, "Materiais e Recursos", COLOR_INFANTIL);
        addBulletList(docx, root.path("recursosDidaticos"), COLOR_INFANTIL);

        addColoredSectionTitle(docx, "Escuta e Observação (Avaliação)", COLOR_INFANTIL);
        addTextBlock(docx, root.path("avaliacao"), COLOR_INFANTIL);

        addColoredSectionTitle(docx, "Adaptações Inclusivas", COLOR_INFANTIL);
        addJsonBlock(docx, root.path("adaptacoesInclusivas"), COLOR_INFANTIL);
    }

    private void renderLessonPlan1Ano(XWPFDocument docx, JsonNode root, TemplateStyle style,
                                       GradeLevel level, GenerationRequest req, String docColor) {
        addVisualHeader(docx, "Plano de Aula — Alfabetização Inicial", docColor, level, req);

        addColoredSectionTitle(docx, "Tema da Aula", COLOR_FUND_1ANO);
        addSimpleText(docx, text(root, "tema", ""), COLOR_FUND_1ANO, false);

        addColoredSectionTitle(docx, "Habilidades BNCC (EF01)", COLOR_FUND_1ANO);
        addBulletList(docx, root.path("habilidadesBncc"), COLOR_FUND_1ANO);

        addColoredSectionTitle(docx, "Objetivos de Aprendizagem", COLOR_FUND_1ANO);
        addBulletList(docx, root.path("objetivosDeAprendizagem"), COLOR_FUND_1ANO);

        addColoredSectionTitle(docx, "Sequência Didática", COLOR_FUND_1ANO);
        addMethodologyStages(docx, root, COLOR_FUND_1ANO);

        addColoredSectionTitle(docx, "Materiais Necessários", COLOR_FUND_1ANO);
        addBulletList(docx, root.path("recursosDidaticos"), COLOR_FUND_1ANO);

        addColoredSectionTitle(docx, "Avaliação da Aprendizagem", COLOR_FUND_1ANO);
        addTextBlock(docx, root.path("avaliacao"), COLOR_FUND_1ANO);

        addColoredSectionTitle(docx, "Suporte para Neurodivergentes", COLOR_FUND_1ANO);
        addJsonBlock(docx, root.path("adaptacoesInclusivas"), COLOR_FUND_1ANO);

        renderCompleteLessonKit(docx, root.path("kitAulaCompleta").isMissingNode()
                ? root.path("kit") : root.path("kitAulaCompleta"), COLOR_FUND_1ANO);
    }

    private void renderLessonPlanFundamental(XWPFDocument docx, JsonNode root, TemplateStyle style,
                                              GradeLevel level, GenerationRequest req, String docColor) {
        String color = levelColor(level);
        addVisualHeader(docx, "Plano de Aula", docColor, level, req);

        addColoredSectionTitle(docx, "Tema", color);
        addSimpleText(docx, text(root, "tema", ""), color, false);

        addColoredSectionTitle(docx, "Habilidades BNCC", color);
        addBulletList(docx, root.path("habilidadesBncc"), color);

        addColoredSectionTitle(docx, "Objetivos de Aprendizagem", color);
        addBulletList(docx, root.path("objetivosDeAprendizagem"), color);

        addColoredSectionTitle(docx, "Conteúdos", color);
        addBulletList(docx, root.path("conteudo"), color);

        addColoredSectionTitle(docx, "Metodologia", color);
        addMethodologyStages(docx, root, color);

        addColoredSectionTitle(docx, "Recursos Didáticos", color);
        addBulletList(docx, root.path("recursosDidaticos"), color);

        addColoredSectionTitle(docx, "Avaliação", color);
        addTextBlock(docx, root.path("avaliacao"), color);

        addColoredSectionTitle(docx, "Adaptações Inclusivas", color);
        addJsonBlock(docx, root.path("adaptacoesInclusivas"), color);

        renderCompleteLessonKit(docx, root.path("kitAulaCompleta").isMissingNode()
                ? root.path("kit") : root.path("kitAulaCompleta"), color);
    }

    private void renderLessonPlanMedio(XWPFDocument docx, JsonNode root, TemplateStyle style,
                                        GradeLevel level, GenerationRequest req, String docColor) {
        addVisualHeader(docx, "Plano de Aula — Ensino Médio", docColor, level, req);

        // Ensino Médio: destaque para competências e situação-problema
        addColoredSectionTitle(docx, "Tema / Situação-Problema", COLOR_ENSINO_MEDIO);
        addSimpleText(docx, text(root, "tema", ""), COLOR_ENSINO_MEDIO, false);

        addColoredSectionTitle(docx, "Competências Gerais BNCC", COLOR_ENSINO_MEDIO);
        addBulletList(docx, root.path("competenciasGerais"), COLOR_ENSINO_MEDIO);

        addColoredSectionTitle(docx, "Habilidades BNCC", COLOR_ENSINO_MEDIO);
        addBulletList(docx, root.path("habilidadesBncc"), COLOR_ENSINO_MEDIO);

        addColoredSectionTitle(docx, "Objetivos de Aprendizagem", COLOR_ENSINO_MEDIO);
        addBulletList(docx, root.path("objetivosDeAprendizagem"), COLOR_ENSINO_MEDIO);

        addColoredSectionTitle(docx, "Conteúdos Estruturantes", COLOR_ENSINO_MEDIO);
        addBulletList(docx, root.path("conteudo"), COLOR_ENSINO_MEDIO);

        addColoredSectionTitle(docx, "Metodologia Ativa", COLOR_ENSINO_MEDIO);
        addMethodologyStages(docx, root, COLOR_ENSINO_MEDIO);

        addColoredSectionTitle(docx, "Recursos e Tecnologias", COLOR_ENSINO_MEDIO);
        addBulletList(docx, root.path("recursosDidaticos"), COLOR_ENSINO_MEDIO);

        addColoredSectionTitle(docx, "Avaliação por Competências", COLOR_ENSINO_MEDIO);
        addTextBlock(docx, root.path("avaliacao"), COLOR_ENSINO_MEDIO);

        addColoredSectionTitle(docx, "Adaptações Inclusivas", COLOR_ENSINO_MEDIO);
        addJsonBlock(docx, root.path("adaptacoesInclusivas"), COLOR_ENSINO_MEDIO);

        renderCompleteLessonKit(docx, root.path("kitAulaCompleta").isMissingNode()
                ? root.path("kit") : root.path("kitAulaCompleta"), COLOR_ENSINO_MEDIO);
    }

    private void renderLessonPlanEJA(XWPFDocument docx, JsonNode root, TemplateStyle style,
                                      GradeLevel level, GenerationRequest req, String docColor) {
        addVisualHeader(docx, "Plano de Aula — EJA", docColor, level, req);

        addColoredSectionTitle(docx, "Tema Gerador", COLOR_EJA);
        addSimpleText(docx, text(root, "tema", ""), COLOR_EJA, false);

        addColoredSectionTitle(docx, "Conexão com a Realidade dos Educandos", COLOR_EJA);
        addTextBlock(docx, root.path("contextoRealidade"), COLOR_EJA);

        addColoredSectionTitle(docx, "Objetivos de Aprendizagem", COLOR_EJA);
        addBulletList(docx, root.path("objetivosDeAprendizagem"), COLOR_EJA);

        addColoredSectionTitle(docx, "Conteúdos", COLOR_EJA);
        addBulletList(docx, root.path("conteudo"), COLOR_EJA);

        addColoredSectionTitle(docx, "Sequência Didática (Andragogia)", COLOR_EJA);
        addMethodologyStages(docx, root, COLOR_EJA);

        addColoredSectionTitle(docx, "Recursos Didáticos", COLOR_EJA);
        addBulletList(docx, root.path("recursosDidaticos"), COLOR_EJA);

        addColoredSectionTitle(docx, "Avaliação Formativa", COLOR_EJA);
        addTextBlock(docx, root.path("avaliacao"), COLOR_EJA);

        addColoredSectionTitle(docx, "Adaptações Inclusivas", COLOR_EJA);
        addJsonBlock(docx, root.path("adaptacoesInclusivas"), COLOR_EJA);
    }

    // ─────────────────────────────────────────────
    // AVALIAÇÃO — template diferenciado por nível
    // ─────────────────────────────────────────────
    private void renderExam(XWPFDocument docx, JsonNode root, TemplateStyle style,
                             GradeLevel level, GenerationRequest req) {
        if (isEarlyChildhoodObservation(root)) {
            renderEarlyChildhoodObservation(docx, root, style, level, req);
            return;
        }
        if (isInitialLiteracyAssessment(root)) {
            renderInitialLiteracyAssessment(docx, root, style, level, req);
            return;
        }

        String color = levelColor(level);
        String docColor = docTypeColor(DocumentType.EXAM);

        String examTitle = switch (level) {
            case INFANTIL           -> "Roteiro de Observação";
            case FUNDAMENTAL_1_ANO -> "Atividade Avaliativa — Alfabetização";
            case FUNDAMENTAL_INICIAIS -> "Avaliação";
            case FUNDAMENTAL_FINAIS -> "Avaliação Formativa";
            case ENSINO_MEDIO      -> "Avaliação — Padrão ENEM";
            case EJA               -> "Avaliação de Aprendizagem — EJA";
        };

        addVisualHeader(docx, examTitle, docColor, level, req);

        // Orientações gerais em caixa destacada
        addColoredSectionTitle(docx, "Orientações Gerais", color);
        addBulletList(docx, root.path("orientacoesGerais"), color);
        docx.createParagraph();

        // Questões
        JsonNode questoes = root.path("questoes");
        if (questoes.isArray()) {
            int num = 0;
            for (JsonNode q : questoes) {
                num++;
                renderQuestion(docx, q, num, level, color);
            }
        }

        // Gabarito do professor (nova página)
        addPageBreak(docx);
        addColoredSectionTitle(docx, "GABARITO DO PROFESSOR — NÃO DISTRIBUIR AOS ALUNOS", COLOR_EXAM);
        JsonNode gabarito = root.path("gabaritoProfessor");
        if (gabarito.isArray()) {
            for (JsonNode item : gabarito) {
                addSimpleText(docx, "Questão " + item.path("numeroQuestao").asText()
                        + ": " + item.path("resposta").asText(), color, true);
                addSimpleText(docx, "  Justificativa: " + item.path("justificativaPedagogica").asText(), "9B9B9B", false);
            }
        }
        addColoredSectionTitle(docx, "Critérios de Correção", color);
        addBulletList(docx, root.path("criteriosCorrecao"), color);
        addColoredSectionTitle(docx, "Adaptações Inclusivas", color);
        addJsonBlock(docx, root.path("adaptacoesInclusivas"), color);
    }

    private void renderQuestion(XWPFDocument docx, JsonNode q, int num, GradeLevel level, String color) {
        String tipo = q.path("tipo").asText("");
        String enunciado = q.path("enunciado").asText("");
        String dificuldade = q.path("nivelDificuldade").asText("");
        String bncc = q.path("habilidadeBnccAvaliador").asText("");

        // Número e tipo em destaque
        XWPFParagraph qHeader = docx.createParagraph();
        qHeader.setSpacingBefore(200);
        XWPFRun qRun = qHeader.createRun();
        qRun.setBold(true);
        qRun.setFontFamily("Calibri");
        qRun.setFontSize(12);
        qRun.setColor(color);
        qRun.setText("Questão " + num + (tipo.isBlank() ? "" : " — " + tipo)
                + (dificuldade.isBlank() ? "" : " [" + dificuldade + "]"));

        // Enunciado
        XWPFParagraph enunciadoPar = docx.createParagraph();
        enunciadoPar.setIndentationLeft(360);
        XWPFRun enunciadoRun = enunciadoPar.createRun();
        enunciadoRun.setFontFamily("Calibri");
        enunciadoRun.setFontSize(11);
        enunciadoRun.setText(enunciado);

        // Alternativas (se houver)
        JsonNode alternativas = q.path("alternativas");
        if (alternativas.isArray() && !alternativas.isEmpty()) {
            char letra = 'A';
            for (JsonNode alt : alternativas) {
                XWPFParagraph altPar = docx.createParagraph();
                altPar.setIndentationLeft(720);
                XWPFRun altRun = altPar.createRun();
                altRun.setFontFamily("Calibri");
                altRun.setFontSize(11);
                altRun.setText(letra + ") " + alt.asText());
                letra++;
            }
        } else if (level != GradeLevel.FUNDAMENTAL_1_ANO && level != GradeLevel.INFANTIL) {
            // Linhas de resposta discursiva
            for (int i = 0; i < 3; i++) {
                XWPFParagraph linePar = docx.createParagraph();
                linePar.setIndentationLeft(360);
                XWPFRun lineRun = linePar.createRun();
                lineRun.setFontFamily("Calibri");
                lineRun.setFontSize(11);
                lineRun.setColor("CCCCCC");
                lineRun.setText("_____________________________________________________________");
            }
        }

        // BNCC em rodapé da questão (itálico, pequeno)
        if (!bncc.isBlank()) {
            XWPFParagraph bnccPar = docx.createParagraph();
            bnccPar.setIndentationLeft(360);
            XWPFRun bnccRun = bnccPar.createRun();
            bnccRun.setItalic(true);
            bnccRun.setFontFamily("Calibri");
            bnccRun.setFontSize(9);
            bnccRun.setColor("9B9B9B");
            bnccRun.setText("Habilidade BNCC: " + bncc);
        }
        docx.createParagraph();
    }

    // ─────────────────────────────────────────────
    // RUBRICA — tabela visual por nível
    // ─────────────────────────────────────────────
    private void renderRubric(XWPFDocument docx, JsonNode root, TemplateStyle style,
                               GradeLevel level, GenerationRequest req) {
        String color = levelColor(level);
        String docColor = docTypeColor(DocumentType.RUBRIC);

        String rubricTitle = switch (level) {
            case INFANTIL           -> "Rubrica de Observação — Educação Infantil";
            case FUNDAMENTAL_1_ANO -> "Rubrica de Avaliação — Alfabetização";
            case FUNDAMENTAL_INICIAIS -> "Rubrica de Avaliação";
            case FUNDAMENTAL_FINAIS -> "Rubrica de Avaliação por Competências";
            case ENSINO_MEDIO      -> "Rubrica Analítica — Ensino Médio";
            case EJA               -> "Rubrica de Avaliação — EJA";
        };

        addVisualHeader(docx, rubricTitle, docColor, level, req);

        addColoredSectionTitle(docx, "Contexto da Avaliação", color);
        addSimpleText(docx, text(root, "contextoAvaliacao", ""), color, false);
        docx.createParagraph();

        // Critérios em tabela visual
        JsonNode criterios = root.path("criterios");
        if (criterios.isArray() && !criterios.isEmpty()) {
            addColoredSectionTitle(docx, "Critérios de Avaliação", color);
            for (JsonNode criterio : criterios) {
                renderRubricCriterion(docx, criterio, color);
            }
        }

        addColoredSectionTitle(docx, "Orientações de Uso", color);
        addBulletList(docx, root.path("orientacoesUso"), color);

        addColoredSectionTitle(docx, "Adaptações Inclusivas", color);
        addBulletList(docx, root.path("adaptacoesInclusivas"), color);
    }

    private void renderRubricCriterion(XWPFDocument docx, JsonNode criterio, String color) {
        // Nome do critério
        XWPFParagraph critPar = docx.createParagraph();
        critPar.setSpacingBefore(200);
        XWPFRun critRun = critPar.createRun();
        critRun.setBold(true);
        critRun.setFontFamily("Calibri");
        critRun.setFontSize(12);
        critRun.setColor(color);
        critRun.setText("▶ " + criterio.path("nomeCriterio").asText("Critério"));

        // Descrição
        String desc = criterio.path("descricao").asText("");
        if (!desc.isBlank()) {
            XWPFParagraph descPar = docx.createParagraph();
            descPar.setIndentationLeft(360);
            XWPFRun descRun = descPar.createRun();
            descRun.setFontFamily("Calibri");
            descRun.setFontSize(10);
            descRun.setItalic(true);
            descRun.setColor("555555");
            descRun.setText(desc);
        }

        // Níveis de desempenho em tabela
        JsonNode niveis = criterio.path("niveisDesempenho");
        if (niveis.isArray() && !niveis.isEmpty()) {
            int cols = niveis.size();
            XWPFTable table = docx.createTable(2, cols);
            table.setWidth("100%");

            // Linha de cabeçalho (nível + pontuação)
            for (int i = 0; i < cols; i++) {
                JsonNode nivel = niveis.get(i);
                XWPFTableCell cell = table.getRow(0).getCell(i);
                setCellBackground(cell, color);
                XWPFParagraph p = cell.getParagraphs().get(0);
                p.setAlignment(ParagraphAlignment.CENTER);
                XWPFRun r = p.createRun();
                r.setBold(true);
                r.setColor("FFFFFF");
                r.setFontFamily("Calibri");
                r.setFontSize(10);
                r.setText(nivel.path("nivel").asText() + " (" + nivel.path("pontuacao").asText() + " pts)");
            }

            // Linha de descrição
            for (int i = 0; i < cols; i++) {
                JsonNode nivel = niveis.get(i);
                XWPFTableCell cell = table.getRow(1).getCell(i);
                XWPFParagraph p = cell.getParagraphs().get(0);
                p.setAlignment(ParagraphAlignment.LEFT);
                XWPFRun r = p.createRun();
                r.setFontFamily("Calibri");
                r.setFontSize(9);
                r.setText(nivel.path("descricao").asText(""));
            }
        }
        docx.createParagraph();
    }

    // ─────────────────────────────────────────────
    // RELATÓRIO — template diferenciado por nível
    // ─────────────────────────────────────────────
    private void renderReport(XWPFDocument docx, JsonNode root, TemplateStyle style,
                               GradeLevel level, GenerationRequest req) {
        String color = levelColor(level);
        String docColor = docTypeColor(DocumentType.REPORT);

        String reportTitle = switch (level) {
            case INFANTIL           -> "Relatório de Desenvolvimento Individual — Educação Infantil";
            case FUNDAMENTAL_1_ANO -> "Relatório Pedagógico — Alfabetização";
            case FUNDAMENTAL_INICIAIS -> "Relatório Pedagógico";
            case FUNDAMENTAL_FINAIS -> "Relatório de Desempenho Acadêmico";
            case ENSINO_MEDIO      -> "Relatório de Desempenho por Competências";
            case EJA               -> "Relatório de Progresso — EJA";
        };

        addVisualHeader(docx, reportTitle, docColor, level, req);

        if (level == GradeLevel.INFANTIL) {
            addColoredSectionTitle(docx, "Contexto da Turma e do Período", color);
            addTextBlock(docx, root.path("contextoTurma"), color);

            addColoredSectionTitle(docx, "Campos de Experiência Trabalhados", color);
            addBulletList(docx, root.path("camposExperiencia"), color);

            addColoredSectionTitle(docx, "Indicadores de Desenvolvimento Observados", color);
            addBulletList(docx, root.path("analiseDesenvolvimento"), color);

            addColoredSectionTitle(docx, "Interações e Brincadeiras", color);
            addTextBlock(docx, root.path("interacoesBrincadeiras"), color);

            addColoredSectionTitle(docx, "Sugestões para Família", color);
            addBulletList(docx, root.path("recomendacoesProximosPassos"), color);

            addColoredSectionTitle(docx, "Observações da Professora", color);
            addTextBlock(docx, root.path("observacoesFinais"), color);

        } else if (level == GradeLevel.ENSINO_MEDIO) {
            addColoredSectionTitle(docx, "Contexto da Turma", color);
            addTextBlock(docx, root.path("contextoTurma"), color);

            addColoredSectionTitle(docx, "Competências Desenvolvidas", color);
            addBulletList(docx, root.path("habilidadesTrabalhadas"), color);

            addColoredSectionTitle(docx, "Análise de Desempenho", color);
            addBulletList(docx, root.path("analiseDesenvolvimento"), color);

            addColoredSectionTitle(docx, "Desafios e Lacunas Identificadas", color);
            addBulletList(docx, root.path("desafiosIdentificados"), color);

            addColoredSectionTitle(docx, "Recomendações e Próximos Passos", color);
            addBulletList(docx, root.path("recomendacoesProximosPassos"), color);

            addColoredSectionTitle(docx, "Considerações Finais", color);
            addTextBlock(docx, root.path("observacoesFinais"), color);

        } else if (level == GradeLevel.EJA) {
            addColoredSectionTitle(docx, "Contexto da Turma e Perfil dos Educandos", color);
            addTextBlock(docx, root.path("contextoTurma"), color);

            addColoredSectionTitle(docx, "Habilidades e Saberes Desenvolvidos", color);
            addBulletList(docx, root.path("habilidadesTrabalhadas"), color);

            addColoredSectionTitle(docx, "Análise de Progresso", color);
            addBulletList(docx, root.path("analiseDesenvolvimento"), color);

            addColoredSectionTitle(docx, "Desafios e Necessidades Identificadas", color);
            addBulletList(docx, root.path("desafiosIdentificados"), color);

            addColoredSectionTitle(docx, "Encaminhamentos e Próximos Passos", color);
            addBulletList(docx, root.path("recomendacoesProximosPassos"), color);

            addColoredSectionTitle(docx, "Observações Finais", color);
            addTextBlock(docx, root.path("observacoesFinais"), color);

        } else {
            addColoredSectionTitle(docx, "Contexto da Turma", color);
            addTextBlock(docx, root.path("contextoTurma"), color);

            addColoredSectionTitle(docx, "Habilidades Trabalhadas", color);
            addBulletList(docx, root.path("habilidadesTrabalhadas"), color);

            addColoredSectionTitle(docx, "Análise de Desenvolvimento", color);
            addBulletList(docx, root.path("analiseDesenvolvimento"), color);

            addColoredSectionTitle(docx, "Desafios Identificados", color);
            addBulletList(docx, root.path("desafiosIdentificados"), color);

            addColoredSectionTitle(docx, "Recomendações e Próximos Passos", color);
            addBulletList(docx, root.path("recomendacoesProximosPassos"), color);

            addColoredSectionTitle(docx, "Observações Finais", color);
            addTextBlock(docx, root.path("observacoesFinais"), color);
        }
    }

    // ─────────────────────────────────────────────
    // TEMPLATES ESPECIAIS (Infantil / Alfabetização)
    // ─────────────────────────────────────────────
    private void renderEarlyChildhoodObservation(XWPFDocument docx, JsonNode root, TemplateStyle style,
                                                  GradeLevel level, GenerationRequest req) {
        addVisualHeader(docx, "Roteiro de Observação e Registro", docTypeColor(DocumentType.EXAM), level, req);

        addColoredSectionTitle(docx, "Título da Experiência", COLOR_INFANTIL);
        addSimpleText(docx, text(root, "titulo", "Roteiro de observação"), COLOR_INFANTIL, false);

        addColoredSectionTitle(docx, "Orientações Gerais", COLOR_INFANTIL);
        addBulletList(docx, root.path("orientacoesGerais"), COLOR_INFANTIL);

        addColoredSectionTitle(docx, "Contexto da Observação", COLOR_INFANTIL);
        addSimpleText(docx, scalarText(root.path("contextoObservacao")), COLOR_INFANTIL, false);

        addColoredSectionTitle(docx, "Indicadores Observáveis", COLOR_INFANTIL);
        addObservationIndicators(docx, root.path("indicadoresObservaveis"), COLOR_INFANTIL);

        addColoredSectionTitle(docx, "Registros do Professor", COLOR_INFANTIL);
        addTeacherRecords(docx, root.path("registrosProfessor"), COLOR_INFANTIL);

        addColoredSectionTitle(docx, "Sugestões de Intervenção", COLOR_INFANTIL);
        addBulletList(docx, root.path("sugestoesIntervencao"), COLOR_INFANTIL);

        addColoredSectionTitle(docx, "Adaptações Inclusivas", COLOR_INFANTIL);
        addJsonBlock(docx, root.path("adaptacoesInclusivas"), COLOR_INFANTIL);
    }

    private void renderInitialLiteracyAssessment(XWPFDocument docx, JsonNode root, TemplateStyle style,
                                                  GradeLevel level, GenerationRequest req) {
        addVisualHeader(docx, "Atividade de Alfabetização", docTypeColor(DocumentType.EXAM), level, req);

        addColoredSectionTitle(docx, "Título", COLOR_FUND_1ANO);
        addSimpleText(docx, text(root, "titulo", "Atividade de alfabetização"), COLOR_FUND_1ANO, false);

        boolean isV2 = root.path("schemaVersion").asInt(0) >= 2;
        JsonNode activities = isV2 && root.path("exercicios").isArray()
                ? root.path("exercicios") : root.path("atividadesVisuais");
        JsonNode notes = isV2 && root.path("orientacoesProfessor").isArray()
                ? root.path("orientacoesProfessor") : root.path("orientacoesGerais");

        addColoredSectionTitle(docx, "Orientações para o(a) Professor(a)", COLOR_FUND_1ANO);
        addBulletList(docx, notes, COLOR_FUND_1ANO);
        addInitialLiteracyActivities(docx, activities);
    }

    // ─────────────────────────────────────────────
    // ATIVIDADES DE ALFABETIZAÇÃO (schema V2)
    // ─────────────────────────────────────────────
    private void addInitialLiteracyActivities(XWPFDocument docx, JsonNode activities) {
        addColoredSectionTitle(docx, "Atividades", COLOR_FUND_1ANO);
        if (activities == null || !activities.isArray() || activities.isEmpty()) {
            addSimpleText(docx, "____________________________", "CCCCCC", false);
            return;
        }
        for (JsonNode activity : activities) {
            String number  = scalarText(activity.path("numero"));
            String tipo    = activity.path("tipo").asText("").toUpperCase();
            String command = valueOrLine(scalarText(activity.path("comando")));

            XWPFParagraph cmdPar = docx.createParagraph();
            cmdPar.setSpacingBefore(300);
            XWPFRun cmdRun = cmdPar.createRun();
            cmdRun.setBold(true);
            cmdRun.setFontFamily("Calibri");
            cmdRun.setFontSize(12);
            cmdRun.setColor(COLOR_FUND_1ANO);
            cmdRun.setText(number + ". " + command.toUpperCase());

            JsonNode items = activity.path("itens");
            if (items.isArray() && !items.isEmpty()) {
                for (JsonNode item : items) {
                    insertImageFromNode(docx, item);
                    addLiteracyItem(docx, item, tipo);
                }
            } else {
                addSimpleText(docx, "   Figura: ____________________    Palavra: ____________________    [   ]", "555555", false);
            }

            String gabarito = activity.path("gabarito").asText("");
            if (!gabarito.isBlank()) {
                XWPFParagraph gabPar = docx.createParagraph();
                XWPFRun gabRun = gabPar.createRun();
                gabRun.setItalic(true);
                gabRun.setFontFamily("Calibri");
                gabRun.setFontSize(9);
                gabRun.setColor("9B9B9B");
                gabRun.setText("   → Gabarito: " + gabarito);
            }
            docx.createParagraph();
        }
    }

    private void addLiteracyItem(XWPFDocument docx, JsonNode item, String tipo) {
        String figure = scalarText(item.path("figura"));
        String word   = scalarText(item.path("palavra"));
        String label  = (figure.isBlank() ? word : figure).toUpperCase();
        if (label.isBlank()) label = "______";

        String line = switch (tipo) {
            case "SEPARAR_SILABAS" -> {
                JsonNode silabas = item.path("silabas");
                int n = silabas.isArray() && !silabas.isEmpty() ? silabas.size()
                        : Math.max(2, item.path("caixasResposta").asInt(2));
                StringBuilder sb = new StringBuilder("   " + label + "   →   ");
                for (int i = 0; i < n; i++) { if (i > 0) sb.append("  "); sb.append("[         ]"); }
                yield sb.toString();
            }
            case "LETRA_INICIAL" -> {
                JsonNode opts = item.path("opcoes");
                StringBuilder sb = new StringBuilder("   " + label + "   ");
                if (opts.isArray() && !opts.isEmpty()) {
                    for (JsonNode o : opts) sb.append("(   ) ").append(o.asText()).append("   ");
                } else sb.append("(   ) ___   (   ) ___   (   ) ___");
                yield sb.toString();
            }
            case "LIGAR_FIGURA_PALAVRA" -> {
                String wl = word.isBlank() ? label : word.toUpperCase();
                yield "   " + label + "   ────────────────────   " + wl;
            }
            case "COMPLETAR_PALAVRA" -> {
                String wd = label.length() > 3 ? label.substring(0, 2) + "___" + label.substring(label.length() - 2) : label + "___";
                JsonNode opts = item.path("opcoes");
                StringBuilder sb = new StringBuilder("   " + wd + "   ");
                if (opts.isArray() && !opts.isEmpty()) for (JsonNode o : opts) sb.append("(   ) ").append(o.asText()).append("   ");
                else sb.append("(   ) ___   (   ) ___");
                yield sb.toString();
            }
            case "CONTAR_LETRAS" ->
                "   " + label + "   →   Quantas letras tem essa palavra?   ___ letras";
            case "CIRCULAR_LETRA", "CACA_LETRA" -> {
                String alvo = item.path("letraAlvo").asText("");
                if (alvo.isBlank() && !label.isBlank()) alvo = String.valueOf(label.charAt(0));
                JsonNode letras = item.path("letras");
                StringBuilder sb = new StringBuilder("   Circule a letra \"" + alvo + "\":   ");
                if (letras.isArray() && !letras.isEmpty()) for (JsonNode l : letras) sb.append(l.asText()).append("  ");
                else sb.append(label);
                yield sb.toString();
            }
            default -> {
                String boxes = responseBoxes(item);
                yield "   " + label + (boxes.isBlank() ? "    ____________________________" : "    " + boxes);
            }
        };

        XWPFParagraph p = docx.createParagraph();
        p.setIndentationLeft(360);
        XWPFRun r = p.createRun();
        r.setFontFamily("Calibri");
        r.setFontSize(13);
        r.setText(line);
    }

    // ─────────────────────────────────────────────
    // KIT AULA COMPLETA
    // ─────────────────────────────────────────────
    private void renderCompleteLessonKit(XWPFDocument docx, JsonNode kit, String color) {
        if (kit == null || kit.isMissingNode() || kit.isNull()) return;

        addPageBreak(docx);
        addColoredSectionTitle(docx, "KIT AULA COMPLETA", color);

        JsonNode sa = kit.path("studentActivity").isMissingNode() ? kit.path("atividadeAluno") : kit.path("studentActivity");
        addColoredSectionTitle(docx, "Atividade do Aluno", color);
        addSimpleText(docx, scalarText(sa.path("title").isMissingNode() ? sa.path("titulo") : sa.path("title")), color, true);
        addSimpleText(docx, scalarText(sa.path("context").isMissingNode() ? sa.path("contexto") : sa.path("context")), "555555", false);
        addBulletList(docx, sa.path("instructions").isMissingNode() ? sa.path("orientacoes") : sa.path("instructions"), color);
        addBulletList(docx, sa.path("questions").isMissingNode() ? sa.path("questoes") : sa.path("questions"), color);

        addColoredSectionTitle(docx, "Gabarito do Professor", color);
        JsonNode tak = kit.path("teacherAnswerKey").isMissingNode() ? kit.path("gabaritoProfessor") : kit.path("teacherAnswerKey");
        addBulletList(docx, tak.path("expectedAnswers").isMissingNode() ? tak.path("respostasEsperadas") : tak.path("expectedAnswers"), color);
        addBulletList(docx, tak.path("teacherGuidance").isMissingNode() ? tak.path("orientacoesProfessor") : tak.path("teacherGuidance"), color);

        addColoredSectionTitle(docx, "Instrumento Avaliativo", color);
        JsonNode ai = kit.path("assessmentInstrument").isMissingNode() ? kit.path("instrumentoAvaliativo") : kit.path("assessmentInstrument");
        addBulletList(docx, ai.path("criteria").isMissingNode() ? ai.path("criterios") : ai.path("criteria"), color);
        addBulletList(docx, ai.path("evidenceCollection").isMissingNode() ? ai.path("coletaEvidencias") : ai.path("evidenceCollection"), color);

        addColoredSectionTitle(docx, "Adaptações Inclusivas", color);
        JsonNode inc = kit.path("inclusiveAdaptations").isMissingNode() ? kit.path("adaptacoesInclusivas") : kit.path("inclusiveAdaptations");
        addBulletList(docx, inc.path("readingSupport").isMissingNode() ? inc.path("apoioLeitura") : inc.path("readingSupport"), color);
        addBulletList(docx, inc.path("participationSupport").isMissingNode() ? inc.path("apoioParticipacao") : inc.path("participationSupport"), color);
        addBulletList(docx, inc.path("simplifiedAlternatives").isMissingNode() ? inc.path("alternativasSimplificadas") : inc.path("simplifiedAlternatives"), color);
    }

    // ─────────────────────────────────────────────
    // HELPERS VISUAIS
    // ─────────────────────────────────────────────
    private void addColoredSectionTitle(XWPFDocument docx, String title, String color) {
        XWPFParagraph p = docx.createParagraph();
        p.setSpacingBefore(240);
        p.setSpacingAfter(80);
        XWPFRun r = p.createRun();
        r.setBold(true);
        r.setFontFamily("Calibri");
        r.setFontSize(13);
        r.setColor(color);
        r.setText("▌ " + title.toUpperCase());
    }

    private void addSimpleText(XWPFDocument docx, String text, String color, boolean bold) {
        if (text == null || text.isBlank()) return;
        XWPFParagraph p = docx.createParagraph();
        p.setIndentationLeft(360);
        p.setSpacingAfter(80);
        XWPFRun r = p.createRun();
        r.setBold(bold);
        r.setFontFamily("Calibri");
        r.setFontSize(11);
        r.setColor(color);
        r.setText(text);
    }

    private void addBulletList(XWPFDocument docx, JsonNode node, String color) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            addSimpleText(docx, "____________________________", "CCCCCC", false);
            return;
        }
        if (node.isArray()) {
            for (JsonNode item : node) {
                String txt = scalarText(item);
                if (!txt.isBlank()) {
                    XWPFParagraph p = docx.createParagraph();
                    p.setIndentationLeft(540);
                    p.setSpacingAfter(60);
                    XWPFRun r = p.createRun();
                    r.setFontFamily("Calibri");
                    r.setFontSize(11);
                    r.setColor("333333");
                    r.setText("• " + txt);
                }
            }
        } else {
            addSimpleText(docx, scalarText(node), "333333", false);
        }
        docx.createParagraph();
    }

    private void addTextBlock(XWPFDocument docx, JsonNode node, String color) {
        String txt = scalarText(node);
        if (txt.isBlank()) {
            addSimpleText(docx, "____________________________", "CCCCCC", false);
        } else {
            addSimpleText(docx, txt, "333333", false);
        }
        docx.createParagraph();
    }

    private void addJsonBlock(XWPFDocument docx, JsonNode node, String color) {
        if (node == null || node.isMissingNode() || node.isNull()) return;
        if (node.isObject()) {
            node.fields().forEachRemaining(entry -> {
                String val = scalarText(entry.getValue());
                if (!val.isBlank()) {
                    addSimpleText(docx, entry.getKey() + ": " + val, "555555", false);
                }
            });
        } else if (node.isArray()) {
            addBulletList(docx, node, color);
            return;
        }
        docx.createParagraph();
    }

    private void addMethodologyStages(XWPFDocument docx, JsonNode root, String color) {
        if (!root.path("weeklyPlan").isMissingNode() || !root.path("planoSemanal").isMissingNode()) {
            addWeeklyPlan(docx, root, color);
            return;
        }
        if (!root.path("monthlyPlan").isMissingNode() || !root.path("planoMensal").isMissingNode()) {
            addMonthlyPlan(docx, root, color);
            return;
        }
        
        JsonNode methodology = root.path("methodology").isMissingNode()
                ? root.path("metodologia") : root.path("methodology");

        String[] stageKeys   = {"introducao", "introduction", "desenvolvimento", "development", "fechamento", "closing"};
        String[] stageLabels = {"Introdução", "Introdução", "Desenvolvimento", "Desenvolvimento", "Fechamento", "Fechamento"};

        boolean added = false;
        for (int i = 0; i < stageKeys.length; i += 2) {
            JsonNode stage = methodology.path(stageKeys[i]).isMissingNode()
                    ? methodology.path(stageKeys[i + 1]) : methodology.path(stageKeys[i]);
            if (!stage.isMissingNode() && !stage.isNull()) {
                String minutes = scalarText(stage.path("durationMinutes").isMissingNode()
                        ? stage.path("tempoMinutos") : stage.path("durationMinutes"));
                String desc = scalarText(stage.path("description").isMissingNode()
                        ? stage.path("descricao") : stage.path("description"));
                if (!desc.isBlank() || !minutes.isBlank()) {
                    String label = stageLabels[i] + (minutes.isBlank() ? "" : " (" + minutes + " min)");
                    addSimpleText(docx, label + ":", color, true);
                    if (!desc.isBlank()) addSimpleText(docx, desc, "333333", false);
                    added = true;
                }
            }
        }
        if (!added) {
            addSimpleText(docx, "____________________________", "CCCCCC", false);
        }
        docx.createParagraph();
    }

    private void addWeeklyPlan(XWPFDocument docx, JsonNode root, String color) {
        JsonNode plan = root.path("weeklyPlan").isMissingNode() ? root.path("planoSemanal") : root.path("weeklyPlan");
        if (plan == null || !plan.isArray() || plan.isEmpty()) return;

        XWPFTable table = docx.createTable(plan.size() + 1, 4);
        setTableBorderless(table);

        String[] headers = {"Dia", "Foco", "Atividades", "Avaliação"};
        for (int i = 0; i < headers.length; i++) {
            XWPFTableCell cell = table.getRow(0).getCell(i);
            setCellBackground(cell, color);
            setCellText(table, 0, i, headers[i], true, "FFFFFF", 11);
        }

        for (int i = 0; i < plan.size(); i++) {
            JsonNode dayNode = plan.get(i);
            setCellText(table, i + 1, 0, scalarText(dayNode.path("day")), true, "333333", 10);
            setCellText(table, i + 1, 1, scalarText(dayNode.path("focus")), false, "333333", 10);
            setCellText(table, i + 1, 2, scalarText(dayNode.path("activities")), false, "333333", 10);
            setCellText(table, i + 1, 3, scalarText(dayNode.path("assessment")), false, "333333", 10);
            
            // Zebra striping
            if (i % 2 == 0) {
                for (int j = 0; j < 4; j++) {
                    setCellBackground(table.getRow(i + 1).getCell(j), "F9F9F9");
                }
            }
        }
        docx.createParagraph();
    }

    private void addMonthlyPlan(XWPFDocument docx, JsonNode root, String color) {
        JsonNode plan = root.path("monthlyPlan").isMissingNode() ? root.path("planoMensal") : root.path("monthlyPlan");
        if (plan == null || !plan.isArray() || plan.isEmpty()) return;

        XWPFTable table = docx.createTable(plan.size() + 1, 4);
        setTableBorderless(table);

        String[] headers = {"Semana", "Tema", "Objetivos", "Metodologia"};
        for (int i = 0; i < headers.length; i++) {
            XWPFTableCell cell = table.getRow(0).getCell(i);
            setCellBackground(cell, color);
            setCellText(table, 0, i, headers[i], true, "FFFFFF", 11);
        }

        for (int i = 0; i < plan.size(); i++) {
            JsonNode weekNode = plan.get(i);
            setCellText(table, i + 1, 0, scalarText(weekNode.path("week")), true, "333333", 10);
            setCellText(table, i + 1, 1, scalarText(weekNode.path("theme")), false, "333333", 10);
            setCellText(table, i + 1, 2, scalarText(weekNode.path("goals")), false, "333333", 10);
            setCellText(table, i + 1, 3, scalarText(weekNode.path("methodology")), false, "333333", 10);
            
            // Zebra striping
            if (i % 2 == 0) {
                for (int j = 0; j < 4; j++) {
                    setCellBackground(table.getRow(i + 1).getCell(j), "F9F9F9");
                }
            }
        }
        docx.createParagraph();
    }

    private void addObservationIndicators(XWPFDocument docx, JsonNode indicators, String color) {
        if (indicators == null || !indicators.isArray() || indicators.isEmpty()) {
            addSimpleText(docx, "____________________________", "CCCCCC", false);
            return;
        }
        for (JsonNode ind : indicators) {
            addSimpleText(docx, valueOrLine(scalarText(ind.path("indicador"))), color, true);
            addSimpleText(docx, "O que observar: " + valueOrLine(scalarText(ind.path("oQueObservar"))), "555555", false);
            addBulletList(docx, ind.path("possiveisRegistros"), color);
            addBulletList(docx, ind.path("perguntasMediadoras"), color);
        }
    }

    private void addTeacherRecords(XWPFDocument docx, JsonNode records, String color) {
        if (records == null || !records.isArray() || records.isEmpty()) {
            addSimpleText(docx, "____________________________", "CCCCCC", false);
            return;
        }
        for (JsonNode rec : records) {
            String field    = scalarText(rec.path("campo"));
            String guidance = scalarText(rec.path("orientacao"));
            addSimpleText(docx, valueOrLine(field) + ": " + valueOrLine(guidance), "333333", false);
        }
        docx.createParagraph();
    }

    private void addPageBreak(XWPFDocument docx) {
        XWPFParagraph p = docx.createParagraph();
        p.setPageBreak(true);
    }

    // ─────────────────────────────────────────────
    // TABELAS UTILITÁRIAS
    // ─────────────────────────────────────────────
    private void setTableBorderless(XWPFTable table) {
        CTTblPr tblPr = table.getCTTbl().getTblPr();
        if (tblPr == null) tblPr = table.getCTTbl().addNewTblPr();
        CTTblBorders borders = tblPr.isSetTblBorders() ? tblPr.getTblBorders() : tblPr.addNewTblBorders();
        CTBorder noBorder = CTBorder.Factory.newInstance();
        noBorder.setVal(STBorder.NONE);
        borders.setTop(noBorder);
        borders.setBottom(noBorder);
        borders.setLeft(noBorder);
        borders.setRight(noBorder);
        borders.setInsideH(noBorder);
        borders.setInsideV(noBorder);
    }

    private void setCellText(XWPFTable table, int row, int col, String text, boolean bold, String color, int fontSize) {
        XWPFTableCell cell = table.getRow(row).getCell(col);
        XWPFParagraph p = cell.getParagraphs().isEmpty() ? cell.addParagraph() : cell.getParagraphs().get(0);
        XWPFRun r = p.createRun();
        r.setBold(bold);
        r.setFontFamily("Calibri");
        r.setFontSize(fontSize);
        r.setColor(color);
        r.setText(text);
    }

    private void setCellBackground(XWPFTableCell cell, String hexColor) {
        CTTcPr tcPr = cell.getCTTc().isSetTcPr() ? cell.getCTTc().getTcPr() : cell.getCTTc().addNewTcPr();
        CTShd shd = tcPr.isSetShd() ? tcPr.getShd() : tcPr.addNewShd();
        shd.setVal(STShd.CLEAR);
        shd.setColor("auto");
        shd.setFill(hexColor);
    }

    // ─────────────────────────────────────────────
    // INSERÇÃO DE IMAGEM
    // ─────────────────────────────────────────────
    private void insertImageFromNode(XWPFDocument docx, JsonNode node) {
        String imagemUrl = node.path("imagemUrl").asText("");
        if (imagemUrl.isBlank()) return;
        String[] parts = imagemUrl.split("/");
        if (parts.length == 0) return;
        try {
            long assetId = Long.parseLong(parts[parts.length - 1]);
            Optional<GeneratedImageAsset> assetOpt = imageAssetRepository.findById(assetId);
            if (assetOpt.isEmpty()) {
                log.warn("Image asset not found id={}", assetId);
                return;
            }
            GeneratedImageAsset asset = assetOpt.get();
            int pictureType = asset.getMimeType().contains("png")
                    ? XWPFDocument.PICTURE_TYPE_PNG : XWPFDocument.PICTURE_TYPE_JPEG;
            XWPFParagraph imgPar = docx.createParagraph();
            imgPar.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun imgRun = imgPar.createRun();
            imgRun.addPicture(
                    new ByteArrayInputStream(asset.getImageData()),
                    pictureType,
                    asset.getSubject(),
                    Units.toEMU(120),
                    Units.toEMU(120)
            );
        } catch (NumberFormatException e) {
            log.warn("Invalid image asset id in imagemUrl={}", imagemUrl);
        } catch (Exception e) {
            log.warn("Failed to insert image assetUrl={} reason={}", imagemUrl, e.getMessage());
        }
    }

    // ─────────────────────────────────────────────
    // DETECÇÃO DE TIPO DE AVALIAÇÃO
    // ─────────────────────────────────────────────
    private boolean isEarlyChildhoodObservation(JsonNode root) {
        String type = root.path("tipoAvaliacao").asText("");
        return "OBSERVACAO_INFANTIL".equalsIgnoreCase(type)
                || (!root.path("indicadoresObservaveis").isMissingNode() && root.path("questoes").isMissingNode());
    }

    private boolean isInitialLiteracyAssessment(JsonNode root) {
        String type   = root.path("tipoAvaliacao").asText("");
        String layout = root.path("layout").asText("");
        return "ALFABETIZACAO_INICIAL".equalsIgnoreCase(type)
                || layout.startsWith("ALFABETIZACAO_VISUAL")
                || (!root.path("atividadesVisuais").isMissingNode() && root.path("questoes").isMissingNode())
                || (root.path("schemaVersion").asInt(0) >= 2
                    && root.path("exercicios").isArray()
                    && !root.path("exercicios").isEmpty()
                    && root.path("questoes").isMissingNode());
    }

    // ─────────────────────────────────────────────
    // UTILITÁRIOS DE TEXTO
    // ─────────────────────────────────────────────
    private String responseBoxes(JsonNode item) {
        int boxes = item.path("caixasResposta").asInt(0);
        if (boxes <= 0) boxes = item.path("caixas").asInt(0);
        if (boxes <= 0) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < boxes; i++) {
            if (sb.length() > 0) sb.append(" ");
            sb.append("[   ]");
        }
        return sb.toString();
    }

    private String text(JsonNode root, String key, String fallback) {
        String v = root.path(key).asText(null);
        return (v == null || v.isBlank()) ? fallback : v;
    }

    private String scalarText(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) return "";
        if (node.isTextual() || node.isNumber() || node.isBoolean()) return node.asText();
        return "";
    }

    private String valueOrLine(String value) {
        return (value == null || value.isBlank()) ? "____________________________" : value.trim();
    }
}
