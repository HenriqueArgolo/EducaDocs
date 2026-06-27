package br.com.edudocsai.service;

import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.GeneratedImageAsset;
import br.com.edudocsai.entity.GenerationRequest;
import br.com.edudocsai.entity.TemplateStyle;
import br.com.edudocsai.exception.BadRequestException;
import br.com.edudocsai.repository.GeneratedImageAssetRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.util.Units;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentGeneratorService {

    private final ObjectMapper objectMapper;
    private final GeneratedImageAssetRepository imageAssetRepository;

    public byte[] generateDocx(Document document) {
        try (XWPFDocument docx = new XWPFDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            JsonNode root = objectMapper.readTree(document.getContent());

            TemplateStyle style = document.getGenerationRequest() != null && document.getGenerationRequest().getTemplateStyle() != null
                    ? document.getGenerationRequest().getTemplateStyle()
                    : TemplateStyle.INSTITUTIONAL;

            switch (document.getType()) {
                case LESSON_PLAN -> renderLessonPlanTemplate(docx, root, style, document.getGenerationRequest());
                case EXAM -> renderExamTemplate(docx, root, style, document.getGenerationRequest());
                case RUBRIC -> renderRubricTemplate(docx, root, style, document.getGenerationRequest());
                case REPORT -> renderReportTemplate(docx, root, style, document.getGenerationRequest());
            }

            docx.write(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new BadRequestException("Nao foi possivel exportar DOCX");
        }
    }

    private void renderLessonPlanTemplate(XWPFDocument docx, JsonNode root, TemplateStyle style, GenerationRequest request) {
        addTitle(docx, "PLANO DE AULA", style);
        addInstitutionalHeader(docx, request, style);
        addTextSection(docx, "Tema:", root.path("tema").asText(null), style);

        JsonNode obj = root.path("objetivosDeAprendizagem");
        if(obj.isMissingNode()) obj = root.path("objectives");
        addListSection(docx, "Objetivos de Aprendizagem:", obj, style);

        JsonNode cont = root.path("conteudo");
        if(cont.isMissingNode()) cont = root.path("contents");
        addListSection(docx, "Conteúdo:", cont, style);

        addLessonPlanMethodologySection(docx, root.path("methodology").isMissingNode() ? root.path("metodologia") : root.path("methodology"), style);

        JsonNode rec = root.path("recursosDidaticos");
        if(rec.isMissingNode()) rec = root.path("resources");
        addListSection(docx, "Recursos Didáticos:", rec, style);

        addLessonPlanEvaluationSection(docx, root.path("evaluation").isMissingNode() ? root.path("avaliacao") : root.path("evaluation"), style);

        JsonNode time = root.path("tempoEstimado");
        if(time.isMissingNode()) time = root.path("time");
        if(!time.isMissingNode()) {
            addLessonPlanEstimatedTimeSection(docx, time, style);
        }

        JsonNode kit = root.path("kitAulaCompleta");
        if(kit.isMissingNode()) kit = root.path("kit");
        renderCompleteLessonKit(docx, kit, style);
    }

    private void renderExamTemplate(XWPFDocument docx, JsonNode root, TemplateStyle style, GenerationRequest request) {
        if (isEarlyChildhoodObservation(root)) {
            renderEarlyChildhoodObservationTemplate(docx, root, style, request);
            return;
        }
        if (isInitialLiteracyAssessment(root)) {
            renderInitialLiteracyAssessmentTemplate(docx, root, style, request);
            return;
        }

        addTitle(docx, text(root, "titulo", "PROVA"), style);
        addInstitutionalHeader(docx, request, style);
        addListSection(docx, "Orientações Gerais:", root.path("orientacoesGerais"), style);

        JsonNode questoes = root.path("questoes");
        if (questoes.isArray()) {
            for (JsonNode questao : questoes) {
                addParagraph(docx, "Questão " + questao.path("numero").asText() + " (" + questao.path("tipo").asText() + ")", true, style);
                addParagraph(docx, questao.path("enunciado").asText(), false, style);
                JsonNode alternativas = questao.path("alternativas");
                if (alternativas.isArray()) {
                    for (JsonNode alternativa : alternativas) {
                        addParagraph(docx, alternativa.asText(), false, style);
                    }
                }
                addParagraph(docx, "Habilidade BNCC Avaliada: " + questao.path("habilidadeBnccAvaliador").asText() + " | Dificuldade: " + questao.path("nivelDificuldade").asText(), false, style, true);
                docx.createParagraph(); // empty line
            }
        }

        // Gabarito apenas para professor
        docx.createParagraph().setPageBreak(true);
        addTitle(docx, "GABARITO DO PROFESSOR (NÃO IMPRIMIR PARA ALUNOS)", style);
        JsonNode gabarito = root.path("gabaritoProfessor");
        if (gabarito.isArray()) {
            for (JsonNode item : gabarito) {
                addParagraph(docx, "Questão " + item.path("numeroQuestao").asText() + ": " + item.path("resposta").asText(), true, style);
                addParagraph(docx, "Justificativa: " + item.path("justificativaPedagogica").asText(), false, style);
            }
        }
        addListSection(docx, "Critérios de Correção:", root.path("criteriosCorrecao"), style);
        addJsonSection(docx, "Adaptações Inclusivas:", root.path("adaptacoesInclusivas"), style);
    }

    private boolean isEarlyChildhoodObservation(JsonNode root) {
        String assessmentType = root.path("tipoAvaliacao").asText("");
        return "OBSERVACAO_INFANTIL".equalsIgnoreCase(assessmentType)
                || (!root.path("indicadoresObservaveis").isMissingNode() && root.path("questoes").isMissingNode());
    }

    private boolean isInitialLiteracyAssessment(JsonNode root) {
        String assessmentType = root.path("tipoAvaliacao").asText("");
        String layout = root.path("layout").asText("");
        // Suporte ao schema V2 (layout ALFABETIZACAO_VISUAL_V2 + campo exercicios)
        // e ao schema legado (campo atividadesVisuais)
        return "ALFABETIZACAO_INICIAL".equalsIgnoreCase(assessmentType)
                || layout.startsWith("ALFABETIZACAO_VISUAL")
                || (!root.path("atividadesVisuais").isMissingNode() && root.path("questoes").isMissingNode())
                || (root.path("schemaVersion").asInt(0) >= 2
                    && root.path("exercicios").isArray()
                    && !root.path("exercicios").isEmpty()
                    && root.path("questoes").isMissingNode());
    }

    private void renderInitialLiteracyAssessmentTemplate(
            XWPFDocument docx,
            JsonNode root,
            TemplateStyle style,
            GenerationRequest request
    ) {
        addTitle(docx, "ATIVIDADE DE ALFABETIZAÇÃO", style);
        addInstitutionalHeader(docx, request, style);
        addTextSection(docx, "Título:", text(root, "titulo", "Atividade de alfabetização"), style);
        // Schema V2: usa 'exercicios' e 'orientacoesProfessor'; Schema legado: usa 'atividadesVisuais' e 'orientacoesGerais'
        boolean isV2 = root.path("schemaVersion").asInt(0) >= 2;
        JsonNode activities = isV2 && root.path("exercicios").isArray()
                ? root.path("exercicios")
                : root.path("atividadesVisuais");
        JsonNode notes = isV2 && root.path("orientacoesProfessor").isArray()
                ? root.path("orientacoesProfessor")
                : root.path("orientacoesGerais");
        addListSection(docx, "Orientações para o(a) Professor(a):", notes, style);
        addInitialLiteracyActivitiesSection(docx, activities, style);
    }

    private void addInitialLiteracyActivitiesSection(XWPFDocument docx, JsonNode activities, TemplateStyle style) {
        addParagraph(docx, "Atividades:", true, style);
        if (activities == null || !activities.isArray() || activities.isEmpty()) {
            addParagraph(docx, "____________________________", false, style);
            docx.createParagraph();
            return;
        }

        for (JsonNode activity : activities) {
            String number = scalarText(activity.path("numero"));
            String tipo = activity.path("tipo").asText("").toUpperCase();
            String command = valueOrLine(scalarText(activity.path("comando")));
            // Comando em caixa alta e negrito para facilitar leitura pelo professor
            addParagraph(docx, number + ". " + command.toUpperCase(), true, style);
            JsonNode items = activity.path("itens");
            if (items.isArray() && !items.isEmpty()) {
                for (JsonNode item : items) {
                    addInitialLiteracyItemV2(docx, item, tipo, style);
                }
            } else {
                addParagraph(docx, "   Figura: ____________________    Palavra: ____________________    [   ]", false, style);
            }
            // Gabarito inline para o professor
            String gabarito = activity.path("gabarito").asText("");
            if (!gabarito.isBlank()) {
                addParagraph(docx, "   \u2192 Gabarito: " + gabarito, false, style);
            }
            docx.createParagraph();
        }
    }

    /**
     * Renderiza um item de atividade de alfabetização com layout visual rico,
     * diferenciando a apresentação por tipo de exercício (schema V2).
     */
    private void addInitialLiteracyItemV2(XWPFDocument docx, JsonNode item, String tipo, TemplateStyle style) {
        // Inserir imagem gerada pelo Gemini (se disponível) antes do exercício
        insertImageFromNode(docx, item, style);

        String figure = scalarText(item.path("figura"));
        String word = scalarText(item.path("palavra"));
        String label = (figure.isBlank() ? word : figure).toUpperCase();
        if (label.isBlank()) label = "______";

        switch (tipo) {
            case "SEPARAR_SILABAS" -> {
                JsonNode silabas = item.path("silabas");
                int numSilabas = silabas.isArray() && !silabas.isEmpty()
                        ? silabas.size()
                        : Math.max(2, item.path("caixasResposta").asInt(2));
                StringBuilder silBox = new StringBuilder();
                for (int i = 0; i < numSilabas; i++) {
                    if (i > 0) silBox.append("  ");
                    silBox.append("[         ]");
                }
                addParagraph(docx, "   " + label + "   \u2192   " + silBox, false, style);
            }
            case "LETRA_INICIAL" -> {
                JsonNode options = item.path("opcoes");
                StringBuilder optLine = new StringBuilder("   " + label + "   ");
                if (options.isArray() && !options.isEmpty()) {
                    for (JsonNode opt : options) optLine.append("(   ) ").append(opt.asText()).append("   ");
                } else {
                    optLine.append("(   ) ___   (   ) ___   (   ) ___");
                }
                addParagraph(docx, optLine.toString(), false, style);
            }
            case "LIGAR_FIGURA_PALAVRA" -> {
                String wordLabel = word.isBlank() ? label : word.toUpperCase();
                addParagraph(docx, "   " + label + "   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500   " + wordLabel, false, style);
            }
            case "COMPLETAR_PALAVRA" -> {
                JsonNode options = item.path("opcoes");
                String wordDisplay = label.length() > 3
                        ? label.substring(0, 2) + "___" + label.substring(label.length() - 2)
                        : label + "___";
                StringBuilder optLine = new StringBuilder("   " + wordDisplay + "   ");
                if (options.isArray() && !options.isEmpty()) {
                    for (JsonNode opt : options) optLine.append("(   ) ").append(opt.asText()).append("   ");
                } else {
                    optLine.append("(   ) ___   (   ) ___");
                }
                addParagraph(docx, optLine.toString(), false, style);
            }
            case "CONTAR_LETRAS" -> {
                int numLetras = item.path("caixasResposta").asInt(label.replaceAll("\\s", "").length());
                addParagraph(docx, "   " + label + "   \u2192   Quantas letras tem essa palavra?   ___ letras", false, style);
            }
            case "CIRCULAR_LETRA", "CACA_LETRA" -> {
                String letraAlvo = item.path("letraAlvo").asText("");
                if (letraAlvo.isBlank() && !label.isBlank()) letraAlvo = String.valueOf(label.charAt(0));
                JsonNode letras = item.path("letras");
                StringBuilder letrasLine = new StringBuilder("   ");
                if (letras.isArray() && !letras.isEmpty()) {
                    for (JsonNode l : letras) letrasLine.append(l.asText()).append("  ");
                } else {
                    letrasLine.append(label);
                }
                addParagraph(docx, "   Circule a letra \"" + letraAlvo + "\":", false, style);
                addParagraph(docx, letrasLine.toString(), false, style);
            }
            default -> {
                // Renderização genérica para tipos não mapeados
                String boxes = responseBoxes(item);
                String line = "   " + label + (boxes.isBlank() ? "    ____________________________" : "    " + boxes);
                addParagraph(docx, line, false, style);
                JsonNode options = item.path("opcoes");
                if (options.isArray() && !options.isEmpty()) {
                    StringBuilder optionLine = new StringBuilder();
                    for (JsonNode option : options) {
                        if (optionLine.length() > 0) optionLine.append("   ");
                        optionLine.append("(   ) ").append(option.asText());
                    }
                    addParagraph(docx, optionLine.toString(), false, style);
                }
            }
        }
    }

    /**
     * Tenta inserir a imagem gerada pelo Gemini no documento DOCX.
     * Busca o asset pelo ID contido no campo 'imagemUrl' do nó JSON.
     * Se não encontrar ou falhar, não insere nada (sem emojis de fallback).
     */
    private void insertImageFromNode(XWPFDocument docx, JsonNode node, TemplateStyle style) {
        String imagemUrl = node.path("imagemUrl").asText("");
        if (imagemUrl.isBlank()) return;
        // URL format: /images/generated/{id}
        String[] parts = imagemUrl.split("/");
        if (parts.length == 0) return;
        try {
            long assetId = Long.parseLong(parts[parts.length - 1]);
            Optional<GeneratedImageAsset> assetOpt = imageAssetRepository.findById(assetId);
            if (assetOpt.isEmpty()) {
                log.warn("Image asset not found for id={}", assetId);
                return;
            }
            GeneratedImageAsset asset = assetOpt.get();
            int pictureType = asset.getMimeType().contains("png")
                    ? XWPFDocument.PICTURE_TYPE_PNG
                    : XWPFDocument.PICTURE_TYPE_JPEG;
            XWPFParagraph imgParagraph = docx.createParagraph();
            imgParagraph.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun imgRun = imgParagraph.createRun();
            imgRun.addPicture(
                    new ByteArrayInputStream(asset.getImageData()),
                    pictureType,
                    asset.getSubject(),
                    Units.toEMU(120),  // largura: 120pt (~4.2cm) - adequado para atividade infantil
                    Units.toEMU(120)   // altura: 120pt
            );
        } catch (NumberFormatException e) {
            log.warn("Invalid image asset id in imagemUrl={}", imagemUrl);
        } catch (Exception e) {
            log.warn("Failed to insert image assetUrl={} reason={}", imagemUrl, e.getMessage());
        }
    }

    private String responseBoxes(JsonNode item) {
        int boxes = item.path("caixasResposta").asInt(0);
        if (boxes <= 0) {
            boxes = item.path("caixas").asInt(0);
        }
        if (boxes <= 0) {
            return "";
        }

        StringBuilder builder = new StringBuilder();
        for (int index = 0; index < boxes; index++) {
            if (builder.length() > 0) {
                builder.append(" ");
            }
            builder.append("[   ]");
        }
        return builder.toString();
    }

    private void renderEarlyChildhoodObservationTemplate(
            XWPFDocument docx,
            JsonNode root,
            TemplateStyle style,
            GenerationRequest request
    ) {
        addTitle(docx, "ROTEIRO DE OBSERVAÇÃO E REGISTRO", style);
        addInstitutionalHeader(docx, request, style);
        addTextSection(docx, "Título da experiência:", text(root, "titulo", "Roteiro de observação"), style);
        addListSection(docx, "Orientações gerais:", root.path("orientacoesGerais"), style);
        addTextSection(docx, "Contexto da observação:", scalarText(root.path("contextoObservacao")), style);
        addObservationIndicatorsSection(docx, root.path("indicadoresObservaveis"), style);
        addTeacherRecordsSection(docx, root.path("registrosProfessor"), style);
        addListSection(docx, "Sugestões de intervenção:", root.path("sugestoesIntervencao"), style);
        addJsonSection(docx, "Adaptações inclusivas:", root.path("adaptacoesInclusivas"), style);
    }

    private void addObservationIndicatorsSection(XWPFDocument docx, JsonNode indicators, TemplateStyle style) {
        addParagraph(docx, "Indicadores observáveis:", true, style);
        if (indicators == null || !indicators.isArray() || indicators.isEmpty()) {
            addParagraph(docx, "____________________________", false, style);
            docx.createParagraph();
            return;
        }

        for (JsonNode indicator : indicators) {
            addParagraph(docx, valueOrLine(scalarText(indicator.path("indicador"))), true, style);
            addParagraph(docx, "O que observar: " + valueOrLine(scalarText(indicator.path("oQueObservar"))), false, style);
            addListSection(docx, "Possíveis registros:", indicator.path("possiveisRegistros"), style);
            addListSection(docx, "Perguntas mediadoras:", indicator.path("perguntasMediadoras"), style);
        }
    }

    private void addTeacherRecordsSection(XWPFDocument docx, JsonNode records, TemplateStyle style) {
        addParagraph(docx, "Registros do professor:", true, style);
        if (records == null || !records.isArray() || records.isEmpty()) {
            addParagraph(docx, "____________________________", false, style);
            docx.createParagraph();
            return;
        }

        for (JsonNode record : records) {
            String field = scalarText(record.path("campo"));
            String guidance = scalarText(record.path("orientacao"));
            addParagraph(docx, valueOrLine(field) + ": " + valueOrLine(guidance), false, style);
        }
        docx.createParagraph();
    }

    private void renderRubricTemplate(XWPFDocument docx, JsonNode root, TemplateStyle style, GenerationRequest request) {
        addTitle(docx, text(root, "titulo", "RUBRICA DE AVALIAÇÃO"), style);
        addInstitutionalHeader(docx, request, style);
        addTextSection(docx, "Contexto da Avaliação:", text(root, "contextoAvaliacao", ""), style);

        JsonNode criterios = root.path("criterios");
        if (criterios.isArray()) {
            for (JsonNode criterio : criterios) {
                addParagraph(docx, "Critério: " + criterio.path("nomeCriterio").asText(), true, style);
                addParagraph(docx, "Descrição: " + criterio.path("descricao").asText(), false, style);

                JsonNode niveis = criterio.path("niveisDesempenho");
                if (niveis.isArray()) {
                    for (JsonNode nivel : niveis) {
                        addParagraph(docx, "- " + nivel.path("nivel").asText() + " (" + nivel.path("pontuacao").asText() + " pts): " + nivel.path("descricao").asText(), false, style);
                    }
                }
                docx.createParagraph(); // empty line
            }
        }

        addListSection(docx, "Orientações de Uso:", root.path("orientacoesUso"), style);
        addListSection(docx, "Adaptações Inclusivas:", root.path("adaptacoesInclusivas"), style);
    }

    private void renderReportTemplate(XWPFDocument docx, JsonNode root, TemplateStyle style, GenerationRequest request) {
        addTitle(docx, text(root, "titulo", "RELATÓRIO PEDAGÓGICO"), style);
        addInstitutionalHeader(docx, request, style);
        addTextSection(docx, "Contexto da Turma:", text(root, "contextoTurma", ""), style);
        addListSection(docx, "Análise de Desenvolvimento:", root.path("analiseDesenvolvimento"), style);
        addListSection(docx, "Habilidades Trabalhadas:", root.path("habilidadesTrabalhadas"), style);
        addListSection(docx, "Desafios Identificados:", root.path("desafiosIdentificados"), style);
        addListSection(docx, "Recomendações e Próximos Passos:", root.path("recomendacoesProximosPassos"), style);
        addTextSection(docx, "Observações Finais:", text(root, "observacoesFinais", ""), style);
    }

    private void addTitle(XWPFDocument docx, String title, TemplateStyle style) {
        XWPFParagraph paragraph = docx.createParagraph();
        paragraph.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun run = paragraph.createRun();
        applyStyle(run, style, true, true);
        run.setText(title);
    }

    private void addInstitutionalHeader(XWPFDocument docx, GenerationRequest request, TemplateStyle style) {
        if (request != null && request.getIncludeHeader() != null && !request.getIncludeHeader()) {
            return;
        }
        addParagraph(docx, "Escola: __________________________", false, style);
        addParagraph(docx, "Professor(a): ____________________", false, style);
        addParagraph(docx, "Ano/Série: " + valueOrLine(request == null ? null : request.getGrade()), false, style);
        addParagraph(docx, "Disciplina: " + valueOrLine(request == null ? null : request.getSubject()), false, style);
        addParagraph(docx, "Data: ____/____/____", false, style);
        addParagraph(docx, "Duração: " + valueOrLine(request == null ? null : request.getDuration()), false, style);
        docx.createParagraph();
    }

    private void addTextSection(XWPFDocument docx, String heading, String body, TemplateStyle style) {
        addParagraph(docx, heading, true, style);
        addParagraph(docx, valueOrLine(body), false, style);
        docx.createParagraph();
    }

    private void addListSection(XWPFDocument docx, String heading, JsonNode node, TemplateStyle style) {
        addParagraph(docx, heading, true, style);
        if (node == null || node.isMissingNode() || node.isNull() || (node.isArray() && node.isEmpty())) {
            addParagraph(docx, "____________________________", false, style);
            docx.createParagraph();
            return;
        }
        if (node.isArray()) {
            for (JsonNode item : node) {
                addParagraph(docx, "- " + valueOrLine(scalarText(item)), false, style);
            }
        } else {
            addParagraph(docx, valueOrLine(scalarText(node)), false, style);
        }
        docx.createParagraph();
    }

    private void addJsonSection(XWPFDocument docx, String heading, JsonNode node, TemplateStyle style) {
        addParagraph(docx, heading, true, style);
        if (node == null || node.isMissingNode() || node.isNull()) {
            return;
        }
        if (node.isObject()) {
            node.fields().forEachRemaining(entry -> {
                addParagraph(docx, entry.getKey() + ": " + scalarText(entry.getValue()), false, style);
            });
        }
        docx.createParagraph();
    }

    private void addLessonPlanMethodologySection(XWPFDocument docx, JsonNode methodology, TemplateStyle style) {
        addParagraph(docx, "Metodologia:", true, style);
        addLessonPlanMethodologyStage(docx, "Introdução", methodology.path("introducao").isMissingNode() ? methodology.path("introduction") : methodology.path("introducao"), style);
        addLessonPlanMethodologyStage(docx, "Desenvolvimento", methodology.path("desenvolvimento").isMissingNode() ? methodology.path("development") : methodology.path("desenvolvimento"), style);
        addLessonPlanMethodologyStage(docx, "Fechamento", methodology.path("fechamento").isMissingNode() ? methodology.path("closing") : methodology.path("fechamento"), style);
        docx.createParagraph();
    }

    private void addLessonPlanMethodologyStage(XWPFDocument docx, String label, JsonNode stage, TemplateStyle style) {
        String minutes = scalarText(stage.path("durationMinutes"));
        if (minutes.isBlank()) minutes = scalarText(stage.path("tempoMinutos")); // support old schema if any
        String description = scalarText(stage.path("description"));
        if (description.isBlank()) description = scalarText(stage.path("descricao")); // support old schema if any

        if (minutes.isBlank() && description.isBlank()) {
            addParagraph(docx, label + ": ____________________________", false, style);
            return;
        }
        if (minutes.isBlank()) {
            addParagraph(docx, label + ": " + description, false, style);
            return;
        }
        if (description.isBlank()) {
            addParagraph(docx, label + ": " + minutes + " min", false, style);
            return;
        }
        addParagraph(docx, label + ": " + minutes + " min - " + description, false, style);
    }

    private void addLessonPlanEvaluationSection(XWPFDocument docx, JsonNode evaluation, TemplateStyle style) {
        addParagraph(docx, "Avaliação:", true, style);
        JsonNode criteria = evaluation.path("observableCriteria");
        if (criteria.isMissingNode()) criteria = evaluation.path("criteriosObservaveis");

        if (criteria.isArray() && !criteria.isEmpty()) {
            for (JsonNode criterion : criteria) {
                addParagraph(docx, "- " + valueOrLine(scalarText(criterion)), false, style);
            }
        } else {
            addParagraph(docx, valueOrLine(scalarText(evaluation)), false, style);
        }
        docx.createParagraph();
    }

    private void addLessonPlanEstimatedTimeSection(XWPFDocument docx, JsonNode time, TemplateStyle style) {
        addParagraph(docx, "Tempo Estimado:", true, style);
        addLessonPlanEstimatedTime(docx, "Introdução", time.path("introducao"), style);
        addLessonPlanEstimatedTime(docx, "Desenvolvimento", time.path("desenvolvimento"), style);
        addLessonPlanEstimatedTime(docx, "Fechamento", time.path("fechamento"), style);
        addLessonPlanEstimatedTime(docx, "Total", time.path("total"), style);
        docx.createParagraph();
    }

    private void addLessonPlanEstimatedTime(XWPFDocument docx, String label, JsonNode minutes, TemplateStyle style) {
        String value = scalarText(minutes);
        addParagraph(docx, label + ": " + (value.isBlank() ? "____________________________" : value + " min"), false, style);
    }

    private void renderCompleteLessonKit(XWPFDocument docx, JsonNode kit, TemplateStyle style) {
        if (kit == null || kit.isMissingNode() || kit.isNull()) {
            return;
        }
        addTitle(docx, "KIT AULA COMPLETA", style);

        JsonNode studentActivity = kit.path("studentActivity").isMissingNode() ? kit.path("atividadeAluno") : kit.path("studentActivity");
        addTextSection(docx, "Título:", scalarText(studentActivity.path("title").isMissingNode() ? studentActivity.path("titulo") : studentActivity.path("title")), style);
        addTextSection(docx, "Contexto:", scalarText(studentActivity.path("context").isMissingNode() ? studentActivity.path("contexto") : studentActivity.path("context")), style);
        addListSection(docx, "Orientações:", studentActivity.path("instructions").isMissingNode() ? studentActivity.path("orientacoes") : studentActivity.path("instructions"), style);
        addListSection(docx, "Questões:", studentActivity.path("questions").isMissingNode() ? studentActivity.path("questoes") : studentActivity.path("questions"), style);
        addTextSection(docx, "Produto esperado:", scalarText(studentActivity.path("expectedProduct").isMissingNode() ? studentActivity.path("produtoEsperado") : studentActivity.path("expectedProduct")), style);

        addParagraph(docx, "GABARITO DO PROFESSOR", true, style);
        JsonNode teacherAnswerKey = kit.path("teacherAnswerKey").isMissingNode() ? kit.path("gabaritoProfessor") : kit.path("teacherAnswerKey");
        addListSection(docx, "Respostas esperadas:", teacherAnswerKey.path("expectedAnswers").isMissingNode() ? teacherAnswerKey.path("respostasEsperadas") : teacherAnswerKey.path("expectedAnswers"), style);
        addListSection(docx, "Orientações do professor:", teacherAnswerKey.path("teacherGuidance").isMissingNode() ? teacherAnswerKey.path("orientacoesProfessor") : teacherAnswerKey.path("teacherGuidance"), style);

        addParagraph(docx, "INSTRUMENTO AVALIATIVO", true, style);
        JsonNode assessmentInstrument = kit.path("assessmentInstrument").isMissingNode() ? kit.path("instrumentoAvaliativo") : kit.path("assessmentInstrument");
        addListSection(docx, "Critérios:", assessmentInstrument.path("criteria").isMissingNode() ? assessmentInstrument.path("criterios") : assessmentInstrument.path("criteria"), style);
        addListSection(docx, "Coleta de evidências:", assessmentInstrument.path("evidenceCollection").isMissingNode() ? assessmentInstrument.path("coletaEvidencias") : assessmentInstrument.path("evidenceCollection"), style);

        addParagraph(docx, "EVIDÊNCIAS PEDAGÓGICAS", true, style);
        JsonNode pedagogicalEvidence = kit.path("pedagogicalEvidence").isMissingNode() ? kit.path("evidenciasPedagogicas") : kit.path("pedagogicalEvidence");
        addListSection(docx, "Evidências observáveis:", pedagogicalEvidence.path("observableEvidences").isMissingNode() ? pedagogicalEvidence.path("evidenciasObservaveis") : pedagogicalEvidence.path("observableEvidences"), style);
        addListSection(docx, "Registros para coordenação:", pedagogicalEvidence.path("recordsForCoordination").isMissingNode() ? pedagogicalEvidence.path("registrosParaCoordenacao") : pedagogicalEvidence.path("recordsForCoordination"), style);

        addParagraph(docx, "ADAPTAÇÕES INCLUSIVAS", true, style);
        JsonNode inclusiveAdaptations = kit.path("inclusiveAdaptations").isMissingNode() ? kit.path("adaptacoesInclusivas") : kit.path("inclusiveAdaptations");
        addListSection(docx, "Apoio de leitura:", inclusiveAdaptations.path("readingSupport").isMissingNode() ? inclusiveAdaptations.path("apoioLeitura") : inclusiveAdaptations.path("readingSupport"), style);
        addListSection(docx, "Apoio de participação:", inclusiveAdaptations.path("participationSupport").isMissingNode() ? inclusiveAdaptations.path("apoioParticipacao") : inclusiveAdaptations.path("participationSupport"), style);
        addListSection(docx, "Alternativas simplificadas:", inclusiveAdaptations.path("simplifiedAlternatives").isMissingNode() ? inclusiveAdaptations.path("alternativasSimplificadas") : inclusiveAdaptations.path("simplifiedAlternatives"), style);
    }

    private void addParagraph(XWPFDocument docx, String text, boolean bold, TemplateStyle style) {
        addParagraph(docx, text, bold, style, false);
    }

    private void addParagraph(XWPFDocument docx, String text, boolean bold, TemplateStyle style, boolean italic) {
        XWPFParagraph paragraph = docx.createParagraph();
        if (style == TemplateStyle.MINIMALIST && !bold) {
            paragraph.setSpacingAfter(100);
        } else {
            paragraph.setSpacingAfter(200);
        }
        XWPFRun run = paragraph.createRun();
        applyStyle(run, style, bold, false);
        if (italic) run.setItalic(true);
        run.setText(text);
    }

    private void applyStyle(XWPFRun run, TemplateStyle style, boolean isBold, boolean isTitle) {
        run.setBold(isBold);

        switch (style) {
            case MINIMALIST -> {
                run.setFontFamily("Calibri");
                run.setFontSize(isTitle ? 16 : (isBold ? 12 : 11));
            }
            case MODERN -> {
                run.setFontFamily("Helvetica");
                run.setFontSize(isTitle ? 18 : (isBold ? 13 : 11));
                if (isTitle) run.setColor("2C3E50");
            }
            case INSTITUTIONAL -> {
                run.setFontFamily("Arial");
                run.setFontSize(isTitle ? 14 : 12);
                if (isTitle) run.setCapitalized(true);
            }
        }
    }

    private String text(JsonNode root, String primary, String fallback) {
        String value = root.path(primary).asText(null);
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value;
    }

    private String scalarText(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return "";
        }
        if (node.isTextual() || node.isNumber() || node.isBoolean()) {
            return node.asText();
        }
        return "";
    }

    private String valueOrLine(String value) {
        return value == null || value.isBlank() ? "____________________________" : value.trim();
    }
}
