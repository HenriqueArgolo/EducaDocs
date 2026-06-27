package br.com.edudocsai.repository;

import br.com.edudocsai.entity.BNCCSkill;
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
class RepositoryIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BNCCSkillRepository bnccSkillRepository;

    @Test
    void persistsUserAndFindsImportedBnccCoverage() {
        User saved = userRepository.save(User.builder()
                .name("Maria")
                .email("maria@escola.com")
                .password("hash")
                .role(Role.TEACHER)
                .build());

        assertThat(userRepository.findByEmail("maria@escola.com")).contains(saved);

        assertThat(bnccSkillRepository.count()).isGreaterThanOrEqualTo(1500);
        assertThat(bnccSkillRepository.findByCodeIgnoreCase("EI03TS03")).isPresent();
        assertThat(bnccSkillRepository.findByCodeIgnoreCase("EM13CHS605")).isPresent();
        assertThat(bnccSkillRepository.findByGradeIgnoreCaseAndSubjectIgnoreCase("5\u00ba ano", "Matem\u00e1tica"))
                .extracting(BNCCSkill::getCode)
                .contains("EF05MA03");
    }
}
