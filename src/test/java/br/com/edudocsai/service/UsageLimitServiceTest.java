package br.com.edudocsai.service;

import br.com.edudocsai.config.UsageProperties;
import br.com.edudocsai.entity.DailyUsage;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.RateLimitException;
import br.com.edudocsai.repository.DailyUsageRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsageLimitServiceTest {

    @Mock
    private DailyUsageRepository repository;

    @Test
    void assertCanGenerateRejectsWhenLimitWasReached() {
        User user = User.builder().id(1L).build();
        DailyUsage usage = DailyUsage.builder()
                .user(user)
                .usageDate(LocalDate.now())
                .generationCount(20)
                .build();
        when(repository.findByUserIdAndUsageDate(1L, LocalDate.now())).thenReturn(Optional.of(usage));
        UsageLimitService service = new UsageLimitService(repository, new UsageProperties(20));

        assertThatThrownBy(() -> service.assertCanGenerate(user))
                .isInstanceOf(RateLimitException.class);
    }
}
