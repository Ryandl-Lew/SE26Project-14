package com.bionote.project.entity;

/**
 * 项目状态枚举。
 * 公开 API 允许 OWNER 将任一未归档项目直接归档。
 * COMPLETED 与 PENDING_REVIEW 仅为兼容已有数据保留，不再作为归档前置阶段。
 */
public enum ProjectStatus {
    IN_PROGRESS,    // 进行中
    COMPLETED,      // 已完成（兼容状态）
    PENDING_REVIEW, // 待复核（兼容状态）
    ARCHIVED        // 已归档
}
