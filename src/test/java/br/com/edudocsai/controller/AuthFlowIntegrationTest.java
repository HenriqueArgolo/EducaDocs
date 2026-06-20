package br.com.edudocsai.controller;

import br.com.edudocsai.dto.auth.AuthResponse;
import br.com.edudocsai.dto.auth.LoginRequest;
import br.com.edudocsai.dto.auth.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AuthFlowIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("edudocs.security.jwt-secret", () -> "local-dev-jwt-secret-change-before-production-edu-docs-ai");
    }

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void registerThenLoginReturnsJwtToken() {
        RegisterRequest register = new RegisterRequest("Maria Silva", "maria.auth@escola.com", "SenhaForte123!");

        ResponseEntity<AuthResponse> registerResponse = restTemplate.postForEntity(url("/auth/register"), register, AuthResponse.class);

        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(registerResponse.getBody()).isNotNull();
        assertThat(registerResponse.getBody().accessToken()).isNotBlank();

        LoginRequest login = new LoginRequest("maria.auth@escola.com", "SenhaForte123!");
        ResponseEntity<AuthResponse> loginResponse = restTemplate.postForEntity(url("/auth/login"), login, AuthResponse.class);

        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody()).isNotNull();
        assertThat(loginResponse.getBody().accessToken()).isNotBlank();
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
