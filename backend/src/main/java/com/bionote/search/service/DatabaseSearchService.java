package com.bionote.search.service;

import com.bionote.common.api.PageResponse;
import com.bionote.project.service.ProjectAccessService;
import com.bionote.search.dto.SearchHit;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Service
public class DatabaseSearchService {
    private static final int SNIPPET_RADIUS = 80;

    private final JdbcTemplate jdbcTemplate;
    private final ProjectAccessService accessService;

    public DatabaseSearchService(JdbcTemplate jdbcTemplate, ProjectAccessService accessService) {
        this.jdbcTemplate = jdbcTemplate;
        this.accessService = accessService;
    }

    @Transactional(readOnly = true)
    public PageResponse<SearchHit> search(String keyword,
                                          String projectId,
                                          String currentUserId,
                                          int page,
                                          int size) {
        String normalizedKeyword = keyword.trim();
        boolean projectScoped = projectId != null && !projectId.isBlank();
        List<String> projectIds;
        if (projectScoped) {
            accessService.requireCanRead(projectId, currentUserId);
            projectIds = List.of(projectId);
        } else {
            projectIds = accessService.getAccessibleProjectIds(currentUserId);
        }

        SearchQuery query = buildUnionQuery(
                normalizedKeyword, projectIds, currentUserId, projectScoped);
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM (" + query.sql() + ") search_results",
                Long.class, query.params().toArray());
        long total = count == null ? 0 : count;

