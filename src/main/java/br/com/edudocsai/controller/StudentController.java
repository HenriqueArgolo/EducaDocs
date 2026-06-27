package br.com.edudocsai.controller;

import br.com.edudocsai.dto.classroom.CreateStudentRequest;
import br.com.edudocsai.dto.classroom.StudentDto;
import br.com.edudocsai.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/classrooms/{classroomId}/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<List<StudentDto>> getStudents(@PathVariable Long classroomId) {
        return ResponseEntity.ok(studentService.getStudents(classroomId));
    }

    @PostMapping
    public ResponseEntity<StudentDto> addStudent(
            @PathVariable Long classroomId,
            @Valid @RequestBody CreateStudentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studentService.addStudent(classroomId, request));
    }

    @PutMapping("/{studentId}")
    public ResponseEntity<StudentDto> updateStudent(
            @PathVariable Long classroomId,
            @PathVariable Long studentId,
            @Valid @RequestBody CreateStudentRequest request) {
        return ResponseEntity.ok(studentService.updateStudent(classroomId, studentId, request));
    }

    @DeleteMapping("/{studentId}")
    public ResponseEntity<Void> deleteStudent(
            @PathVariable Long classroomId,
            @PathVariable Long studentId) {
        studentService.deleteStudent(classroomId, studentId);
        return ResponseEntity.noContent().build();
    }
}
