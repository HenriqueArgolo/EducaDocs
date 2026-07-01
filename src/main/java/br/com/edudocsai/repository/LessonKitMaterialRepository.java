package br.com.edudocsai.repository;

import br.com.edudocsai.entity.LessonKitMaterial;
import br.com.edudocsai.entity.LessonKitMaterialType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface LessonKitMaterialRepository extends JpaRepository<LessonKitMaterial, Long> {
    List<LessonKitMaterial> findByKitIdOrderByType(Long kitId);
    Optional<LessonKitMaterial> findByKitIdAndType(Long kitId, LessonKitMaterialType type);
}