        List<Object> pageParams = new ArrayList<>(query.params());
        pageParams.add(size);
        pageParams.add((long) page * size);
        List<SearchHit> items = jdbcTemplate.query(
                query.sql() + " ORDER BY updated_at DESC LIMIT ? OFFSET ?",
                (rs, rowNum) -> mapHit(rs, normalizedKeyword),
                pageParams.toArray());
        int totalPages = total == 0 ? 0 : (int) ((total + size - 1) / size);
        return new PageResponse<>(items, page, size, total, totalPages);
    }

    private SearchQuery buildUnionQuery(String keyword,
                                        List<String> projectIds,
                                        String currentUserId,
                                        boolean projectScoped) {
        List<String> parts = new ArrayList<>();
        List<Object> params = new ArrayList<>();
        String like = "%" + keyword + "%";

        if (!projectIds.isEmpty()) {
            String in = placeholders(projectIds.size());
            addProjectQuery(parts, params, in, projectIds, like);
            addRecordQuery(parts, params, in, projectIds, like);
            addAttachmentQueries(parts, params, in, projectIds, like);
            if (projectScoped) {
                addActivityQuery(parts, params, in, projectIds, like);
            }
        }
        if (!projectScoped) {
            parts.add("""
                    SELECT 'TEMPLATE' AS entity_type, t.id AS entity_id,
                           NULL AS project_id, NULL AS record_id,
                           t.name AS title, t.description AS source_text, t.updated_at AS updated_at
                    FROM experiment_templates t
                    WHERE (t.built_in = TRUE OR t.created_by = ?)
                      AND (LOWER(t.name) LIKE LOWER(?) OR LOWER(t.category) LIKE LOWER(?)
                           OR LOWER(t.description) LIKE LOWER(?))
                    """);
            Collections.addAll(params, currentUserId, like, like, like);
        }
        return new SearchQuery(String.join(" UNION ALL ", parts), params);
    }

    private void addProjectQuery(List<String> parts, List<Object> params, String in,
                                 List<String> projectIds, String like) {
        parts.add("""
                SELECT 'PROJECT' AS entity_type, p.id AS entity_id,
                       p.id AS project_id, NULL AS record_id,
                       p.name AS title, p.description AS source_text, p.updated_at AS updated_at
                FROM projects p
                WHERE p.id IN (%s)
                  AND (LOWER(p.name) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?))
                """.formatted(in));
        params.addAll(projectIds);
        Collections.addAll(params, like, like);
    }

    private void addRecordQuery(List<String> parts, List<Object> params, String in,
                                List<String> projectIds, String like) {
        parts.add("""
                SELECT 'RECORD' AS entity_type, r.id AS entity_id,
                       r.project_id AS project_id, r.id AS record_id,
                       r.title AS title, r.content_json AS source_text, r.updated_at AS updated_at
                FROM experiment_records r
                WHERE r.project_id IN (%s)
                  AND (LOWER(r.title) LIKE LOWER(?) OR LOWER(r.content_json) LIKE LOWER(?))
                """.formatted(in));
        params.addAll(projectIds);
        Collections.addAll(params, like, like);
    }

    private void addAttachmentQueries(List<String> parts, List<Object> params, String in,
                                      List<String> projectIds, String like) {
        parts.add("""
                SELECT 'ATTACHMENT' AS entity_type, a.id AS entity_id,
                       a.project_id AS project_id, NULL AS record_id,
                       a.original_name AS title, a.original_name AS source_text,
                       a.created_at AS updated_at
                FROM attachments a
                WHERE a.deleted = FALSE AND a.project_id IN (%s)
                  AND LOWER(a.original_name) LIKE LOWER(?)
                """.formatted(in));
        params.addAll(projectIds);
        params.add(like);

        parts.add("""
                SELECT 'ATTACHMENT' AS entity_type, a.id AS entity_id,
                       r.project_id AS project_id, a.record_id AS record_id,
                       a.original_name AS title, a.original_name AS source_text,
                       a.created_at AS updated_at
                FROM attachments a JOIN experiment_records r ON r.id = a.record_id
                WHERE a.deleted = FALSE AND r.project_id IN (%s)
                  AND LOWER(a.original_name) LIKE LOWER(?)
                """.formatted(in));
        params.addAll(projectIds);
        params.add(like);
    }

    private void addActivityQuery(List<String> parts, List<Object> params, String in,
                                  List<String> projectIds, String like) {
        parts.add("""
                SELECT 'ACTIVITY' AS entity_type, ac.id AS entity_id,
                       ac.project_id AS project_id,
                       CASE WHEN ac.target_type = 'RECORD' THEN ac.target_id ELSE NULL END AS record_id,
                       ac.summary AS title, ac.summary AS source_text, ac.created_at AS updated_at
                FROM activities ac
                WHERE ac.project_id IN (%s)
                  AND (LOWER(ac.summary) LIKE LOWER(?) OR LOWER(ac.action) LIKE LOWER(?)
                       OR LOWER(ac.target_type) LIKE LOWER(?))
                """.formatted(in));
        params.addAll(projectIds);
        Collections.addAll(params, like, like, like);
    }

    private SearchHit mapHit(ResultSet rs, String keyword) throws java.sql.SQLException {
        String type = rs.getString("entity_type");
        String id = rs.getString("entity_id");
        String projectId = rs.getString("project_id");
        String recordId = rs.getString("record_id");
        String title = rs.getString("title");
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        String targetUrl = switch (type) {
            case "PROJECT" -> "/projects/" + id;
            case "RECORD" -> "/projects/" + projectId + "/records/" + id;
            case "TEMPLATE" -> "/templates/" + id;
            case "ATTACHMENT", "ACTIVITY" -> recordId == null
                    ? "/projects/" + projectId
                    : "/projects/" + projectId + "/records/" + recordId;
            default -> "/";
        };
        return new SearchHit(type, id, title,
                buildSnippet(rs.getString("source_text"), keyword), targetUrl,
                updatedAt == null ? null
                        : updatedAt.toInstant().atOffset(ZoneOffset.ofHours(8)));
    }

    private static String placeholders(int count) {
        return String.join(", ", Collections.nCopies(count, "?"));
    }

    static String buildSnippet(String text, String keyword) {
        if (text == null || text.isBlank() || keyword == null || keyword.isBlank()) {
            return "";
        }
        String lowerText = text.toLowerCase(Locale.ROOT);
        int index = lowerText.indexOf(keyword.toLowerCase(Locale.ROOT));
        if (index < 0) {
            return escapeHtml(text.length() <= SNIPPET_RADIUS * 2
                    ? text : text.substring(0, SNIPPET_RADIUS * 2) + "...");
        }
        int start = Math.max(0, index - SNIPPET_RADIUS);
        int end = Math.min(text.length(), index + keyword.length() + SNIPPET_RADIUS);
        return (start > 0 ? "..." : "") + escapeHtml(text.substring(start, index))
                + "<em>" + escapeHtml(text.substring(index, index + keyword.length())) + "</em>"
                + escapeHtml(text.substring(index + keyword.length(), end))
                + (end < text.length() ? "..." : "");
    }

    private static String escapeHtml(String text) {
        return text.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace("\"", "&quot;");
    }

    private record SearchQuery(String sql, List<Object> params) {
    }
}
