package com.bionote.common.web;

import org.slf4j.MDC;

public final class TraceContext {
    public static final String TRACE_ID = "traceId";

    private TraceContext() {
    }

    public static String currentTraceId() {
        return MDC.get(TRACE_ID);
    }
}
