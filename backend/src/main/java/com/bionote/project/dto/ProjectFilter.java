package com.bionote.project.dto;

public record ProjectFilter(
        String keyword,
        String status,
        String ownerId,
        Integer page,
        Integer size
) {
    public ProjectFilter {
        if (page == null || page < 0) {
            page = 0;
        }
        if (size == null || size < 1 || size > 100) {
            size = 20;
        }
    }
}
