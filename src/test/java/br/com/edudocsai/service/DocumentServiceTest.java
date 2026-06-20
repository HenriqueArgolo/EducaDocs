package br.com.edudocsai.service;

import br.com.edudocsai.dto.document.DocumentResponse;
import br.com.edudocsai.dto.document.GenerateDocumentRequest;
import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.GenerationRequest;
import br.com.edudocsai.entity.Role;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.RateLimitException;
import br.com.edudocsai.repository.DocumentRepository;
import br.com.edudocsai.repository.GenerationRequestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private BNCCService bnccService;
    @Mock
    private UsageLimitService usageLimitService;
    @Mock
    private PromptTemplateService promptTemplateService;
    @Mock
    private AIService aiService;
    @Mock
    private DocumentGeneratorService documentGeneratorService;
    @Mock
    private GenerationRequestRepository generationRequestRepository;
    @Mock
    private DocumentRepository documentRepository;

    @InjectMocks
    private DocumentService documentService;

    @Test
    void generateValidatesBnccCallsAiAndPersistsDocument() {
        User user = user();
        GenerateDocumentRequest request = request();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(bnccService.validateAndLoad(List.of(1L))).thenReturn(List.of(skill()));
        when(promptTemplateService.buildPrompt(eq(DocumentType.LESSON_PLAN), anyList(), eq("Fracoes"), eq("50 minutos"), isNull()))
                .thenReturn("prompt");
        when(aiService.generate(DocumentType.LESSON_PLAN, "prompt"))
                .thenReturn(new AiGeneratedDocument("Plano de aula", "{\"titulo\":\"Plano de aula\",\"tipo\":\"LESSON_PLAN\"}"));
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

        DocumentResponse result = documentService.generate(request);

        assertThat(result.id()).isEqualTo(99L);
        assertThat(result.title()).isEqualTo("Plano de aula");
        verify(usageLimitService).increment(user);
    }

    @Test
    void generateStopsBeforeAiWhenDailyLimitIsReached() {
        User user = user();
        GenerateDocumentRequest request = request();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        doThrow(new RateLimitException("Limite diario de geracoes atingido"))
                .when(usageLimitService)
                .assertCanGenerate(user);

        assertThatThrownBy(() -> documentService.generate(request))
                .isInstanceOf(RateLimitException.class);

        verify(aiService, never()).generate(any(), any());
        verify(documentRepository, never()).save(any());
    }

    private GenerateDocumentRequest request() {
        return new GenerateDocumentRequest(DocumentType.LESSON_PLAN, List.of(1L), "Fracoes", "50 minutos", null);
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
                .description("Descricao")
                .subject("Matematica")
                .grade("5 ano")
                .build();
    }
}
