package com.bionote.search.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

/**
 * 全局/项目内搜索结果的统一数据结构。
 * <p>
 * {@code entityType} 用于区分命中的业务实体类型，前端根据该字段决定
 * 渲染样式及 {@code targetUrl} 的跳转行为。
 */
@Schema(description = "搜索结果统一数据结构")
public record SearchHit(
        @Schema(description = "命中的实体类型",
                allowableValues = {"PROJECT", "RECORD", "TEMPLATE", "FILE"},
                example = "RECORD")
        String entityType,

        @Schema(description = "实体唯一标识", example = "rec-001")
        String entityId,

        @Schema(description = "标题或文件名", example = "PCR 扩增实验记录")
        String title,

        @Schema(description = "匹配内容的摘要片段，关键词使用 &lt;em&gt; 标签高亮",
                example = "本次<em>PCR</em>实验采用 50 μL 反应体系...")
        String snippet,

        @Schema(description = "前端跳转路由，用于搜索结果点击后的页面导航",
                example = "/projects/proj-001/records/rec-001")
        String targetUrl,

        @Schema(description = "实体最后更新时间（带时区偏移）", example = "2026-07-14T09:15:00+08:00")
        OffsetDateTime updatedAt
) {
}
