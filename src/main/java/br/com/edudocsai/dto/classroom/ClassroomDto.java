package br.com.edudocsai.dto.classroom;

import java.time.ZonedDateTime;

public record ClassroomDto(
    Long id,
    String name,
    String subject,
    String grade,
    ZonedDateTime createdAt
) {}
