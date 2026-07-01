package br.com.edudocsai.repository;

import br.com.edudocsai.entity.LessonKit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LessonKitRepository extends JpaRepository<LessonKit, Long> {
    Optional<LessonKit> findBySourceDocumentIdAndUserId(Long sourceDocumentId, Long userId);
    Optional<LessonKit> findByIdAndUserId(Long id, Long userId);
    Optional<LessonKit> findBySourceDocumentId(Long sourceDocumentId);
}
