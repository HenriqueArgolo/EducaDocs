package br.com.edudocsai.service;

import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.GenerationRequest;
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
        DocumentGeneratorService service = new DocumentGeneratorService(new ObjectMapper(), null);

        byte[] result = service.generateDocx(document);

        assertThat(result).isNotEmpty();
        assertThat(new String(result, 0, 2)).isEqualTo("PK");
        assertThat(extractText(result))
                .contains("PLANO DE AULA")
                .contains("Escola: __________________________")
                .contains("Objetivos de Aprendizagem:")
                .contains("Conteúdo:")
                .contains("Avaliação:");
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
        DocumentGeneratorService service = new DocumentGeneratorService(new ObjectMapper(), null);

        String text = extractText(service.generateDocx(document));
        List<String> lines = text.lines().toList();

        assertThat(text)
                .contains("PLANO DE AULA")
                .contains("Tema:")
                .contains("Fracoes equivalentes")
                .contains("Objetivos de Aprendizagem:")
                .contains("Conteúdo:")
                .contains("Metodologia:")
                .contains("Recursos Didáticos:")
                .contains("Avaliação:")
                .contains("Tempo Estimado:")
                .contains("Introdução: 10 min - Ativar conhecimentos previos")
                .contains("Desenvolvimento: 30 min - Resolver atividade em duplas")
                .contains("Fechamento: 10 min - Sistematizar aprendizagens")
                .contains("Total: 50 min");
        assertThat(lines)
                .contains("Introdução: 10 min")
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
        DocumentGeneratorService service = new DocumentGeneratorService(new ObjectMapper(), null);

        String text = extractText(service.generateDocx(document));

        assertThat(text)
                .contains("PLANO DE AULA")
                .contains("Tema:")
                .contains("KIT AULA COMPLETA")
                .contains("Título:")
                .contains("Linha do tempo das fracoes")
                .contains("GABARITO DO PROFESSOR")
                .contains("INSTRUMENTO AVALIATIVO")
                .contains("EVIDÊNCIAS PEDAGÓGICAS")
                .contains("ADAPTAÇÕES INCLUSIVAS")
                .doesNotContain("http://")
                .doesNotContain("https://")
                .doesNotContain("question_number")
                .doesNotContain("tempo_sugerido")
                .doesNotContain("kitAulaCompleta")
                .doesNotContain("codigo");
    }

    @Test
    void generateDocxRendersEarlyChildhoodObservationWithoutFormalQuestions() {
        Document document = Document.builder()
                .id(3L)
                .type(DocumentType.EXAM)
                .title("Explorando as Cores da Natureza")
                .generationRequest(GenerationRequest.builder()
                        .grade("Crianças pequenas")
                        .subject("Traços, sons, cores e formas")
                        .duration("30 minutos")
                        .includeHeader(true)
                        .build())
                .content("""
                        {
                          "titulo": "Explorando as Cores da Natureza",
                          "tipoAvaliacao": "OBSERVACAO_INFANTIL",
                          "orientacoesGerais": ["Disponha elementos naturais coloridos para livre exploração."],
                          "contextoObservacao": "Observe as crianças durante uma proposta de exploração de cores no jardim.",
                          "indicadoresObservaveis": [
                            {
                              "indicador": "Exploração de cores",
                              "oQueObservar": "A criança observa, aponta, escolhe ou nomeia cores presentes em elementos naturais.",
                              "possiveisRegistros": ["Apontou uma flor vermelha", "Separou folhas verdes"],
                              "perguntasMediadoras": ["Que cor você encontrou?", "Onde mais vemos essa cor?"]
                            }
                          ],
                          "registrosProfessor": [
                            {
                              "campo": "Falas e gestos observados",
                              "orientacao": "Registre palavras, gestos, escolhas e interações sem exigir resposta escrita."
                            }
                          ],
                          "sugestoesIntervencao": ["Ofereça objetos reais e tempo para exploração sensorial."],
                          "adaptacoesInclusivas": {
                            "participacao": "Permita respostas por gesto, olhar, escolha de objeto ou fala espontânea."
                          }
                        }
                        """)
                .build();
        DocumentGeneratorService service = new DocumentGeneratorService(new ObjectMapper(), null);

        String text = extractText(service.generateDocx(document));

        assertThat(text)
                .contains("ROTEIRO DE OBSERVAÇÃO E REGISTRO")
                .contains("Contexto da observação:")
                .contains("Indicadores observáveis:")
                .contains("Exploração de cores")
                .contains("Registros do professor:")
                .contains("sem exigir resposta escrita")
                .doesNotContain("Questão 1")
                .doesNotContain("GABARITO DO PROFESSOR")
                .doesNotContain("Dificuldade:");
    }

    @Test
    void generateDocxRendersInitialLiteracyActivityWithoutTeacherAnswerKey() {
        Document document = Document.builder()
                .id(4L)
                .type(DocumentType.EXAM)
                .title("Separando Sílabas")
                .generationRequest(GenerationRequest.builder()
                        .grade("1º ano")
                        .subject("Língua Portuguesa")
                        .duration("40 minutos")
                        .includeHeader(true)
                        .build())
                .content("""
                        {
                          "titulo": "Separando Sílabas",
                          "tipoAvaliacao": "ALFABETIZACAO_INICIAL",
                          "orientacoesGerais": ["Professor(a), leia cada comando em voz alta."],
                          "atividadesVisuais": [
                            {
                              "numero": 1,
                              "tipo": "SEPARAR_SILABAS",
                              "comando": "Separe as sílabas.",
                              "itens": [
                                {"palavra": "BOLO", "figura": "bolo", "caixasResposta": 2},
                                {"palavra": "MALA", "figura": "mala", "caixasResposta": 2}
                              ],
                              "gabarito": "BO-LO; MA-LA"
                            },
                            {
                              "numero": 2,
                              "tipo": "LETRA_INICIAL",
                              "comando": "Pinte a letra inicial.",
                              "itens": [
                                {"palavra": "SAPO", "figura": "sapo", "opcoes": ["S", "P", "O"], "resposta": "S"}
                              ],
                              "gabarito": "S"
                            }
                          ],
                          "gabaritoProfessor": [
                            {"numeroAtividade": 1, "resposta": "BO-LO; MA-LA"},
                            {"numeroAtividade": 2, "resposta": "S"}
                          ]
                        }
                        """)
                .build();
        DocumentGeneratorService service = new DocumentGeneratorService(new ObjectMapper(), null);

        String text = extractText(service.generateDocx(document));

        assertThat(text)
                .contains("ATIVIDADE DE ALFABETIZAÇÃO")
                .contains("Separando Sílabas")
                .contains("SEPARE AS SÍLABAS.")
                .contains("BOLO")
                .contains("MALA")
                .contains("[         ]")
                .contains("PINTE A LETRA INICIAL.")
                .contains("(   ) S");
        assertThat(text)
                .doesNotContain("Questão 1")
                .doesNotContain("GABARITO DO PROFESSOR")
                .doesNotContain("Dificuldade:");
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
