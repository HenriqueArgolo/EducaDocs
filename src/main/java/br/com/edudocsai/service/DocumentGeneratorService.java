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
            renderOfficialTemplate(docx, document, root);
            docx.write(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new BadRequestException("Nao foi possivel exportar DOCX");
        }
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
