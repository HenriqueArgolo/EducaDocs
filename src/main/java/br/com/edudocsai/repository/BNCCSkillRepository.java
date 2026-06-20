package br.com.edudocsai.repository;

import br.com.edudocsai.entity.BNCCSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BNCCSkillRepository extends JpaRepository<BNCCSkill, Long> {

    List<BNCCSkill> findByGradeIgnoreCaseAndSubjectIgnoreCase(String grade, String subject);

    List<BNCCSkill> findByGradeIgnoreCaseAndSubjectIgnoreCaseAndCodeIgnoreCase(String grade, String subject, String code);

    Optional<BNCCSkill> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);
}
