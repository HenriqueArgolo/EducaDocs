package br.com.edudocsai.service;

import br.com.edudocsai.config.UsageProperties;
import br.com.edudocsai.entity.DailyUsage;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.RateLimitException;
import br.com.edudocsai.repository.DailyUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class UsageLimitService {

    private final DailyUsageRepository dailyUsageRepository;
    private final UsageProperties usageProperties;

    @Transactional(readOnly = true)
    public void assertCanGenerate(User user) {
        DailyUsage usage = dailyUsageRepository.findByUserIdAndUsageDate(user.getId(), LocalDate.now())
                .orElse(null);
        int currentCount = usage == null ? 0 : usage.getGenerationCount();
        if (currentCount >= usageProperties.dailyGenerationLimit()) {
            throw new RateLimitException("Limite diario de geracoes atingido");
        }
    }

    @Transactional
    public void increment(User user) {
        DailyUsage usage = dailyUsageRepository.findByUserIdAndUsageDate(user.getId(), LocalDate.now())
                .orElseGet(() -> DailyUsage.builder()
                        .user(user)
                        .usageDate(LocalDate.now())
                        .generationCount(0)
                        .build());
        usage.increment();
        dailyUsageRepository.save(usage);
    }
}
