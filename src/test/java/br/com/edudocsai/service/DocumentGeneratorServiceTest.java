package br.com.edudocsai.service;

import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class DocumentGeneratorServiceTest {

    @Test
    void generateDocxReturnsOfficeOpenXmlBytes() {
        Document document = Document.builder()
                .id(1L)
                .type(DocumentType.LESSON_PLAN)
                .title("Plano de aula")
                .content("""
                        {
                          "title": "Plano de aula",
                          "objective": "Compreender fracoes equivalentes.",
                          "bncc_alignment": ["EF05MA03 - Identificar fracoes."],
                          "methodology": "Introducao, desenvolvimento, aplicacao e fechamento.",
                          "activities": ["Exploracao inicial", "Atividade em grupo"],
                          "resources": ["Quadro", "Exercicios impressos"],
                          "assessment": "Avaliacao formativa por observacao.",
                          "detailed_content": "Conteudo pronto para aplicacao.",
                          "teacher_notes": "Observar participacao."
                        }
                        """)
                .build();
        DocumentGeneratorService service = new DocumentGeneratorService(new ObjectMapper());

        byte[] result = service.generateDocx(document);

        assertThat(result).isNotEmpty();
        assertThat(new String(result, 0, 2)).isEqualTo("PK");
        assertThat(extractText(result))
                .contains("PLANO DE AULA")
                .contains("Escola: __________________________")
                .contains("1. OBJETIVO DA AULA")
                .contains("2. HABILIDADES BNCC")
                .contains("6. AVALIACAO");
    }

    private String extractText(byte[] docxBytes) {
        try (XWPFDocument docx = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            return docx.getParagraphs()
                    .stream()
                    .map(paragraph -> paragraph.getText())
                    .collect(Collectors.joining("\n"));
        } catch (Exception exception) {
            throw new AssertionError("Nao foi possivel ler DOCX gerado", exception);
        }
    }
}
