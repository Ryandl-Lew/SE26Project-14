package com.bionote.dashboard.dto;

import com.bionote.collaboration.dto.ActivityResponse;

import java.util.List;

public record DashboardResponse(
        long totalProjects,
        long totalRecords,
        long inProgressRecords,
        long pendingReviewRecords,
        List<SimpleProjectInfo> recentProjects,
        List<SimpleRecordInfo> recentRecords,
        List<PendingTaskInfo> pendingReviewTasks,
        List<PendingTaskInfo> supplementTasks,
        List<ActivityResponse> recentActivities
) {
}
