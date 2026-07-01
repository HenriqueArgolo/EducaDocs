package br.com.edudocsai.service.lessonkit;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.edudocsai.entity.LessonKitMaterialType;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayInputStream;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.junit.jupiter.api.Test;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.text.PDFTextStripper;

class LessonKitMaterialExportServiceTest {

    @Test
    void exportsStudentActivityAsReadableDocxInsteadOfJson() throws Exception {
        var service = new LessonKitMaterialExportService(new ObjectMapper());
        byte[] result = service.export("Frações equivalentes", LessonKitMaterialType.STUDENT_ACTIVITY,
                "{\"atividadeAluno\":{\"titulo\":\"Prática de frações\",\"orientacoes\":[\"Resolva com atenção\"],\"questoes\":[{\"enunciado\":\"Compare 1/2 e 2/4\"}]}}");

        assertThat(result).startsWith((byte) 'P', (byte) 'K');
        try (var document = new XWPFDocument(new ByteArrayInputStream(result));
             var extractor = new XWPFWordExtractor(document)) {
            assertThat(extractor.getText())
                    .contains("ATIVIDADE DO ALUNO", "Prática de frações", "Resolva com atenção", "Compare 1/2 e 2/4")
                    .doesNotContain("atividadeAluno", "orientacoes", "questoes");
        }
    }

    @Test
    void exportsStudentActivityAsARealPrintablePdf() throws Exception {
        var service = new LessonKitMaterialExportService(new ObjectMapper());
        byte[] result = service.exportPdf("Segunda Guerra Mundial", LessonKitMaterialType.STUDENT_ACTIVITY,
                "{\"atividadeAluno\":{\"titulo\":\"Análise de fontes\",\"orientacoes\":[\"Leia e responda\"],\"questoes\":[{\"enunciado\":\"Compare as fontes históricas\"}]}}");

        assertThat(result).startsWith((byte) '%', (byte) 'P', (byte) 'D', (byte) 'F');
        try (var document = Loader.loadPDF(result)) {
            assertThat(new PDFTextStripper().getText(document))
                    .contains("ATIVIDADE DO ALUNO", "Análise de fontes", "Compare as fontes históricas")
                    .doesNotContain("atividadeAluno", "questoes");
        }
    }
}
