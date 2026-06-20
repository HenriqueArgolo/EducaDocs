package br.com.edudocsai.service;

import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DocumentGeneratorServiceTest {

    @Test
    void generateDocxReturnsOfficeOpenXmlBytes() {
        Document document = Document.builder()
                .id(1L)
                .type(DocumentType.LESSON_PLAN)
                .title("Plano de aula")
                .content("{\"titulo\":\"Plano de aula\",\"tipo\":\"LESSON_PLAN\",\"conteudo\":{\"objetivos\":[\"Aprender fracoes\"]}}")
                .build();
        DocumentGeneratorService service = new DocumentGeneratorService(new ObjectMapper());

        byte[] result = service.generateDocx(document);

        assertThat(result).isNotEmpty();
        assertThat(new String(result, 0, 2)).isEqualTo("PK");
    }
}
