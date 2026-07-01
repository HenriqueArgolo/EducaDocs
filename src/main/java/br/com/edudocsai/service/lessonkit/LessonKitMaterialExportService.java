package br.com.edudocsai.service.lessonkit;

import br.com.edudocsai.entity.LessonKitMaterialType;
import br.com.edudocsai.exception.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayOutputStream;
import java.util.Iterator;
import java.util.Map;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.stereotype.Service;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import java.util.ArrayList;
import java.util.List;

@Service
public class LessonKitMaterialExportService {
    private final ObjectMapper objectMapper;

    public LessonKitMaterialExportService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public byte[] export(String kitTitle, LessonKitMaterialType type, String content) {
        try (var document = new XWPFDocument(); var output = new ByteArrayOutputStream()) {
            addTitle(document, label(type), kitTitle);
            JsonNode root = unwrap(objectMapper.readTree(content));
            renderNode(document, root, 1);
            document.write(output);
            return output.toByteArray();
        } catch (Exception exception) {
            throw new BadRequestException("Não foi possível exportar o material: " + exception.getMessage());
        }
    }

    public byte[] exportPdf(String kitTitle, LessonKitMaterialType type, String content) {
        try (var document = new PDDocument(); var output = new ByteArrayOutputStream()) {
            List<PdfLine> lines = new ArrayList<>();
            lines.add(new PdfLine(label(type), 18, true, 0));
            lines.add(new PdfLine(kitTitle == null ? "Kit de aula" : kitTitle, 10, false, 0));
            flattenPdf(unwrap(objectMapper.readTree(content)), 0, lines);
            writePdf(document, lines);
            document.save(output);
            return output.toByteArray();
        } catch (Exception exception) {
            throw new BadRequestException("Não foi possível exportar o PDF: " + exception.getMessage());
        }
    }

    private void flattenPdf(JsonNode node, int depth, List<PdfLine> lines) {
        if (node == null || node.isNull()) return;
        if (node.isObject()) {
            node.fields().forEachRemaining(field -> {
                JsonNode value = field.getValue();
                if (value.isValueNode()) lines.add(new PdfLine(value.asText(), 11, false, depth));
                else {
                    lines.add(new PdfLine(humanLabel(field.getKey()), 13, true, depth));
                    flattenPdf(value, depth + 1, lines);
                }
            });
        } else if (node.isArray()) {
            int index = 1;
            for (JsonNode item : node) {
                if (item.isValueNode()) lines.add(new PdfLine("- " + item.asText(), 11, false, depth));
                else {
                    lines.add(new PdfLine("Item " + index++, 11, true, depth));
                    flattenPdf(item, depth + 1, lines);
                }
            }
        } else lines.add(new PdfLine(node.asText(), 11, false, depth));
    }

    private void writePdf(PDDocument document, List<PdfLine> lines) throws Exception {
        PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        PDPage page = null;
        PDPageContentStream stream = null;
        float y = 0;
        try {
            for (PdfLine line : lines) {
                for (String wrapped : wrapPdfText(line.text(), Math.max(35, 88 - line.depth() * 7))) {
                    if (stream == null || y < 60) {
                        if (stream != null) stream.close();
                        page = new PDPage(PDRectangle.A4);
                        document.addPage(page);
                        stream = new PDPageContentStream(document, page);
                        y = page.getMediaBox().getHeight() - 58;
                    }
                    stream.beginText();
                    stream.setFont(line.bold() ? bold : regular, line.size());
                    stream.setLeading(line.size() + 5);
                    stream.newLineAtOffset(54 + line.depth() * 14, y);
                    stream.showText(pdfSafe(wrapped));
                    stream.endText();
                    y -= line.size() + (line.bold() ? 10 : 7);
                }
            }
        } finally {
            if (stream != null) stream.close();
        }
    }

    private List<String> wrapPdfText(String input, int limit) {
        String text = input == null ? "" : input.trim();
        if (text.isBlank()) return List.of("");
        List<String> result = new ArrayList<>();
        StringBuilder line = new StringBuilder();
        for (String word : text.split("\\s+")) {
            if (line.length() > 0 && line.length() + word.length() + 1 > limit) {
                result.add(line.toString()); line.setLength(0);
            }
            if (line.length() > 0) line.append(' ');
            line.append(word);
        }
        if (!line.isEmpty()) result.add(line.toString());
        return result;
    }

