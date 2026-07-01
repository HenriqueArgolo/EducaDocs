package br.com.edudocsai.repository;

import br.com.edudocsai.entity.Document;
import br.com.edudocsai.entity.DocumentType;
import br.com.edudocsai.entity.LessonKit;
import br.com.edudocsai.entity.LessonKitMaterial;
import br.com.edudocsai.entity.LessonKitMaterialStatus;
import br.com.edudocsai.entity.LessonKitMaterialType;
import br.com.edudocsai.entity.LessonKitStatus;
import br.com.edudocsai.entity.Role;
import br.com.edudocsai.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class LessonKitRepositoryIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired UserRepository users;
    @Autowired DocumentRepository documents;
    @Autowired LessonKitRepository kits;
    @Autowired LessonKitMaterialRepository materials;

    @Test
    void persistsOneKitPerSourcePlanWithIndependentMaterials() {
        User user = users.save(User.builder().name("Ana").email("ana-kit@escola.com")
                .password("hash").role(Role.TEACHER).build());
        Document plan = documents.save(Document.builder().user(user).type(DocumentType.LESSON_PLAN)
                .title("Frações equivalentes").content("{}").build());
        LessonKit kit = kits.save(LessonKit.builder().user(user).sourceDocument(plan)
                .title("Kit de Aula Semanal — 6º ano — Matemática")
                .status(LessonKitStatus.GENERATING).build());
        materials.save(LessonKitMaterial.builder().kit(kit)
                .type(LessonKitMaterialType.STUDENT_ACTIVITY)
                .status(LessonKitMaterialStatus.QUEUED).content("{}").build());

        assertThat(kits.findBySourceDocumentIdAndUserId(plan.getId(), user.getId())).contains(kit);
        assertThat(materials.findByKitIdOrderByType(kit.getId()))
                .extracting(LessonKitMaterial::getType)
                .containsExactly(LessonKitMaterialType.STUDENT_ACTIVITY);
    }
}
