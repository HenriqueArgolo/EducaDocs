package br.com.edudocsai.service;

import br.com.edudocsai.dto.classroom.CreateStudentRequest;
import br.com.edudocsai.dto.classroom.StudentDto;
import br.com.edudocsai.entity.Classroom;
import br.com.edudocsai.entity.Student;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.NotFoundException;
import br.com.edudocsai.repository.ClassroomRepository;
import br.com.edudocsai.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final ClassroomRepository classroomRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public List<StudentDto> getStudents(Long classroomId) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = classroomRepository.findByIdAndUser(classroomId, user)
            .orElseThrow(() -> new NotFoundException("Turma não encontrada"));

        return studentRepository.findByClassroomIdOrderByCreatedAtDesc(classroom.getId())
            .stream()
            .map(this::mapToDto)
            .toList();
    }

    @Transactional
    public StudentDto addStudent(Long classroomId, CreateStudentRequest request) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = classroomRepository.findByIdAndUser(classroomId, user)
            .orElseThrow(() -> new NotFoundException("Turma não encontrada"));

        Student student = Student.builder()
            .classroom(classroom)
            .name(request.name())
            .needs(request.needs())
            .build();

        student = studentRepository.save(student);
        return mapToDto(student);
    }

    @Transactional
    public StudentDto updateStudent(Long classroomId, Long studentId, CreateStudentRequest request) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = classroomRepository.findByIdAndUser(classroomId, user)
            .orElseThrow(() -> new NotFoundException("Turma não encontrada"));

        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new NotFoundException("Estudante não encontrado"));

        if (!student.getClassroom().getId().equals(classroom.getId())) {
            throw new IllegalArgumentException("Estudante não pertence a esta turma");
        }

        student.setName(request.name());
        student.setNeeds(request.needs());

        student = studentRepository.save(student);
        return mapToDto(student);
    }

    @Transactional
    public void deleteStudent(Long classroomId, Long studentId) {
        User user = currentUserService.getCurrentUser();
        Classroom classroom = classroomRepository.findByIdAndUser(classroomId, user)
            .orElseThrow(() -> new NotFoundException("Turma não encontrada"));

        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new NotFoundException("Estudante não encontrado"));

        if (!student.getClassroom().getId().equals(classroom.getId())) {
            throw new IllegalArgumentException("Estudante não pertence a esta turma");
        }

        studentRepository.delete(student);
    }

    private StudentDto mapToDto(Student student) {
        return new StudentDto(
            student.getId(),
            student.getClassroom().getId(),
            student.getName(),
            student.getNeeds(),
            student.getCreatedAt()
        );
    }
}
