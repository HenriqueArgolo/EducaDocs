package br.com.edudocsai.repository;

import br.com.edudocsai.entity.ClassroomTimelineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClassroomTimelineItemRepository extends JpaRepository<ClassroomTimelineItem, Long> {
}
