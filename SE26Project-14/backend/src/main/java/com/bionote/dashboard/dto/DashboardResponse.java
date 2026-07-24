package com.bionote.dashboard.dto;

import java.util.List;

public record DashboardResponse(
        long totalProjects,
        long totalRecords,
        long inProgressRecords,
        long pendingReviewRecords,
        List<SimpleProjectInfo> recentProjects,
        List<SimpleRecordInfo> recentRecords,
        List<PendingTaskInfo> pendingTasks
) {
}
