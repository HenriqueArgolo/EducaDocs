package br.com.edudocsai.repository;

import br.com.edudocsai.entity.DailyUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface DailyUsageRepository extends JpaRepository<DailyUsage, Long> {

    Optional<DailyUsage> findByUserIdAndUsageDate(Long userId, LocalDate usageDate);
}
