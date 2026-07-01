package br.com.edudocsai.service;

import br.com.edudocsai.entity.BNCCSkill;
import br.com.edudocsai.exception.BadRequestException;
import br.com.edudocsai.exception.ConflictException;
import br.com.edudocsai.repository.BNCCSkillRepository;
import br.com.edudocsai.dto.bncc.BNCCSkillRequest;
import br.com.edudocsai.dto.bncc.RecommendBNCCRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BNCCServiceTest {

    @Mock
    private BNCCSkillRepository repository;

    @Mock
    private AIService aiService;

    @org.mockito.Spy
    private PromptModuleCatalog promptModuleCatalog = new PromptModuleCatalog();

    @InjectMocks
    private BNCCService service;

    @Test
    void validateAndLoadReturnsSkillsInRequestedOrder() {
        BNCCSkill first = skill(1L, "EF05MA03");
        BNCCSkill second = skill(2L, "EF05LP01");
        when(repository.findAllById(any())).thenReturn(List.of(second, first));

        List<BNCCSkill> result = service.validateAndLoad(List.of(1L, 2L));

        assertThat(result).extracting(BNCCSkill::getCode).containsExactly("EF05MA03", "EF05LP01");
    }

    @Test
    void validateAndLoadRejectsMissingIds() {
        when(repository.findAllById(any())).thenReturn(List.of(skill(1L, "EF05MA03")));

        assertThatThrownBy(() -> service.validateAndLoad(List.of(1L, 99L)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("99");
    }

    @Test
    void createAllRejectsDuplicatedCode() {
        when(repository.existsByCodeIgnoreCase("EF05MA03")).thenReturn(true);

        assertThatThrownBy(() -> service.createAll(List.of(new BNCCSkillRequest(
                "EF05MA03",
                "Descricao",
                "Matematica",
                "5 ano"
        )))).isInstanceOf(ConflictException.class);
    }

    @Test
    void recommendSkillsNormalizesUiSubjectBeforeCallingAi() {
        BNCCSkill first = skill(10L, "EF01LP05", "Língua Portuguesa", "1º ano");
        BNCCSkill second = skill(11L, "EF01LP06", "Língua Portuguesa", "1º ano");
        when(repository.findByGradeIgnoreCaseAndSubjectIgnoreCase("1º ano", "Português")).thenReturn(List.of());
        when(repository.findByGradeIgnoreCaseAndSubjectIgnoreCase("1º ano", "Língua Portuguesa"))
                .thenReturn(List.of(first, second));
        when(aiService.generateJsonObject(any(String.class))).thenReturn("{\"recommendedIds\":[10,99,11]}");

        var result = service.recommendSkills(new RecommendBNCCRequest(
                "1º ano",
                "Português",
                "separar sílabas"
        ));

        assertThat(result.recommendedIds()).containsExactly(10L, 11L);
        verify(aiService).generateJsonObject(any(String.class));
    }

    private BNCCSkill skill(Long id, String code) {
        return skill(id, code, "Matematica", "5 ano");
    }

    private BNCCSkill skill(Long id, String code, String subject, String grade) {
        return BNCCSkill.builder()
                .id(id)
                .code(code)
                .description("Descricao")
                .subject(subject)
                .grade(grade)
                .build();
    }
}
