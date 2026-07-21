package com.bionote.dashboard.service;

import com.bionote.dashboard.dto.ProjectStatisticsResponse;
import com.bionote.dashboard.dto.TrendPoint;
import com.bionote.project.service.ProjectAccessService;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProjectStatisticsService {
    private final ProjectAccessService accessService;
    private final JdbcTemplate jdbcTemplate;

    public ProjectStatisticsService(ProjectAccessService accessService,
                                    JdbcTemplate jdbcTemplate) {
        this.accessService = accessService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public ProjectStatisticsResponse getStatistics(String projectId, String currentUserId) {
        accessService.requireCanRead(projectId, currentUserId);
        Map<String, Long> statusCounts = new LinkedHashMap<>();
        jdbcTemplate.query("""
                        SELECT status, COUNT(*) AS total
                        FROM experiment_records WHERE project_id = ?
                        GROUP BY status ORDER BY status
                        """,
                rs -> {
                    statusCounts.put(rs.getString("status"), rs.getLong("total"));
                }, projectId);

        Map<String, Long> reviewCounts = new LinkedHashMap<>();
        jdbcTemplate.query("""
                        SELECT rv.decision, COUNT(*) AS total
                        FROM reviews rv JOIN experiment_records r ON r.id = rv.record_id
                        WHERE r.project_id = ? GROUP BY rv.decision ORDER BY rv.decision
                        """,
                rs -> {
                    reviewCounts.put(rs.getString("decision"), rs.getLong("total"));
                }, projectId);

        List<TrendPoint> trend = jdbcTemplate.query("""
                        SELECT experiment_date, COUNT(*) AS total
                        FROM experiment_records WHERE project_id = ?
                        GROUP BY experiment_date ORDER BY experiment_date
                        """,
                (rs, rowNum) -> new TrendPoint(
                        rs.getDate("experiment_date").toLocalDate(), rs.getLong("total")),
                projectId);

        Long attachmentCount = jdbcTemplate.queryForObject("""
                        SELECT COUNT(*) FROM attachments a
                        LEFT JOIN experiment_records r ON r.id = a.record_id
                        WHERE a.deleted = FALSE AND (a.project_id = ? OR r.project_id = ?)
                        """, Long.class, projectId, projectId);
        long totalRecords = statusCounts.values().stream().mapToLong(Long::longValue).sum();
        return new ProjectStatisticsResponse(totalRecords,
                attachmentCount == null ? 0 : attachmentCount,
                statusCounts, reviewCounts, trend);
    }
}
