package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.dto.document.GenerateDocumentRequest;
import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.GenerationRequest;
import br.com.edudocsai.entity.PlanningPeriod;
import br.com.edudocsai.entity.Role;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.AiProviderException;
import br.com.edudocsai.repository.DocumentRepository;
import br.com.edudocsai.repository.GenerationRequestRepository;
import br.com.edudocsai.service.AIService;
import br.com.edudocsai.service.BNCCService;
import br.com.edudocsai.service.PromptBuilderHelper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LessonPlanGenerationServiceTest {

    @Mock
    private BNCCService bnccService;
    @Mock
    private AIService aiService;
    @Mock
    private GenerationRequestRepository generationRequestRepository;
    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private br.com.edudocsai.repository.StudentRepository studentRepository;
    @Mock
    private br.com.edudocsai.repository.ClassroomTimelineItemRepository classroomTimelineItemRepository;

    @Test
    void regeneratesAfterInvalidTopicOutputAndSavesOnlyValidLessonPlan() {
        LessonPlanGenerationService service = service();
        when(bnccService.validateAndLoad(List.of(1L))).thenReturn(List.of(skill()));
        when(aiService.generateJsonObject(any()))
                .thenReturn(unrelatedJson())
                .thenReturn(validJson());
        when(generationRequestRepository.save(any(GenerationRequest.class))).thenAnswer(invocation -> {
            GenerationRequest entity = invocation.getArgument(0);
            entity.setId(10L);
            return entity;
        });
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
            Document entity = invocation.getArgument(0);
            entity.setId(99L);
            entity.setCreatedAt(OffsetDateTime.now());
            return entity;
        });

        Document result = service.generate(user(), request());

        assertThat(result.getTitle()).isEqualTo("Plano de aula - Fracoes equivalentes");
        assertThat(result.getContent()).contains("\"tema\" : \"Fracoes equivalentes\"");
        verify(aiService, org.mockito.Mockito.times(2)).generateJsonObject(any());
        ArgumentCaptor<GenerationRequest> requestCaptor = ArgumentCaptor.forClass(GenerationRequest.class);
        verify(generationRequestRepository).save(requestCaptor.capture());
        assertThat(requestCaptor.getValue().getPlanningPeriod()).isEqualTo(PlanningPeriod.SINGLE);
        assertThat(requestCaptor.getValue().getIncludeHeader()).isFalse();
        verify(documentRepository).save(any(Document.class));
    }

    @Test
    void failsWithoutSavingWhenAllAttemptsAreInvalid() {
        LessonPlanGenerationService service = service();
        when(bnccService.validateAndLoad(List.of(1L))).thenReturn(List.of(skill()));
        when(aiService.generateJsonObject(any())).thenReturn(unrelatedJson());

        assertThatThrownBy(() -> service.generate(user(), request()))
                .isInstanceOf(AiProviderException.class);

        verify(aiService, org.mockito.Mockito.times(3)).generateJsonObject(any());
        verify(generationRequestRepository, never()).save(any());
        verify(documentRepository, never()).save(any());
    }

    @Test
    void regeneratesWhenCompleteLessonKitIsMissing() {
        LessonPlanGenerationService service = service();
        when(bnccService.validateAndLoad(List.of(1L))).thenReturn(List.of(skill()));
        when(aiService.generateJsonObject(any()))
                .thenReturn(validJsonWithoutKit())
                .thenReturn(validJson());
        when(generationRequestRepository.save(any(GenerationRequest.class))).thenAnswer(invocation -> {
            GenerationRequest entity = invocation.getArgument(0);
            entity.setId(10L);
            return entity;
        });
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
            Document entity = invocation.getArgument(0);
            entity.setId(99L);
            entity.setCreatedAt(OffsetDateTime.now());
            return entity;
        });

        Document result = service.generate(user(), request());

        assertThat(result.getContent()).contains("\"kitAulaCompleta\"");
        verify(aiService, org.mockito.Mockito.times(2)).generateJsonObject(any());
    }

    @Test
    void propagatesPersistenceFailureWithoutRetryingAiGeneration() {
        LessonPlanGenerationService service = service();
        RuntimeException persistenceFailure = new RuntimeException("database unavailable");
        when(bnccService.validateAndLoad(List.of(1L))).thenReturn(List.of(skill()));
        when(aiService.generateJsonObject(any())).thenReturn(validJson());
        when(generationRequestRepository.save(any(GenerationRequest.class))).thenThrow(persistenceFailure);

        assertThatThrownBy(() -> service.generate(user(), request()))
                .isSameAs(persistenceFailure)
                .isNotInstanceOf(AiProviderException.class);

        verify(aiService).generateJsonObject(any());
        verify(documentRepository, never()).save(any());
    }

    @Test
    void generatesWeeklyPlanWithoutRequiringSingleLessonMethodology() {
        LessonPlanGenerationService service = service();
        when(bnccService.validateAndLoad(List.of(1L))).thenReturn(List.of(skill()));
        when(aiService.generateJsonObject(any())).thenReturn(weeklyJson());
        when(generationRequestRepository.save(any(GenerationRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Document result = service.generate(user(), request(PlanningPeriod.WEEKLY));

        assertThat(result.getContent()).contains("\"planoSemanal\"");
        ArgumentCaptor<GenerationRequest> requestCaptor = ArgumentCaptor.forClass(GenerationRequest.class);
        verify(generationRequestRepository).save(requestCaptor.capture());
        assertThat(requestCaptor.getValue().getPlanningPeriod()).isEqualTo(PlanningPeriod.WEEKLY);
        assertThat(requestCaptor.getValue().getIncludeHeader()).isFalse();
    }

    private LessonPlanGenerationService service() {
        ObjectMapper objectMapper = new ObjectMapper();
        return new LessonPlanGenerationService(
                new LessonPlanRequestValidator(),
                bnccService,
                new BnccCompatibilityValidator(),
                new LessonPlanPromptBuilder(new PromptBuilderHelper(), studentRepository),
                aiService,
                new LessonPlanAiParser(objectMapper),
                new TemplateValidator(),
                new TopicAlignmentValidator(),
                new QualityValidator(),
                new LessonPlanAssembler(objectMapper),
                generationRequestRepository,
                documentRepository,
                studentRepository,
                classroomTimelineItemRepository
        );
    }

    private GenerateDocumentRequest request() {
        return request(PlanningPeriod.SINGLE);
    }

    private GenerateDocumentRequest request(PlanningPeriod planningPeriod) {
        return new GenerateDocumentRequest(
                DocumentType.LESSON_PLAN,
                List.of(1L),
                "Fracoes equivalentes",
                "5 ano",
                "Matematica",
                "50 minutos",
                null,
                br.com.edudocsai.entity.TemplateStyle.INSTITUTIONAL,
                0,
                false,
                null,
                null,
                planningPeriod
        );
    }

    private User user() {
        return User.builder()
                .id(7L)
                .name("Maria")
                .email("maria@escola.com")
                .password("hash")
                .role(Role.TEACHER)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    private BNCCSkill skill() {
        return BNCCSkill.builder()
                .id(1L)
                .code("EF05MA03")
                .description("Identificar fracoes equivalentes")
                .subject("Matematica")
                .grade("5 ano")
                .build();
    }

    private String validJson() {
        return """
                {
                  "objectives": ["Identificar fracoes equivalentes", "Comparar representacoes fracionarias", "Resolver situacoes-problema com fracoes"],
                  "contents": ["Representacao de fracoes", "Equivalencia entre fracoes", "Resolucao de problemas com fracoes equivalentes"],
                  "methodology": {
                    "introduction": {"durationMinutes": 10, "description": "Ativar conhecimentos previos sobre fracoes equivalentes"},
                    "development": {"durationMinutes": 30, "description": "Resolver atividade em duplas comparando fracoes equivalentes"},
                    "closing": {"durationMinutes": 10, "description": "Sistematizar aprendizagens sobre fracoes equivalentes"}
                  },
                  "resources": ["Quadro branco", "Cartoes de fracoes", "Caderno"],
                  "evaluation": {"observableCriteria": ["Identifica fracoes equivalentes", "Compara representacoes fracionarias", "Registra estrategias de resolucao"]},
                  "kit": {
                    "studentActivity": {
                      "title": "Linha do tempo das fracoes",
                      "context": "Organizar representacoes de fracoes para explicar equivalencias.",
                      "instructions": ["Leia cada cartao de fracao", "Agrupe representacoes equivalentes", "Explique uma equivalencia encontrada"],
                      "questions": ["Quais fracoes representam a mesma parte?", "Como voce percebeu a equivalencia?", "Que estrategia ajudou na comparacao?"],
                      "expectedProduct": "Registro com grupos de fracoes equivalentes"
                    },
                    "teacherAnswerKey": {
                      "expectedAnswers": ["Fracoes equivalentes representam a mesma quantidade", "A comparacao deve usar desenho ou proporcionalidade", "A justificativa precisa explicar a relacao entre as fracoes"],
                      "teacherGuidance": ["Valorizar estrategias visuais", "Pedir justificativas orais"]
                    },
                    "assessmentInstrument": {
                      "criteria": ["Identifica fracoes equivalentes", "Compara representacoes fracionarias", "Registra justificativas matematicas"],
                      "evidenceCollection": ["Recolher registros no caderno", "Anotar justificativas orais"]
                    },
                    "pedagogicalEvidence": {
                      "observableEvidences": ["Agrupamento correto de cartoes", "Uso de justificativas matematicas", "Participacao na discussao em grupo"],
                      "recordsForCoordination": ["Foto dos agrupamentos", "Amostra dos registros"]
                    },
                    "inclusiveAdaptations": {
                      "readingSupport": ["Cartoes com fonte ampliada", "Leitura compartilhada"],
                      "participationSupport": ["Explicacao oral em dupla", "Papeis simples no grupo"],
                      "simplifiedAlternatives": ["Menos cartoes", "Desenhos junto das fracoes"]
                    }
                  }
                }
                """;
    }

    private String unrelatedJson() {
        return """
                {
                  "objectives": ["Identificar causas politicas", "Comparar grupos sociais", "Resolver atividade sobre fontes historicas"],
                  "contents": ["Antigo Regime", "Queda da Bastilha", "Declaracao dos Direitos do Homem"],
                  "methodology": {
                    "introduction": {"durationMinutes": 10, "description": "Ativar conhecimentos previos sobre a Revolucao Francesa"},
                    "development": {"durationMinutes": 30, "description": "Resolver atividade em duplas analisando documentos da Revolucao Francesa"},
                    "closing": {"durationMinutes": 10, "description": "Sistematizar aprendizagens sobre transformacoes politicas"}
                  },
                  "resources": ["Mapa da Europa", "Linha do tempo", "Texto historico"],
                  "evaluation": {"observableCriteria": ["Identifica causas historicas", "Compara grupos sociais", "Registra conclusoes sobre fontes"]},
                  "kit": {
                    "studentActivity": {
                      "title": "Linha do tempo da Revolucao Francesa",
                      "context": "Organizar acontecimentos da Revolucao Francesa para compreender mudancas politicas.",
                      "instructions": ["Leia cada cartao historico", "Ordene os acontecimentos", "Explique uma mudanca politica"],
                      "questions": ["Qual acontecimento veio primeiro?", "Que grupo social aparece no texto?", "Que mudanca politica foi registrada?"],
                      "expectedProduct": "Painel sobre a Revolucao Francesa"
                    },
                    "teacherAnswerKey": {
                      "expectedAnswers": ["A queda da Bastilha marca uma ruptura politica", "Os grupos sociais tinham interesses diferentes", "A declaracao apresenta direitos defendidos no periodo"],
                      "teacherGuidance": ["Valorizar leitura de fontes", "Pedir justificativas historicas"]
                    },
                    "assessmentInstrument": {
                      "criteria": ["Identifica causas historicas", "Compara grupos sociais", "Registra conclusoes sobre fontes"],
                      "evidenceCollection": ["Guardar painel historico", "Anotar falas dos grupos"]
                    },
                    "pedagogicalEvidence": {
                      "observableEvidences": ["Discussao sobre fontes", "Organizacao dos acontecimentos", "Apresentacao oral"],
                      "recordsForCoordination": ["Painel produzido", "Anotacoes do professor"]
                    },
                    "inclusiveAdaptations": {
                      "readingSupport": ["Textos com frases curtas", "Leitura em dupla"],
                      "participationSupport": ["Resposta oral", "Papeis no grupo"],
                      "simplifiedAlternatives": ["Menos cartoes", "Imagens historicas"]
                    }
                  }
                }
                """;
    }

    private String validJsonWithoutKit() {
        return """
                {
                  "objectives": ["Identificar fracoes equivalentes", "Comparar representacoes fracionarias", "Resolver situacoes-problema com fracoes"],
                  "contents": ["Representacao de fracoes", "Equivalencia entre fracoes", "Resolucao de problemas com fracoes equivalentes"],
                  "methodology": {
                    "introduction": {"durationMinutes": 10, "description": "Ativar conhecimentos previos sobre fracoes equivalentes"},
                    "development": {"durationMinutes": 30, "description": "Resolver atividade em duplas comparando fracoes equivalentes"},
                    "closing": {"durationMinutes": 10, "description": "Sistematizar aprendizagens sobre fracoes equivalentes"}
                  },
                  "resources": ["Quadro branco", "Cartoes de fracoes", "Caderno"],
                  "evaluation": {"observableCriteria": ["Identifica fracoes equivalentes", "Compara representacoes fracionarias", "Registra estrategias de resolucao"]}
                }
                """;
    }

    private String weeklyJson() {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            ObjectNode root = (ObjectNode) objectMapper.readTree(validJson());
            root.remove("methodology");
            var weeklyPlan = root.putArray("weeklyPlan");
            for (String day : List.of("Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira")) {
                weeklyPlan.addObject()
                        .put("day", day)
                        .put("focus", "Fracoes equivalentes")
                        .put("activities", "Resolver e comparar fracoes equivalentes em dupla")
                        .put("assessment", "Registrar estrategias sobre fracoes equivalentes");
            }
            return objectMapper.writeValueAsString(root);
        } catch (Exception exception) {
            throw new AssertionError("Nao foi possivel montar JSON semanal de teste", exception);
        }
    }
}
