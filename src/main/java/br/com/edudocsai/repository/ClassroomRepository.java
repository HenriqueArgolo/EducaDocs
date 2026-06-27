package br.com.edudocsai.repository;

import br.com.edudocsai.entity.Classroom;
import br.com.edudocsai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {
    List<Classroom> findByUserOrderByCreatedAtDesc(User user);
    Optional<Classroom> findByIdAndUser(Long id, User user);
}
