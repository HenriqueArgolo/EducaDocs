package br.com.edudocsai.service.lessonkit;

import br.com.edudocsai.dto.lessonkit.LessonKitResponse;
import br.com.edudocsai.dto.lessonkit.RegenerateLessonKitMaterialRequest;
import br.com.edudocsai.entity.*;
import br.com.edudocsai.repository.DocumentRepository;
import br.com.edudocsai.repository.LessonKitMaterialRepository;
import br.com.edudocsai.repository.LessonKitRepository;
import br.com.edudocsai.service.CurrentUserService;
import br.com.edudocsai.service.AIService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LessonKitServiceTest {
    @Mock CurrentUserService currentUserService;
    @Mock DocumentRepository documents;
    @Mock LessonKitRepository kits;
    @Mock LessonKitMaterialRepository materials;
    @Mock LessonKitContentMapper mapper;
    @Mock AIService aiService;
    @Mock LessonKitPromptBuilder promptBuilder;
    @Mock LessonKitMaterialExportService exportService;
    LessonKitService service;

    @BeforeEach
    void setUp() {
        service = new LessonKitService(currentUserService, documents, kits, materials, mapper, aiService, promptBuilder, exportService);
    }

    @Test
    void createsReadyKitFromExistingEmbeddedContentAndIsIdempotent() {
        User user = User.builder().id(7L).name("Ana").role(Role.TEACHER).build();
        Document plan = Document.builder().id(10L).user(user).type(DocumentType.LESSON_PLAN)
                .title("Frações equivalentes").content("{\"tema\":\"Frações\"}").build();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(documents.findById(10L)).thenReturn(Optional.of(plan));
        when(kits.findBySourceDocumentIdAndUserId(10L, 7L)).thenReturn(Optional.empty());
        when(mapper.extract(anyString())).thenReturn(Map.of(
                LessonKitMaterialType.STUDENT_ACTIVITY, "{\"atividadeAluno\":{}}",
                LessonKitMaterialType.TEACHER_ANSWER_KEY, "{\"gabaritoProfessor\":{}}",
                LessonKitMaterialType.ASSESSMENT, "{\"instrumentoAvaliativo\":{}}",
                LessonKitMaterialType.PEDAGOGICAL_EVIDENCE, "{\"evidenciasPedagogicas\":{}}",
                LessonKitMaterialType.INCLUSIVE_ADAPTATIONS, "{\"adaptacoesInclusivas\":{}}"));
        AtomicLong ids = new AtomicLong(40);
        List<LessonKitMaterial> savedMaterials = new ArrayList<>();
        when(kits.save(any())).thenAnswer(invocation -> {
            LessonKit kit = invocation.getArgument(0); kit.setId(ids.incrementAndGet()); return kit;
        });
        when(materials.save(any())).thenAnswer(invocation -> {
            LessonKitMaterial material = invocation.getArgument(0); material.setId(ids.incrementAndGet());
            savedMaterials.add(material); return material;
        });
        when(materials.findByKitIdOrderByType(any())).thenAnswer(invocation -> savedMaterials);

        LessonKitResponse result = service.createFromPlan(10L);

        assertThat(result.status()).isEqualTo(LessonKitStatus.READY);
        assertThat(result.materials()).hasSize(6);
        verify(materials, times(6)).save(any());
    }

    @Test
    void regeneratesOnlyTheRequestedDerivedMaterial() {
        User user = User.builder().id(7L).role(Role.TEACHER).build();
        Document plan = Document.builder().id(10L).user(user).type(DocumentType.LESSON_PLAN)
                .content("{\"kitAulaCompleta\":{}}").build();
        LessonKit kit = LessonKit.builder().id(41L).user(user).sourceDocument(plan).status(LessonKitStatus.READY).build();
        LessonKitMaterial activity = LessonKitMaterial.builder().id(42L).kit(kit)
                .type(LessonKitMaterialType.STUDENT_ACTIVITY).status(LessonKitMaterialStatus.READY)
                .content("{\"old\":true}").version(0L).build();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(kits.findById(41L)).thenReturn(Optional.of(kit));
        when(materials.findByKitIdAndType(41L, LessonKitMaterialType.STUDENT_ACTIVITY)).thenReturn(Optional.of(activity));
        when(mapper.extract(anyString())).thenReturn(Map.of(
                LessonKitMaterialType.STUDENT_ACTIVITY, "{\"atividadeAluno\":{\"titulo\":\"Nova\"}}"));
        when(promptBuilder.singleMaterial(any(), eq(LessonKitMaterialType.STUDENT_ACTIVITY), any())).thenReturn("PROMPT VALIDADO");
        when(aiService.generateJsonObject("PROMPT VALIDADO")).thenReturn("{\"kitAulaCompleta\":{\"atividadeAluno\":{\"titulo\":\"Nova\"}}}");
        when(materials.save(activity)).thenReturn(activity);

        var settings = new RegenerateLessonKitMaterialRequest(5, 5, "MISTA", "AVALIATIVA", "DESAFIO", "INDIVIDUAL");
        var result = service.regenerate(41L, LessonKitMaterialType.STUDENT_ACTIVITY, settings);

        assertThat(result.content()).contains("Nova");
        verify(materials).save(activity);
        verify(promptBuilder).singleMaterial(plan, LessonKitMaterialType.STUDENT_ACTIVITY, settings);
    }

    @Test
    void exportsOnlyAnAuthorizedReadyMaterial() {
        User user = User.builder().id(7L).role(Role.TEACHER).build();
        LessonKit kit = LessonKit.builder().id(41L).user(user).title("Kit semanal").build();
        LessonKitMaterial activity = LessonKitMaterial.builder().kit(kit)
                .type(LessonKitMaterialType.STUDENT_ACTIVITY).status(LessonKitMaterialStatus.READY)
                .content("{\"atividadeAluno\":{}}").build();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(kits.findById(41L)).thenReturn(Optional.of(kit));
        when(materials.findByKitIdAndType(41L, LessonKitMaterialType.STUDENT_ACTIVITY)).thenReturn(Optional.of(activity));
        when(exportService.export("Kit semanal", LessonKitMaterialType.STUDENT_ACTIVITY, activity.getContent()))
                .thenReturn(new byte[]{'P', 'K'});

        assertThat(service.exportDocx(41L, LessonKitMaterialType.STUDENT_ACTIVITY)).startsWith((byte) 'P', (byte) 'K');
    }
}
