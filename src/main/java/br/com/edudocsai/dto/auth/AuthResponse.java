package br.com.edudocsai.dto.auth;

import br.com.edudocsai.dto.user.UserResponse;

public record AuthResponse(String tokenType, String accessToken, long expiresInMinutes, UserResponse user) {
}
