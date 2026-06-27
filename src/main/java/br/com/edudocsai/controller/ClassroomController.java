package br.com.edudocsai.controller;

import br.com.edudocsai.dto.classroom.ClassroomDto;
import br.com.edudocsai.dto.classroom.ClassroomStatsDto;
import br.com.edudocsai.dto.classroom.ClassroomTimelineItemDto;
import br.com.edudocsai.dto.classroom.CreateClassroomRequest;
import br.com.edudocsai.dto.classroom.CreateTimelineItemRequest;
import br.com.edudocsai.dto.classroom.GenerateRoadmapRequest;
import br.com.edudocsai.dto.classroom.ReorderTimelineItemsRequest;
import br.com.edudocsai.entity.TimelineItemStatus;
import br.com.edudocsai.service.ClassroomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;

    @PostMapping
    public ResponseEntity<ClassroomDto> createClassroom(
            @Valid @RequestBody CreateClassroomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(classroomService.createClassroom(request));
    }

    @GetMapping
    public ResponseEntity<List<ClassroomDto>> getClassrooms() {
        return ResponseEntity.ok(classroomService.getClassrooms());
    }

    @GetMapping("/{id}/roadmap")
    public ResponseEntity<List<ClassroomTimelineItemDto>> getClassroomRoadmap(
            @PathVariable Long id) {
        return ResponseEntity.ok(classroomService.getClassroomRoadmap(id));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<ClassroomStatsDto> getClassroomStats(
            @PathVariable Long id) {
        return ResponseEntity.ok(classroomService.getClassroomStats(id));
    }

    @PostMapping("/{id}/roadmap/items")
    public ResponseEntity<ClassroomTimelineItemDto> addTimelineItem(
            @PathVariable Long id,
            @Valid @RequestBody CreateTimelineItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(classroomService.addTimelineItem(id, request));
    }

    @PutMapping("/{id}/roadmap/items/{itemId}")
    public ResponseEntity<ClassroomTimelineItemDto> updateTimelineItem(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @Valid @RequestBody CreateTimelineItemRequest request) {
        return ResponseEntity.ok(classroomService.updateTimelineItem(id, itemId, request));
    }

    @PutMapping("/{id}/roadmap/items/reorder")
    public ResponseEntity<Void> reorderTimelineItems(
            @PathVariable Long id,
            @Valid @RequestBody ReorderTimelineItemsRequest request) {
        classroomService.reorderTimelineItems(id, request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/roadmap/items/{itemId}/status")
    public ResponseEntity<ClassroomTimelineItemDto> changeTimelineItemStatus(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @RequestBody Map<String, String> body) {
        TimelineItemStatus status = TimelineItemStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(classroomService.changeTimelineItemStatus(id, itemId, status));
    }

    @PatchMapping("/{id}/roadmap/items/{itemId}/date")
    public ResponseEntity<ClassroomTimelineItemDto> updateTimelineItemDate(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @RequestBody Map<String, String> body) {
        java.time.ZonedDateTime newDate = java.time.ZonedDateTime.parse(body.get("date"));
        return ResponseEntity.ok(classroomService.updateTimelineItemDate(id, itemId, newDate));
    }

    @PostMapping("/{id}/roadmap/generate")
    public ResponseEntity<List<ClassroomTimelineItemDto>> generateRoadmap(
            @PathVariable Long id,
            @Valid @RequestBody GenerateRoadmapRequest request) {
        return ResponseEntity.ok(classroomService.generateRoadmap(id, request));
    }

    @GetMapping("/{id}/export-portfolio")
    public ResponseEntity<byte[]> exportPortfolio(@PathVariable Long id) {
        byte[] body = classroomService.exportPortfolio(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename("edudocs-portfolio-turma-" + id + ".docx")
                                .build()
                                .toString()
                )
                .body(body);
    }

    @DeleteMapping("/{id}/roadmap/items/{itemId}")
    public ResponseEntity<Void> deleteTimelineItem(
            @PathVariable Long id,
            @PathVariable Long itemId) {
        classroomService.deleteTimelineItem(id, itemId);
        return ResponseEntity.noContent().build();
    }
}

