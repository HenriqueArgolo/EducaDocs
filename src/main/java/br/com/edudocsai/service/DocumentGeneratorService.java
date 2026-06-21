package br.com.edudocsai.service;

import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.GenerationRequest;
import br.com.edudocsai.exception.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
@RequiredArgsConstructor
public class DocumentGeneratorService {

    private final ObjectMapper objectMapper;

    public byte[] generateDocx(Document document) {
        try (org.apache.poi.xwpf.usermodel.XWPFDocument docx = new org.apache.poi.xwpf.usermodel.XWPFDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            JsonNode root = objectMapper.readTree(document.getContent());
            if (document.getType() == DocumentType.LESSON_PLAN && root.has("objetivosDeAprendizagem")) {
                renderLessonPlanTemplate(docx, root);
            } else {
                renderOfficialTemplate(docx, document, root);
            }
            docx.write(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new BadRequestException("Nao foi possivel exportar DOCX");
        }
    }

    private void renderLessonPlanTemplate(org.apache.poi.xwpf.usermodel.XWPFDocument docx, JsonNode root) {
        addTitle(docx, "PLANO DE AULA");
        addLessonPlanTextSection(docx, "Tema:", root.path("tema").asText(null));
        addLessonPlanListSection(docx, "Objetivos de Aprendizagem:", root.path("objetivosDeAprendizagem"));
        addLessonPlanListSection(docx, "Conteudo:", root.path("conteudo"));
        addLessonPlanMethodologySection(docx, root.path("metodologia"));
        addLessonPlanListSection(docx, "Recursos Didaticos:", root.path("recursosDidaticos"));
        addLessonPlanEvaluationSection(docx, root.path("avaliacao"));
        addLessonPlanEstimatedTimeSection(docx, root.path("tempoEstimado"));
        renderCompleteLessonKit(docx, root.path("kitAulaCompleta"));
    }

    private void renderOfficialTemplate(
            org.apache.poi.xwpf.usermodel.XWPFDocument docx,
            Document document,
            JsonNode root
    ) {
        addTitle(docx, officialTitle(document.getType()));
        addInstitutionalHeader(docx, document.getGenerationRequest());
        addNumberedSection(docx, "1. OBJETIVO DA AULA", text(root, "objective", "objetivo"));
        addListSection(docx, "2. HABILIDADES BNCC", root.path("bncc_alignment"), root.path("habilidadesBncc"));
        addNumberedSection(docx, "3. METODOLOGIA", text(root, "methodology", "metodologia"));
        addListSection(docx, "4. ATIVIDADES DETALHADAS", root.path("activities"), root.path("atividades"));
        addListSection(docx, "5. RECURSOS DIDATICOS", root.path("resources"), root.path("recursos"));
        addNumberedSection(docx, "6. AVALIACAO", text(root, "assessment", "avaliacao"));
        addNumberedSection(docx, "7. CONTEUDO DETALHADO", text(root, "detailed_content", "conteudoDetalhado"));
        addNumberedSection(docx, "8. OBSERVACOES DO PROFESSOR", text(root, "teacher_notes", "observacoesProfessor"));
    }

    private void addTitle(org.apache.poi.xwpf.usermodel.XWPFDocument docx, String title) {
        XWPFParagraph paragraph = docx.createParagraph();
        paragraph.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun run = paragraph.createRun();
        run.setBold(true);
        run.setFontSize(18);
        run.setText(title);
    }

    private void addInstitutionalHeader(org.apache.poi.xwpf.usermodel.XWPFDocument docx, GenerationRequest request) {
        addParagraph(docx, "Escola: __________________________", false);
        addParagraph(docx, "Professor(a): ____________________", false);
        addParagraph(docx, "Ano/Serie: " + valueOrLine(request == null ? null : request.getGrade()), false);
        addParagraph(docx, "Disciplina: " + valueOrLine(request == null ? null : request.getSubject()), false);
        addParagraph(docx, "Data: ____/____/____", false);
        addParagraph(docx, "Duracao: " + valueOrLine(request == null ? null : request.getDuration()), false);
    }

    private void addNumberedSection(org.apache.poi.xwpf.usermodel.XWPFDocument docx, String heading, String body) {
        addParagraph(docx, heading, true);
        addParagraph(docx, valueOrLine(body), false);
    }

    private void addListSection(org.apache.poi.xwpf.usermodel.XWPFDocument docx, String heading, JsonNode primary, JsonNode fallback) {
        addParagraph(docx, heading, true);
        JsonNode node = primary != null && !primary.isMissingNode() && !primary.isNull() ? primary : fallback;
        if (node == null || node.isMissingNode() || node.isNull() || (node.isArray() && node.isEmpty())) {
            addParagraph(docx, "____________________________", false);
            return;
        }
        if (node.isArray()) {
            for (JsonNode item : node) {
                addParagraph(docx, "- " + nodeText(item), false);
            }
            return;
        }
        addParagraph(docx, nodeText(node), false);
    }

    private void addLessonPlanTextSection(
            org.apache.poi.xwpf.usermodel.XWPFDocument docx,
            String heading,
            String body
    ) {
        addParagraph(docx, heading, true);
        addParagraph(docx, valueOrLine(body), false);
    }

    private void addLessonPlanListSection(
            org.apache.poi.xwpf.usermodel.XWPFDocument docx,
            String heading,
            JsonNode node
    ) {
        addParagraph(docx, heading, true);
        if (node == null || node.isMissingNode() || node.isNull() || (node.isArray() && node.isEmpty())) {
            addParagraph(docx, "____________________________", false);
            return;
        }
        if (node.isArray()) {
            for (JsonNode item : node) {
                addParagraph(docx, "- " + valueOrLine(scalarText(item)), false);
            }
            return;
        }
        addParagraph(docx, valueOrLine(scalarText(node)), false);
    }

    private void addLessonPlanMethodologySection(
            org.apache.poi.xwpf.usermodel.XWPFDocument docx,
            JsonNode methodology
    ) {
        addParagraph(docx, "Metodologia:", true);
        addLessonPlanMethodologyStage(docx, "Introducao", methodology.path("introducao"));
        addLessonPlanMethodologyStage(docx, "Desenvolvimento", methodology.path("desenvolvimento"));
        addLessonPlanMethodologyStage(docx, "Fechamento", methodology.path("fechamento"));
    }

    private void addLessonPlanMethodologyStage(
            org.apache.poi.xwpf.usermodel.XWPFDocument docx,
            String label,
            JsonNode stage
    ) {
        String minutes = scalarText(stage.path("tempoMinutos"));
        String description = scalarText(stage.path("descricao"));
        if (minutes.isBlank() && description.isBlank()) {
            addParagraph(docx, label + ": ____________________________", false);
            return;
        }
        if (minutes.isBlank()) {
            addParagraph(docx, label + ": " + description, false);
            return;
        }
        if (description.isBlank()) {
            addParagraph(docx, label + ": " + minutes + " min", false);
            return;
        }
        addParagraph(docx, label + ": " + minutes + " min - " + description, false);
    }

    private void addLessonPlanEvaluationSection(
            org.apache.poi.xwpf.usermodel.XWPFDocument docx,
            JsonNode evaluation
    ) {
        addParagraph(docx, "Avaliacao:", true);
        JsonNode criteria = evaluation.path("criteriosObservaveis");
        if (criteria.isArray() && !criteria.isEmpty()) {
            for (JsonNode criterion : criteria) {
                addParagraph(docx, "- " + valueOrLine(scalarText(criterion)), false);
            }
            return;
        }
        addParagraph(docx, valueOrLine(scalarText(evaluation)), false);
    }

    private void addLessonPlanEstimatedTimeSection(
            org.apache.poi.xwpf.usermodel.XWPFDocument docx,
            JsonNode time
    ) {
        addParagraph(docx, "Tempo Estimado:", true);
        addLessonPlanEstimatedTime(docx, "Introducao", time.path("introducao"));
        addLessonPlanEstimatedTime(docx, "Desenvolvimento", time.path("desenvolvimento"));
        addLessonPlanEstimatedTime(docx, "Fechamento", time.path("fechamento"));
        addLessonPlanEstimatedTime(docx, "Total", time.path("total"));
    }

    private void addLessonPlanEstimatedTime(
            org.apache.poi.xwpf.usermodel.XWPFDocument docx,
            String label,
            JsonNode minutes
    ) {
        String value = scalarText(minutes);
        addParagraph(docx, label + ": " + (value.isBlank() ? "____________________________" : value + " min"), false);
    }

    private void renderCompleteLessonKit(org.apache.poi.xwpf.usermodel.XWPFDocument docx, JsonNode kit) {
        if (kit == null || kit.isMissingNode() || kit.isNull()) {
            return;
        }
        addParagraph(docx, "ATIVIDADE DO ALUNO", true);
        JsonNode activity = kit.path("atividadeAluno");
        addLessonPlanTextSection(docx, "Titulo:", scalarText(activity.path("titulo")));
        addLessonPlanTextSection(docx, "Contexto:", scalarText(activity.path("contexto")));
        addLessonPlanListSection(docx, "Orientacoes:", activity.path("orientacoes"));
        addLessonPlanListSection(docx, "Questoes:", activity.path("questoes"));
        addLessonPlanTextSection(docx, "Produto esperado:", scalarText(activity.path("produtoEsperado")));

        addParagraph(docx, "GABARITO DO PROFESSOR", true);
        JsonNode answerKey = kit.path("gabaritoProfessor");
        addLessonPlanListSection(docx, "Respostas esperadas:", answerKey.path("respostasEsperadas"));
        addLessonPlanListSection(docx, "Orientacoes do professor:", answerKey.path("orientacoesProfessor"));

        addParagraph(docx, "INSTRUMENTO AVALIATIVO", true);
        JsonNode assessment = kit.path("instrumentoAvaliativo");
        addLessonPlanListSection(docx, "Criterios:", assessment.path("criterios"));
        addLessonPlanListSection(docx, "Coleta de evidencias:", assessment.path("coletaEvidencias"));

        addParagraph(docx, "EVIDENCIAS PEDAGOGICAS", true);
        JsonNode evidence = kit.path("evidenciasPedagogicas");
        addLessonPlanListSection(docx, "Evidencias observaveis:", evidence.path("evidenciasObservaveis"));
        addLessonPlanListSection(docx, "Registros para coordenacao:", evidence.path("registrosParaCoordenacao"));

        addParagraph(docx, "ADAPTACOES INCLUSIVAS", true);
        JsonNode adaptations = kit.path("adaptacoesInclusivas");
        addLessonPlanListSection(docx, "Apoio de leitura:", adaptations.path("apoioLeitura"));
        addLessonPlanListSection(docx, "Apoio de participacao:", adaptations.path("apoioParticipacao"));
        addLessonPlanListSection(docx, "Alternativas simplificadas:", adaptations.path("alternativasSimplificadas"));
    }

    private void addParagraph(org.apache.poi.xwpf.usermodel.XWPFDocument docx, String text, boolean bold) {
        XWPFParagraph paragraph = docx.createParagraph();
        XWPFRun run = paragraph.createRun();
        run.setBold(bold);
        run.setFontSize(bold ? 13 : 11);
        run.setText(text);
    }

    private String officialTitle(DocumentType type) {
        return switch (type) {
            case LESSON_PLAN -> "PLANO DE AULA";
            case EXAM -> "PROVA";
            case RUBRIC -> "RUBRICA AVALIATIVA";
            case REPORT -> "RELATORIO PEDAGOGICO";
        };
    }

    private String text(JsonNode root, String primary, String fallback) {
        String value = root.path(primary).asText(null);
        if (value == null || value.isBlank()) {
            JsonNode fallbackNode = root.path(fallback);
            if (fallbackNode.isTextual()) {
                value = fallbackNode.asText();
            } else if (!fallbackNode.isMissingNode() && !fallbackNode.isNull()) {
                value = nodeText(fallbackNode);
            }
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

    private String nodeText(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return "";
        }
        if (node.isTextual() || node.isNumber() || node.isBoolean()) {
            return node.asText();
        }
        if (node.has("code") && node.has("description")) {
            return node.path("code").asText() + " - " + node.path("description").asText();
        }
        return node.toString();
    }

    private String valueOrLine(String value) {
        return value == null || value.isBlank() ? "____________________________" : value.trim();
    }
}
