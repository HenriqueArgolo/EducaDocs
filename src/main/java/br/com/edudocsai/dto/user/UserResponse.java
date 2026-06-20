package br.com.edudocsai.dto.user;

import br.com.edudocsai.entity.Role;

import java.time.OffsetDateTime;

public record UserResponse(Long id, String name, String email, Role role, OffsetDateTime createdAt) {
}
