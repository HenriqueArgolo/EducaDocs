package br.com.edudocsai.service.lessonplan;

import br.com.edudocsai.dto.document.GenerateDocumentRequest;
import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.GenerationRequest;
import br.com.edudocsai.entity.Role;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.AiProviderException;
import br.com.edudocsai.repository.DocumentRepository;
import br.com.edudocsai.repository.GenerationRequestRepository;
import br.com.edudocsai.service.AIService;
import br.com.edudocsai.service.BNCCService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
        verify(generationRequestRepository).save(any(GenerationRequest.class));
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

    private LessonPlanGenerationService service() {
        ObjectMapper objectMapper = new ObjectMapper();
        return new LessonPlanGenerationService(
                new LessonPlanRequestValidator(),
                bnccService,
                new BnccCompatibilityValidator(),
                new LessonPlanPromptBuilder(),
                aiService,
                new LessonPlanAiParser(objectMapper),
                new TemplateValidator(),
                new TopicAlignmentValidator(),
                new QualityValidator(),
                new LessonPlanAssembler(objectMapper),
                generationRequestRepository,
                documentRepository
        );
    }

    private GenerateDocumentRequest request() {
        return new GenerateDocumentRequest(
                DocumentType.LESSON_PLAN,
                List.of(1L),
                "Fracoes equivalentes",
                "5 ano",
                "Matematica",
                "50 minutos",
                null
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
                  "evaluation": {"observableCriteria": ["Identifica fracoes equivalentes", "Compara representacoes fracionarias", "Registra estrategias de resolucao"]}
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
                  "evaluation": {"observableCriteria": ["Identifica causas historicas", "Compara grupos sociais", "Registra conclusoes sobre fontes"]}
                }
                """;
    }
}
