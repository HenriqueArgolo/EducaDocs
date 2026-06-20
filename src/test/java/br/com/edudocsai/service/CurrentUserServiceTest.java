package br.com.edudocsai.service;

import br.com.edudocsai.entity.User;
import br.com.edudocsai.exception.NotFoundException;
import br.com.edudocsai.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CurrentUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getCurrentUserReturnsUserFromAuthenticatedEmail() {
        User user = User.builder().id(1L).email("maria@escola.com").build();
        SecurityContextHolder.getContext().setAuthentication(
                new TestingAuthenticationToken("maria@escola.com", null)
        );
        when(userRepository.findByEmail("maria@escola.com")).thenReturn(Optional.of(user));
        CurrentUserService service = new CurrentUserService(userRepository);

        User result = service.getCurrentUser();

        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void getCurrentUserFailsWhenAuthenticationIsMissing() {
        CurrentUserService service = new CurrentUserService(userRepository);

        assertThatThrownBy(service::getCurrentUser)
                .isInstanceOf(NotFoundException.class);
    }
}
