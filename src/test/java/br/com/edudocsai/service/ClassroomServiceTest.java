package br.com.edudocsai.service;

import br.com.edudocsai.entity.Classroom;
import br.com.edudocsai.entity.ClassroomTimelineItem;
import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.NotFoundException;
import br.com.edudocsai.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClassroomServiceTest {

    @Mock
    private ClassroomRepository classroomRepository;

    @Mock
    private ClassroomTimelineItemRepository timelineItemRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private ActivityMaterialRepository activityMaterialRepository;

    @Mock
    private PresentationRepository presentationRepository;

    @Mock
    private BNCCSkillRepository bnccSkillRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private AIService aiService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private LessonKitRepository lessonKitRepository;

    @InjectMocks
    private ClassroomService classroomService;

    @Test
    void roadmapIdentifiesTheCompleteKitLinkedToItsLessonPlan() {
        User user = User.builder().id(1L).build();
        Document plan = Document.builder().id(50L).user(user).build();
        ClassroomTimelineItem item = ClassroomTimelineItem.builder().id(101L).document(plan).build();
        Classroom classroom = Classroom.builder().id(10L).user(user)
                .timelineItems(List.of(item)).build();
        var kit = br.com.edudocsai.entity.LessonKit.builder().id(90L).sourceDocument(plan).user(user).build();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(classroomRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(classroom));
        when(lessonKitRepository.findBySourceDocumentId(50L)).thenReturn(Optional.of(kit));

        var result = classroomService.getClassroomRoadmap(10L);

        assertThat(result.get(0).kitId()).isEqualTo(90L);
    }

    @Test
    void deleteTimelineItemRemovesAndReordersItems() {
        User user = User.builder().id(1L).build();
        Classroom classroom = Classroom.builder().id(10L).user(user).build();
        
        List<ClassroomTimelineItem> items = new ArrayList<>();
        ClassroomTimelineItem item1 = ClassroomTimelineItem.builder().id(101L).classroom(classroom).orderIndex(0).build();
        ClassroomTimelineItem item2 = ClassroomTimelineItem.builder().id(102L).classroom(classroom).orderIndex(1).build();
        ClassroomTimelineItem item3 = ClassroomTimelineItem.builder().id(103L).classroom(classroom).orderIndex(2).build();
        items.add(item1);
        items.add(item2);
        items.add(item3);
        classroom.setTimelineItems(items);

        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(classroomRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(classroom));
        when(timelineItemRepository.findById(102L)).thenReturn(Optional.of(item2));

        classroomService.deleteTimelineItem(10L, 102L);

        assertThat(classroom.getTimelineItems()).hasSize(2);
        assertThat(classroom.getTimelineItems().get(0).getId()).isEqualTo(101L);
        assertThat(classroom.getTimelineItems().get(0).getOrderIndex()).isEqualTo(0);
        assertThat(classroom.getTimelineItems().get(1).getId()).isEqualTo(103L);
        // Assert that the remaining items are reordered
        assertThat(classroom.getTimelineItems().get(1).getOrderIndex()).isEqualTo(1);
        
        verify(classroomRepository).save(classroom);
    }

    @Test
    void deleteTimelineItemThrowsNotFoundWhenClassroomNotFound() {
        User user = User.builder().id(1L).build();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(classroomRepository.findByIdAndUser(10L, user)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> classroomService.deleteTimelineItem(10L, 102L))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Turma não encontrada");
    }

    @Test
    void deleteTimelineItemThrowsNotFoundWhenItemNotFound() {
        User user = User.builder().id(1L).build();
        Classroom classroom = Classroom.builder().id(10L).user(user).build();
        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(classroomRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(classroom));
        when(timelineItemRepository.findById(102L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> classroomService.deleteTimelineItem(10L, 102L))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("Item não encontrado");
    }

    @Test
    void deleteTimelineItemThrowsExceptionWhenItemDoesNotBelongToClassroom() {
        User user = User.builder().id(1L).build();
        Classroom classroom = Classroom.builder().id(10L).user(user).build();
        Classroom otherClassroom = Classroom.builder().id(20L).build();
        ClassroomTimelineItem item = ClassroomTimelineItem.builder().id(102L).classroom(otherClassroom).build();

        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(classroomRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(classroom));
        when(timelineItemRepository.findById(102L)).thenReturn(Optional.of(item));

        assertThatThrownBy(() -> classroomService.deleteTimelineItem(10L, 102L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Item não pertence a esta turma");
    }

    @Test
    void updateTimelineItemClearsResourcesAndRevertsStatusToPlanned() {
        User user = User.builder().id(1L).build();
        Classroom classroom = Classroom.builder().id(10L).user(user).build();
        ClassroomTimelineItem item = ClassroomTimelineItem.builder()
                .id(102L)
                .classroom(classroom)
                .title("Original Title")
                .description("Original Description")
                .type(br.com.edudocsai.entity.TimelineItemType.PLAN)
                .status(br.com.edudocsai.entity.TimelineItemStatus.COMPLETED)
                .build();

        br.com.edudocsai.dto.classroom.CreateTimelineItemRequest request =
                new br.com.edudocsai.dto.classroom.CreateTimelineItemRequest(
                        "Updated Title",
                        "Updated Description",
                        br.com.edudocsai.entity.TimelineItemType.PLAN,
                        null,
                        null,
                        null
                );

        when(currentUserService.getCurrentUser()).thenReturn(user);
        when(classroomRepository.findByIdAndUser(10L, user)).thenReturn(Optional.of(classroom));
        when(timelineItemRepository.findById(102L)).thenReturn(Optional.of(item));
        when(timelineItemRepository.save(any(ClassroomTimelineItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        br.com.edudocsai.dto.classroom.ClassroomTimelineItemDto result = classroomService.updateTimelineItem(10L, 102L, request);

        assertThat(result.title()).isEqualTo("Updated Title");
        assertThat(result.description()).isEqualTo("Updated Description");
        assertThat(result.status()).isEqualTo(br.com.edudocsai.dto.classroom.ClassroomTimelineItemDto.class.cast(result).status()); // wait, result.status() is fine
        assertThat(result.status()).isEqualTo(br.com.edudocsai.entity.TimelineItemStatus.PLANNED);
        
        assertThat(item.getDocument()).isNull();
        assertThat(item.getActivity()).isNull();
        assertThat(item.getPresentation()).isNull();
    }
}