    private String pdfSafe(String text) {
        return text.replace('–', '-').replace('—', '-').replace('•', '-').replace('“', '"').replace('”', '"');
    }

    private record PdfLine(String text, int size, boolean bold, int depth) {}

    private JsonNode unwrap(JsonNode node) {
        if (node != null && node.isObject() && node.size() == 1) {
            return node.elements().next();
        }
        return node;
    }

    private void addTitle(XWPFDocument document, String title, String subtitle) {
        XWPFParagraph heading = document.createParagraph();
        heading.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun run = heading.createRun();
        run.setText(title);
        run.setBold(true);
        run.setFontFamily("Aptos Display");
        run.setFontSize(20);
        run.setColor("312E81");
        XWPFParagraph sub = document.createParagraph();
        sub.setAlignment(ParagraphAlignment.CENTER);
        XWPFRun subRun = sub.createRun();
        subRun.setText(subtitle == null ? "Kit de aula" : subtitle);
        subRun.setFontFamily("Aptos");
        subRun.setFontSize(10);
        subRun.setColor("64748B");
    }

    private void renderNode(XWPFDocument document, JsonNode node, int level) {
        if (node == null || node.isNull()) return;
        if (node.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                var field = fields.next();
                JsonNode value = field.getValue();
                if (value.isValueNode()) {
                    addParagraph(document, value.asText(), false);
                } else {
                    addHeading(document, humanLabel(field.getKey()), level);
                    renderNode(document, value, level + 1);
                }
            }
        } else if (node.isArray()) {
            int number = 1;
            for (JsonNode item : node) {
                if (item.isValueNode()) addParagraph(document, item.asText(), true);
                else {
                    addHeading(document, "Item " + number++, level);
                    renderNode(document, item, level + 1);
                }
            }
        } else addParagraph(document, node.asText(), false);
    }

    private void addHeading(XWPFDocument document, String text, int level) {
        XWPFParagraph paragraph = document.createParagraph();
        paragraph.setSpacingBefore(level <= 2 ? 180 : 100);
        XWPFRun run = paragraph.createRun();
        run.setText(text);
        run.setBold(true);
        run.setFontFamily("Aptos");
        run.setFontSize(level <= 2 ? 13 : 11);
        run.setColor(level <= 2 ? "4338CA" : "334155");
    }

    private void addParagraph(XWPFDocument document, String text, boolean bullet) {
        if (text == null || text.isBlank()) return;
        XWPFParagraph paragraph = document.createParagraph();
        if (bullet) paragraph.setIndentationLeft(360);
        XWPFRun run = paragraph.createRun();
        run.setText((bullet ? "• " : "") + text);
        run.setFontFamily("Aptos");
        run.setFontSize(11);
        run.setColor("1E293B");
    }

    private String humanLabel(String key) {
        return switch (key) {
            case "titulo", "title" -> "Título";
            case "contexto", "context" -> "Contexto";
            case "orientacoes", "instructions" -> "Orientações";
            case "questoes", "questions" -> "Questões";
            case "enunciado", "statement" -> "Enunciado";
            case "produtoEsperado", "expectedProduct" -> "Produto esperado";
            case "respostasEsperadas" -> "Respostas esperadas";
            case "orientacoesProfessor" -> "Orientações ao professor";
            case "criterios" -> "Critérios";
            case "coletaEvidencias" -> "Coleta de evidências";
            case "evidenciasObservaveis" -> "Evidências observáveis";
            case "registrosParaCoordenacao" -> "Registros para coordenação";
            default -> key.replaceAll("([a-z])([A-Z])", "$1 $2");
        };
    }

    private String label(LessonKitMaterialType type) {
        return switch (type) {
            case LESSON_PLAN -> "PLANO DE AULA";
            case STUDENT_ACTIVITY -> "ATIVIDADE DO ALUNO";
            case TEACHER_ANSWER_KEY -> "GABARITO DO PROFESSOR";
            case ASSESSMENT -> "INSTRUMENTO AVALIATIVO";
            case PEDAGOGICAL_EVIDENCE -> "EVIDÊNCIAS PEDAGÓGICAS";
            case INCLUSIVE_ADAPTATIONS -> "ADAPTAÇÕES INCLUSIVAS";
        };
    }
}
