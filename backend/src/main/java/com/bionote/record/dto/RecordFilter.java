package com.bionote.record.dto;

public record RecordFilter(
        String projectId,
        String keyword,
        String status,
        String ownerId,
        Integer page,
        Integer size
) {
    public RecordFilter {
        if (page == null || page < 0) {
            page = 0;
        }
        if (size == null || size < 1 || size > 100) {
            size = 20;
        }
    }
}
