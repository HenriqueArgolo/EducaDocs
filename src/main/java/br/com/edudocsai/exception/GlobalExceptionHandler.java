package br.com.edudocsai.exception;

import br.com.edudocsai.dto.error.ApiErrorResponse;
import br.com.edudocsai.dto.error.FieldErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.List;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        List<FieldErrorResponse> details = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toFieldError)
                .toList();
        return build(HttpStatus.BAD_REQUEST, "Validation failed", request, details);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiErrorResponse> handleMalformedJson(
            HttpMessageNotReadableException exception,
            HttpServletRequest request
    ) {
        return build(HttpStatus.BAD_REQUEST, "JSON da requisicao invalido", request, List.of());
    }

    @ExceptionHandler(BadRequestException.class)
    ResponseEntity<ApiErrorResponse> handleBadRequest(BadRequestException exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, exception.getMessage(), request, List.of());
    }

    @ExceptionHandler(ConflictException.class)
    ResponseEntity<ApiErrorResponse> handleConflict(ConflictException exception, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, exception.getMessage(), request, List.of());
    }

    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<ApiErrorResponse> handleNotFound(NotFoundException exception, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, exception.getMessage(), request, List.of());
    }

    @ExceptionHandler(ForbiddenException.class)
    ResponseEntity<ApiErrorResponse> handleForbidden(ForbiddenException exception, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, exception.getMessage(), request, List.of());
    }

    @ExceptionHandler(RateLimitException.class)
    ResponseEntity<ApiErrorResponse> handleRateLimit(RateLimitException exception, HttpServletRequest request) {
        return build(HttpStatus.TOO_MANY_REQUESTS, exception.getMessage(), request, List.of());
    }

    @ExceptionHandler(AiProviderException.class)
    ResponseEntity<ApiErrorResponse> handleAi(AiProviderException exception, HttpServletRequest request) {
        if (isRateLimitError(exception)) {
            return build(HttpStatus.TOO_MANY_REQUESTS, "A inteligência artificial está temporariamente indisponível (alta demanda) ou com limite de requisições excedido. Por favor, aguarde um minuto antes de tentar novamente ou configure uma chave reserva.", request, List.of());
        }
        return build(HttpStatus.BAD_GATEWAY, exception.getMessage(), request, List.of());
    }

    @ExceptionHandler({BadCredentialsException.class, AuthenticationException.class})
    ResponseEntity<ApiErrorResponse> handleAuth(RuntimeException exception, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "Credenciais invalidas", request, List.of());
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
        log.error("Unhandled API exception path={}", request.getRequestURI(), exception);
        if (isRateLimitError(exception)) {
            return build(HttpStatus.TOO_MANY_REQUESTS, "A inteligência artificial está temporariamente indisponível (alta demanda) ou com limite de requisições excedido. Por favor, aguarde um minuto antes de tentar novamente ou configure uma chave reserva.", request, List.of());
        }
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno inesperado", request, List.of());
    }

    private boolean isRateLimitError(Throwable error) {
        if (error == null) {
            return false;
        }
        String msg = error.getMessage();
        if (msg != null) {
            String upper = msg.toUpperCase();
            if (upper.contains("429") || 
                upper.contains("503") || 
                upper.contains("RESOURCE_EXHAUSTED") || 
                upper.contains("QUOTA EXCEEDED") || 
                upper.contains("LIMIT EXCEEDED") || 
                upper.contains("TOO MANY REQUESTS") ||
                upper.contains("UNAVAILABLE") ||
                upper.contains("HIGH DEMAND") ||
                upper.contains("TRY AGAIN LATER") ||
                upper.contains("TEMPORARY") ||
                upper.contains("INDISPONÍVEL") ||
                upper.contains("INDISPONIVEL")) {
                return true;
            }
        }
        return isRateLimitError(error.getCause());
    }

    private FieldErrorResponse toFieldError(FieldError error) {
        return new FieldErrorResponse(error.getField(), error.getDefaultMessage());
    }

    private ResponseEntity<ApiErrorResponse> build(
            HttpStatus status,
            String message,
            HttpServletRequest request,
            List<FieldErrorResponse> details
    ) {
        ApiErrorResponse body = new ApiErrorResponse(
                OffsetDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI(),
                details
        );
        return ResponseEntity.status(status).body(body);
    }
}
