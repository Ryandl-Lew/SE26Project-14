package com.bionote.common.error;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST),
    MALFORMED_REQUEST(HttpStatus.BAD_REQUEST),
    AUTH_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    AUTH_UNAUTHORIZED(HttpStatus.UNAUTHORIZED),
    AUTH_USERNAME_EXISTS(HttpStatus.CONFLICT),
    AUTH_EMAIL_EXISTS(HttpStatus.CONFLICT),
    LAB_INVITE_INVALID(HttpStatus.BAD_REQUEST),
    LAB_INVITE_UNAVAILABLE(HttpStatus.CONFLICT),
    LAB_APPLICATION_ALREADY_PENDING(HttpStatus.CONFLICT),
    LABORATORY_NOT_FOUND(HttpStatus.NOT_FOUND),
    LABORATORY_ACCESS_DENIED(HttpStatus.FORBIDDEN),
    LAB_ALREADY_MEMBER(HttpStatus.CONFLICT),
    LAB_APPLICATION_NOT_PENDING(HttpStatus.CONFLICT),
    LAB_MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND),
    LAB_FINAL_ADMIN_REQUIRED(HttpStatus.CONFLICT),
    LAB_VERSION_CONFLICT(HttpStatus.CONFLICT),
    DATA_CONFLICT(HttpStatus.CONFLICT),
    ACCESS_DENIED(HttpStatus.FORBIDDEN),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND),
    RECORD_VERSION_CONFLICT(HttpStatus.CONFLICT),
    ILLEGAL_STATE_TRANSITION(HttpStatus.CONFLICT),
    FILE_TYPE_NOT_ALLOWED(HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}
