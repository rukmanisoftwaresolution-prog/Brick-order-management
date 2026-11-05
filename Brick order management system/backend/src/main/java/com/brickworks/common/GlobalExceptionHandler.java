package com.brickworks.common;

import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> notFound(ResourceNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> conflict(ConflictException exception) {
        return error(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> invalid(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining("; "));
        return error(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler({ConstraintViolationException.class, DataIntegrityViolationException.class})
    public ResponseEntity<ApiResponse<Map<String, String>>> invalidData(Exception exception) {
        return error(HttpStatus.BAD_REQUEST, "The request conflicts with stored data or a field constraint.");
    }

    private String formatFieldError(FieldError error) {
        return error.getField() + ": " + error.getDefaultMessage();
    }

    private ResponseEntity<ApiResponse<Map<String, String>>> error(HttpStatus status, String message) {
        ApiResponse<Map<String, String>> body = new ApiResponse<>(false, message, null, Instant.now());
        return ResponseEntity.status(status).body(body);
    }
}
