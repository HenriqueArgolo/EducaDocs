package br.com.edudocsai.service;

import br.com.edudocsai.entity.*;
import br.com.edudocsai.repository.ClassroomRepository;
import br.com.edudocsai.repository.ClassroomTimelineItemRepository;
import br.com.edudocsai.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@Testcontainers
@SpringBootTest
@Transactional
class ClassroomServiceIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("edudocs.security.jwt-secret", () -> "local-dev-jwt-secret-change-before-production-edu-docs-ai");
    }

    @Autowired
    private ClassroomService classroomService;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClassroomTimelineItemRepository timelineItemRepository;

    @MockBean
    private CurrentUserService currentUserService;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    @Test
    void deleteTimelineItemIntegratesWithDatabaseCorrectly() {
        User user = userRepository.save(User.builder()
                .name("Jose Test")
                .email("jose@test.com")
                .password("pass")
                .role(Role.TEACHER)
                .build());

        when(currentUserService.getCurrentUser()).thenReturn(user);

        Classroom classroom = classroomRepository.save(Classroom.builder()
                .user(user)
                .name("Classe A")
                .subject("Matematica")
                .grade("5 Ano")
                .timelineItems(new ArrayList<>())
                .build());

        ClassroomTimelineItem item1 = timelineItemRepository.save(ClassroomTimelineItem.builder()
                .classroom(classroom)
                .title("Aula 1")
                .orderIndex(0)
                .status(TimelineItemStatus.PLANNED)
                .type(TimelineItemType.PLAN)
                .build());

        ClassroomTimelineItem item2 = timelineItemRepository.save(ClassroomTimelineItem.builder()
                .classroom(classroom)
                .title("Aula 2")
                .orderIndex(1)
                .status(TimelineItemStatus.PLANNED)
                .type(TimelineItemType.PLAN)
                .build());

        ClassroomTimelineItem item3 = timelineItemRepository.save(ClassroomTimelineItem.builder()
                .classroom(classroom)
                .title("Aula 3")
                .orderIndex(2)
                .status(TimelineItemStatus.PLANNED)
                .type(TimelineItemType.PLAN)
                .build());

        classroom.getTimelineItems().add(item1);
        classroom.getTimelineItems().add(item2);
        classroom.getTimelineItems().add(item3);
        classroom = classroomRepository.save(classroom);

        // Delete the middle item
        classroomService.deleteTimelineItem(classroom.getId(), item2.getId());

        // Flush and clear persistence context to force SQL executions and clear first-level cache
        entityManager.flush();
        entityManager.clear();

        // Refresh classroom and verify
        Classroom updatedClassroom = classroomRepository.findById(classroom.getId()).orElseThrow();
        assertThat(updatedClassroom.getTimelineItems()).hasSize(2);
        
        // Assert item 2 is deleted from database
        assertThat(timelineItemRepository.findById(item2.getId())).isEmpty();
        
        // Assert item 1 and item 3 are still in the database and reordered
        Optional<ClassroomTimelineItem> dbItem1 = timelineItemRepository.findById(item1.getId());
        Optional<ClassroomTimelineItem> dbItem3 = timelineItemRepository.findById(item3.getId());
        assertThat(dbItem1).isPresent();
        assertThat(dbItem3).isPresent();
        
        assertThat(dbItem1.get().getOrderIndex()).isEqualTo(0);
        assertThat(dbItem3.get().getOrderIndex()).isEqualTo(1);
    }
}
