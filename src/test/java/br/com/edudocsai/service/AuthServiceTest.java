package br.com.edudocsai.service;

import br.com.edudocsai.config.JwtProperties;
import br.com.edudocsai.dto.auth.AuthResponse;
import br.com.edudocsai.dto.auth.RegisterRequest;
import br.com.edudocsai.entity.Role;
import br.com.edudocsai.entity.User;
import br.com.edudocsai.repository.UserRepository;
import br.com.edudocsai.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;

    @Test
    void registerCreatesTeacherWithEncodedPasswordAndJwt() {
        when(userRepository.existsByEmail("maria@escola.com")).thenReturn(false);
        when(passwordEncoder.encode("SenhaForte123!")).thenReturn("bcrypt-hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(1L);
            user.setCreatedAt(OffsetDateTime.now());
            return user;
        });
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt-token");
        AuthService service = new AuthService(
                userRepository,
                passwordEncoder,
                authenticationManager,
                jwtService,
                new JwtProperties("local-dev-jwt-secret-change-before-production-edu-docs-ai", 120)
        );

        AuthResponse response = service.register(new RegisterRequest("Maria", "MARIA@ESCOLA.COM", "SenhaForte123!"));

        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.user().email()).isEqualTo("maria@escola.com");
        assertThat(response.user().role()).isEqualTo(Role.TEACHER);
    }
}
