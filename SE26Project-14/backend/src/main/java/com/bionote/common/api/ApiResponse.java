package com.bionote.common.api;

import com.bionote.common.web.TraceContext;

public record ApiResponse<T>(String code, String message, T data, String traceId) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("OK", null, data, TraceContext.currentTraceId());
    }

    public static ApiResponse<Void> success() {
        return success(null);
    }
}
