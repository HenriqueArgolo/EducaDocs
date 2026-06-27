package br.com.edudocsai.repository;

import br.com.edudocsai.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByClassroomIdOrderByCreatedAtDesc(Long classroomId);
}
