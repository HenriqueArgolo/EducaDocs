package br.com.edudocsai.service;

import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.util.List;
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

    @Test
    void generateDocxRendersOnlyOfficialLessonPlanSections() {
        Document document = Document.builder()
                .id(1L)
                .type(DocumentType.LESSON_PLAN)
                .title("Plano de aula - Fracoes equivalentes")
                .content("""
                        {
                          "tema": "Fracoes equivalentes",
                          "disciplina": "Matematica",
                          "ano": "5 ano",
                          "habilidadesBncc": [{"codigo": "EF05MA03", "descricao": "Identificar fracoes equivalentes"}],
                          "objetivosDeAprendizagem": ["Identificar fracoes equivalentes", "Comparar representacoes fracionarias", "Resolver problemas com fracoes"],
                          "conteudo": ["Representacao de fracoes", "Equivalencia entre fracoes", "Resolucao de problemas"],
                          "metodologia": {
                            "introducao": {"tempoMinutos": 10, "descricao": "Ativar conhecimentos previos"},
                            "desenvolvimento": {"tempoMinutos": 30, "descricao": "Resolver atividade em duplas"},
                            "fechamento": {"tempoMinutos": 10, "descricao": "Sistematizar aprendizagens"}
                          },
                          "recursosDidaticos": ["Quadro branco", "Cartoes de fracoes", "Caderno"],
                          "avaliacao": {"criteriosObservaveis": ["Identifica fracoes equivalentes", "Compara representacoes", "Registra estrategias"]},
                          "tempoEstimado": {"introducao": 10, "desenvolvimento": 30, "fechamento": 10, "total": 50},
                          "teacher_notes": "Nao exportar notas internas",
                          "question_number": "Q-INT-001",
                          "stage": "draft-internal-stage"
                        }
                        """)
                .build();
        DocumentGeneratorService service = new DocumentGeneratorService(new ObjectMapper());

        String text = extractText(service.generateDocx(document));
        List<String> lines = text.lines().toList();

        assertThat(text)
                .contains("PLANO DE AULA")
                .contains("Tema:")
                .contains("Fracoes equivalentes")
                .contains("Objetivos de Aprendizagem:")
                .contains("Conteudo:")
                .contains("Metodologia:")
                .contains("Recursos Didaticos:")
                .contains("Avaliacao:")
                .contains("Tempo Estimado:")
                .contains("Introducao: 10 min - Ativar conhecimentos previos")
                .contains("Desenvolvimento: 30 min - Resolver atividade em duplas")
                .contains("Fechamento: 10 min - Sistematizar aprendizagens")
                .contains("Total: 50 min");
        assertThat(lines)
                .contains("Introducao: 10 min")
                .contains("Desenvolvimento: 30 min")
                .contains("Fechamento: 10 min")
                .contains("Total: 50 min");
        assertThat(text)
                .doesNotContain("HABILIDADES BNCC")
                .doesNotContain("ATIVIDADES DETALHADAS")
                .doesNotContain("OBSERVACOES DO PROFESSOR")
                .doesNotContain("Matematica")
                .doesNotContain("5 ano")
                .doesNotContain("EF05MA03")
                .doesNotContain("codigo")
                .doesNotContain("descricao")
                .doesNotContain("teacher_notes")
                .doesNotContain("Nao exportar notas internas")
                .doesNotContain("question_number")
                .doesNotContain("Q-INT-001")
                .doesNotContain("stage")
                .doesNotContain("draft-internal-stage");
    }

    @Test
    void generateDocxRendersLessonPlanAndCompleteKit() {
        Document document = Document.builder()
                .id(2L)
                .type(DocumentType.LESSON_PLAN)
                .title("Plano de aula - Fracoes equivalentes")
                .content("""
                        {
                          "tema": "Fracoes equivalentes",
                          "disciplina": "Matematica",
                          "ano": "5 ano",
                          "habilidadesBncc": [{"codigo": "EF05MA03", "descricao": "Identificar fracoes equivalentes"}],
                          "objetivosDeAprendizagem": ["Identificar fracoes equivalentes", "Comparar representacoes fracionarias", "Resolver problemas com fracoes"],
                          "conteudo": ["Representacao de fracoes", "Equivalencia entre fracoes", "Resolucao de problemas"],
                          "metodologia": {
                            "introducao": {"tempoMinutos": 10, "descricao": "Ativar conhecimentos previos"},
                            "desenvolvimento": {"tempoMinutos": 30, "descricao": "Resolver atividade em duplas"},
                            "fechamento": {"tempoMinutos": 10, "descricao": "Sistematizar aprendizagens"}
                          },
                          "recursosDidaticos": ["Quadro branco", "Cartoes de fracoes", "Caderno"],
                          "avaliacao": {"criteriosObservaveis": ["Identifica fracoes equivalentes", "Compara representacoes", "Registra estrategias"]},
                          "kitAulaCompleta": {
                            "atividadeAluno": {
                              "titulo": "Linha do tempo das fracoes",
                              "contexto": "Organizar representacoes de fracoes para explicar equivalencias.",
                              "orientacoes": ["Leia cada cartao de fracao", "Agrupe representacoes equivalentes", "Explique uma equivalencia encontrada"],
                              "questoes": ["Quais fracoes representam a mesma parte?", "Como voce percebeu a equivalencia?", "Que estrategia ajudou na comparacao?"],
                              "produtoEsperado": "Registro com grupos de fracoes equivalentes"
                            },
                            "gabaritoProfessor": {
                              "respostasEsperadas": ["Fracoes equivalentes representam a mesma quantidade", "A comparacao deve usar desenho ou proporcionalidade", "A justificativa precisa explicar a relacao entre as fracoes"],
                              "orientacoesProfessor": ["Valorizar estrategias visuais", "Pedir justificativas orais"]
                            },
                            "instrumentoAvaliativo": {
                              "criterios": ["Identifica fracoes equivalentes", "Compara representacoes fracionarias", "Registra justificativas matematicas"],
                              "coletaEvidencias": ["Recolher registros no caderno", "Anotar justificativas orais"]
                            },
                            "evidenciasPedagogicas": {
                              "evidenciasObservaveis": ["Agrupamento correto de cartoes", "Uso de justificativas matematicas", "Participacao na discussao em grupo"],
                              "registrosParaCoordenacao": ["Foto dos agrupamentos", "Amostra dos registros"]
                            },
                            "adaptacoesInclusivas": {
                              "apoioLeitura": ["Cartoes com fonte ampliada", "Leitura compartilhada"],
                              "apoioParticipacao": ["Explicacao oral em dupla", "Papeis simples no grupo"],
                              "alternativasSimplificadas": ["Menos cartoes", "Desenhos junto das fracoes"]
                            }
                          },
                          "tempoEstimado": {"introducao": 10, "desenvolvimento": 30, "fechamento": 10, "total": 50}
                        }
                        """)
                .build();
        DocumentGeneratorService service = new DocumentGeneratorService(new ObjectMapper());

        String text = extractText(service.generateDocx(document));

        assertThat(text)
                .contains("PLANO DE AULA")
                .contains("Tema:")
                .contains("ATIVIDADE DO ALUNO")
                .contains("Linha do tempo das fracoes")
                .contains("GABARITO DO PROFESSOR")
                .contains("INSTRUMENTO AVALIATIVO")
                .contains("EVIDENCIAS PEDAGOGICAS")
                .contains("ADAPTACOES INCLUSIVAS")
                .doesNotContain("http://")
                .doesNotContain("https://")
                .doesNotContain("question_number")
                .doesNotContain("tempo_sugerido")
                .doesNotContain("kitAulaCompleta")
                .doesNotContain("codigo");
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
