package br.com.edudocsai.service;

import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
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
import java.util.Iterator;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DocumentGeneratorService {

    private final ObjectMapper objectMapper;

    public byte[] generateDocx(Document document) {
        try (org.apache.poi.xwpf.usermodel.XWPFDocument docx = new org.apache.poi.xwpf.usermodel.XWPFDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            addTitle(docx, document.getTitle());
            addParagraph(docx, labelFor(document.getType()), true);
            JsonNode root = objectMapper.readTree(document.getContent());
            renderNode(docx, "Conteudo", root, 0);
            docx.write(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new BadRequestException("Nao foi possivel exportar DOCX");
        }
    }

    private void addTitle(org.apache.poi.xwpf.usermodel.XWPFDocument docx, String title) {
        XWPFParagraph paragraph = docx.createParagraph();
        paragraph.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun run = paragraph.createRun();
        run.setBold(true);
        run.setFontSize(18);
        run.setText(title);
    }

    private void renderNode(org.apache.poi.xwpf.usermodel.XWPFDocument docx, String label, JsonNode node, int depth) {
        if (node == null || node.isNull()) {
            return;
        }
        if (node.isObject()) {
            addParagraph(docx, humanize(label), depth <= 1);
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                renderNode(docx, field.getKey(), field.getValue(), depth + 1);
            }
            return;
        }
        if (node.isArray()) {
            addParagraph(docx, humanize(label), depth <= 1);
            for (JsonNode item : node) {
                if (item.isValueNode()) {
                    addParagraph(docx, "- " + item.asText(), false);
                } else {
                    renderNode(docx, "item", item, depth + 1);
                }
            }
            return;
        }
        addParagraph(docx, humanize(label) + ": " + node.asText(), false);
    }

    private void addParagraph(org.apache.poi.xwpf.usermodel.XWPFDocument docx, String text, boolean bold) {
        XWPFParagraph paragraph = docx.createParagraph();
        XWPFRun run = paragraph.createRun();
        run.setBold(bold);
        run.setFontSize(bold ? 13 : 11);
        run.setText(text);
    }

    private String labelFor(DocumentType type) {
        return switch (type) {
            case LESSON_PLAN -> "Plano de aula";
            case EXAM -> "Prova";
            case RUBRIC -> "Rubrica";
            case REPORT -> "Relatorio pedagogico";
        };
    }

    private String humanize(String value) {
        if (value == null || value.isBlank() || "item".equals(value)) {
            return "";
        }
        String spaced = value.replaceAll("([a-z])([A-Z])", "$1 $2").replace('_', ' ');
        return Character.toUpperCase(spaced.charAt(0)) + spaced.substring(1);
    }
}
