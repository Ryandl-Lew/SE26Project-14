package com.bionote.common.error;

public class BusinessException extends RuntimeException {
    private final ErrorCode errorCode;
    private final java.util.Map<String, String> fieldErrors;

    public BusinessException(ErrorCode errorCode, String message) {
        this(errorCode, message, null);
    }

    public BusinessException(ErrorCode errorCode,
                             String message,
                             java.util.Map<String, String> fieldErrors) {
        super(message);
        this.errorCode = errorCode;
        this.fieldErrors = fieldErrors == null ? null : java.util.Map.copyOf(fieldErrors);
    }

    public ErrorCode errorCode() {
        return errorCode;
    }

    public java.util.Map<String, String> fieldErrors() {
        return fieldErrors;
    }
}
