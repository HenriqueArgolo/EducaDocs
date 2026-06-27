package br.com.edudocsai.dto.classroom;

import java.time.ZonedDateTime;

public record StudentDto(
    Long id,
    Long classroomId,
    String name,
    String needs,
    ZonedDateTime createdAt
) {}
