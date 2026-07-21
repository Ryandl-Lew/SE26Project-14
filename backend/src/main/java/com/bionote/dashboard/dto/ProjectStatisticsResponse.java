package com.bionote.dashboard.dto;

import java.util.List;
import java.util.Map;

public record ProjectStatisticsResponse(
        long totalRecords,
        long totalAttachments,
        Map<String, Long> recordStatusCounts,
        Map<String, Long> reviewDecisionCounts,
        List<TrendPoint> experimentTrend
) {
}
