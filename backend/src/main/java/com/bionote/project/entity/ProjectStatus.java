package com.bionote.project.entity;

/**
 * 项目状态枚举。
 * 进行中 → 已完成 → 待复核 → 已归档
 */
public enum ProjectStatus {
    IN_PROGRESS,    // 进行中
    COMPLETED,      // 已完成
    PENDING_REVIEW, // 待复核（已完成的项目经审核后才可归档）
    ARCHIVED        // 已归档
}
