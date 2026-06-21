package br.com.edudocsai.exception;

import br.com.edudocsai.dto.error.ApiErrorResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handlesMalformedJsonAsBadRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/documents/generate");

        ResponseEntity<ApiErrorResponse> response = handler.handleMalformedJson(
                new HttpMessageNotReadableException("Invalid JSON", new MockHttpInputMessage(new byte[0])),
                request
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).contains("JSON");
        assertThat(response.getBody().path()).isEqualTo("/documents/generate");
    }
}
