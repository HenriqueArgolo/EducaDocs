package br.com.edudocsai.service;

import br.com.edudocsai.dto.activity.ActivityMaterialResponse;
import br.com.edudocsai.dto.activity.GenerateActivityRequest;
import br.com.edudocsai.entity.ActivityMaterial;
import br.com.edudocsai.entity.ActivityType;
import br.com.edudocsai.entity.Role;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.repository.ActivityMaterialRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityMaterialServiceTest {

    @Mock
    private ActivityMaterialRepository activityMaterialRepository;
    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private UsageLimitService usageLimitService;
    @Mock
    private AIService aiService;
    @Mock
    private ActivityImageEnricher activityImageEnricher;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @Spy
    private PromptModuleCatalog promptModuleCatalog = new PromptModuleCatalog();

    @InjectMocks
    private ActivityMaterialService activityMaterialService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .name("Professor Teste")
                .email("professor@teste.com")
                .role(Role.TEACHER)
                .createdAt(OffsetDateTime.now())
                .build();
        lenient().when(activityImageEnricher.enrich(any(String.class), any(String.class), any(String.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void generateAppendsMarcarRuleToPrompt() {
        // Arrange
        GenerateActivityRequest request = new GenerateActivityRequest(
                "Frações",
                ActivityType.WORKSHEET,
                "5º ano",
                "Matemática",
                "Usar pizza como analogia",
                "MARCAR"
        );

        when(currentUserService.getCurrentUser()).thenReturn(testUser);
        when(aiService.generateJsonObject(any(String.class))).thenReturn("{\"titulo\":\"Atividade de Frações\",\"descricao\":\"Exercícios de fixação\"}");
        when(activityMaterialRepository.save(any(ActivityMaterial.class))).thenAnswer(inv -> {
            ActivityMaterial m = inv.getArgument(0);
            m.setId(100L);
            return m;
        });

        // Act
        ActivityMaterialResponse response = activityMaterialService.generate(request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(100L);

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiService).generateJsonObject(promptCaptor.capture());
        String capturedPrompt = promptCaptor.getValue();

        assertThat(capturedPrompt).contains("Regra de Formato Obrigatória: Todas as questões geradas na Ficha de exercícios (exercicios) devem ser OBRIGATORIAMENTE de múltipla escolha");
        assertThat(capturedPrompt).contains("Usar pizza como analogia");
        verify(usageLimitService).assertCanGenerate(testUser);
        verify(usageLimitService).increment(testUser);
    }

    @Test
    void generateAppendsEscreverRuleToPrompt() {
        // Arrange
        GenerateActivityRequest request = new GenerateActivityRequest(
                "Frações",
                ActivityType.WORKSHEET,
                "5º ano",
                "Matemática",
                null,
                "ESCREVER"
        );

        when(currentUserService.getCurrentUser()).thenReturn(testUser);
        when(aiService.generateJsonObject(any(String.class))).thenReturn("{\"titulo\":\"Atividade de Frações\",\"descricao\":\"Exercícios de fixação\"}");
        when(activityMaterialRepository.save(any(ActivityMaterial.class))).thenAnswer(inv -> {
            ActivityMaterial m = inv.getArgument(0);
            m.setId(101L);
            return m;
        });

        // Act
        ActivityMaterialResponse response = activityMaterialService.generate(request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(101L);

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiService).generateJsonObject(promptCaptor.capture());
        String capturedPrompt = promptCaptor.getValue();

        assertThat(capturedPrompt).contains("Regra de Formato Obrigatória: Todas as questões geradas na Ficha de exercícios (exercicios) devem ser OBRIGATORIAMENTE de resposta escrita");
    }

    @Test
    void generateAppendsMistaRuleToPrompt() {
        // Arrange
        GenerateActivityRequest request = new GenerateActivityRequest(
                "Frações",
                ActivityType.WORKSHEET,
                "5º ano",
                "Matemática",
                null,
                "MISTA"
        );

        when(currentUserService.getCurrentUser()).thenReturn(testUser);
        when(aiService.generateJsonObject(any(String.class))).thenReturn("{\"titulo\":\"Atividade de Frações\",\"descricao\":\"Exercícios de fixação\"}");
        when(activityMaterialRepository.save(any(ActivityMaterial.class))).thenAnswer(inv -> {
            ActivityMaterial m = inv.getArgument(0);
            m.setId(102L);
            return m;
        });

        // Act
        ActivityMaterialResponse response = activityMaterialService.generate(request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(102L);

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiService).generateJsonObject(promptCaptor.capture());
        String capturedPrompt = promptCaptor.getValue();

        assertThat(capturedPrompt).contains("Regra de Formato Obrigatória: A Ficha de exercícios (exercicios) deve conter uma mistura equilibrada");
    }

    @Test
    void generateUsesInitialLiteracyVisualWorksheetContractForFirstGrade() {
        // Arrange
        GenerateActivityRequest request = new GenerateActivityRequest(
                "Separação de sílabas",
                ActivityType.WORKSHEET,
                "1º ano",
                "Língua Portuguesa",
                "Usar palavras curtas do cotidiano",
                "ESCREVER"
        );

        when(currentUserService.getCurrentUser()).thenReturn(testUser);
        when(aiService.generateJsonObject(any(String.class))).thenReturn("{\"titulo\":\"Atividade de Sílabas\",\"descricao\":\"Ficha visual\"}");
        when(activityMaterialRepository.save(any(ActivityMaterial.class))).thenAnswer(inv -> {
            ActivityMaterial m = inv.getArgument(0);
            m.setId(103L);
            return m;
        });

        // Act
        ActivityMaterialResponse response = activityMaterialService.generate(request);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(103L);

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiService).generateJsonObject(promptCaptor.capture());
        String capturedPrompt = promptCaptor.getValue();

        assertThat(capturedPrompt)
                .contains("\"layout\": \"ALFABETIZACAO_VISUAL_V2\"")
                .contains("Banco tematico de palavras")
                .contains("SEPARAR_SILABAS")
                .contains("LETRA_INICIAL")
                .contains("caixasResposta")
                .contains("Usar palavras curtas do cotidiano");
        assertThat(capturedPrompt)
                .doesNotContain("resposta escrita (\"tipo\": \"resposta_escrita\") para o aluno responder por extenso")
                .doesNotContain("contendo exatamente 4 opções");
    }

    @Test
    void generateNormalizesInitialLiteracyWorksheetBeforeSaving() {
        GenerateActivityRequest request = new GenerateActivityRequest(
                "animais da fazenda",
                ActivityType.WORKSHEET,
                "1º ano",
                "Língua Portuguesa",
                null,
                "ESCREVER"
        );

        when(currentUserService.getCurrentUser()).thenReturn(testUser);
        when(aiService.generateJsonObject(any(String.class))).thenReturn("""
                {
                  "titulo":"Ficha ruim",
                  "descricao":"Texto longo",
                  "layout":"ALFABETIZACAO_VISUAL",
                  "exercicios":[
                    {
                      "numero":1,
                      "tipo":"INTERPRETACAO_DE_TEXTO",
                      "comando":"Leia o texto enorme e responda tudo sozinho no caderno",
                      "itens":[{"palavra":"DINOSSAURO","figura":"dinossauro"}],
                      "gabarito":"resposta longa"
                    }
                  ]
                }
                """);
        when(activityMaterialRepository.save(any(ActivityMaterial.class))).thenAnswer(inv -> {
            ActivityMaterial m = inv.getArgument(0);
            m.setId(104L);
            return m;
        });

        activityMaterialService.generate(request);

        ArgumentCaptor<String> promptCaptor = ArgumentCaptor.forClass(String.class);
        verify(aiService).generateJsonObject(promptCaptor.capture());
        assertThat(promptCaptor.getValue())
                .contains("Banco tematico de palavras")
                .contains("VACA | figura: vaca | silabas: VA-CA");

        ArgumentCaptor<ActivityMaterial> materialCaptor = ArgumentCaptor.forClass(ActivityMaterial.class);
        verify(activityMaterialRepository).save(materialCaptor.capture());
        String savedContent = materialCaptor.getValue().getContent();

        assertThat(savedContent)
                .contains("\"layout\":\"ALFABETIZACAO_VISUAL_V2\"")
                .contains("VACA")
                .contains("PATO")
                .doesNotContain("DINOSSAURO")
                .doesNotContain("INTERPRETACAO_DE_TEXTO");
    }

    @Test
    void generateEnrichesImagesBeforeSavingActivity() {
        GenerateActivityRequest request = new GenerateActivityRequest(
                "animais da fazenda",
                ActivityType.WORKSHEET,
                "1o ano",
                "Lingua Portuguesa",
                null,
                "MISTA"
        );
        when(currentUserService.getCurrentUser()).thenReturn(testUser);
        when(aiService.generateJsonObject(any(String.class))).thenReturn("{\"titulo\":\"Fazenda\",\"exercicios\":[]}");
        when(activityImageEnricher.enrich(any(String.class), eq("1o ano"), eq("animais da fazenda")))
                .thenReturn("{\"titulo\":\"Fazenda\",\"imagemUrl\":\"/images/generated/42\"}");
        when(activityMaterialRepository.save(any(ActivityMaterial.class))).thenAnswer(invocation -> {
            ActivityMaterial material = invocation.getArgument(0);
            material.setId(105L);
            return material;
        });

        activityMaterialService.generate(request);

        ArgumentCaptor<ActivityMaterial> materialCaptor = ArgumentCaptor.forClass(ActivityMaterial.class);
        verify(activityMaterialRepository).save(materialCaptor.capture());
        assertThat(materialCaptor.getValue().getContent()).contains("/images/generated/42");
    }
}
