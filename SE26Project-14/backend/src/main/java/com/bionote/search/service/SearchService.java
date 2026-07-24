package com.bionote.search.service;

import com.bionote.common.api.PageResponse;
import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.project.MemberRepository;
import com.bionote.project.entity.ProjectMember;
import com.bionote.search.dto.SearchHit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class SearchService {

    private static final Logger log = LoggerFactory.getLogger(SearchService.class);

    private static final int SNIPPET_RADIUS = 80;

    private final JdbcTemplate jdbcTemplate;
    private final MemberRepository memberRepository;

    public SearchService(JdbcTemplate jdbcTemplate, MemberRepository memberRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.memberRepository = memberRepository;
    }

    // ──────────────────────────────────────────────
    // 公开 API
    // ──────────────────────────────────────────────

    /**
     * 执行搜索，返回分页结果。
     *
     * @param keyword       搜索关键词（必填）
     * @param projectId     限定项目范围，为 {@code null} 时搜索所有可访问项目
     * @param currentUserId 当前登录用户 ID
     * @param page          页码（0-based）
     * @param size          每页条数
     * @return 分页搜索结果
     * @throws BusinessException 若指定的 {@code projectId} 不在用户可访问列表中
     */
    @Transactional(readOnly = true)
    public PageResponse<SearchHit> search(String keyword,
                                          String projectId,
                                          String currentUserId,
                                          int page,
                                          int size) {
        // ── 1. 权限拦截 ──
        List<String> accessibleIds = getAccessibleProjectIds(currentUserId);

        if (accessibleIds.isEmpty()) {
            log.info("用户 {} 无可访问项目，返回空结果", currentUserId);
            return new PageResponse<>(List.of(), page, size, 0, 0);
        }

        // ── 2. 项目范围校验 ──
        if (projectId != null && !projectId.isBlank()) {
            if (!accessibleIds.contains(projectId)) {
                throw new BusinessException(ErrorCode.ACCESS_DENIED,
                        "无权访问该项目: " + projectId);
            }
            // 限定搜索范围至指定项目
            accessibleIds = List.of(projectId);
        }

        // ── 3. 聚合查询 ──
        List<SearchHit> allHits = new ArrayList<>();
        allHits.addAll(searchProjects(keyword, accessibleIds));
        allHits.addAll(searchRecords(keyword, accessibleIds));
        allHits.addAll(searchAttachments(keyword, accessibleIds));

        log.debug("搜索完成: keyword=\"{}\", accessibleIds={}, 命中数={}",
                keyword, accessibleIds, allHits.size());

        // ── 4. 排序（按更新时间降序） ──
        allHits.sort(Comparator.comparing(SearchHit::updatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

        // ── 5. 内存分页 ──
        int total = allHits.size();
        int totalPages = total == 0 ? 0 : (total + size - 1) / size;
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, total);
        List<SearchHit> pageItems = fromIndex < total
                ? List.copyOf(allHits.subList(fromIndex, toIndex))
                : List.of();

        return new PageResponse<>(pageItems, page, size, total, totalPages);
    }

    private List<String> getAccessibleProjectIds(String userId) {
        List<ProjectMember> members = memberRepository.findByUserId(userId);
        if (members.isEmpty()) {
            log.debug("用户 {} 不是任何项目的成员，返回空列表", userId);
            return List.of();
        }
        List<String> projectIds = members.stream()
                .map(ProjectMember::getProjectId)
                .distinct()
                .toList();
        log.debug("用户 {} 可访问的项目: {}", userId, projectIds);
        return projectIds;
    }

    // ──────────────────────────────────────────────
    // 各表查询
    // ──────────────────────────────────────────────

    /**
     * 在 {@code projects} 表的 name 和 description 中搜索。
     */
    private List<SearchHit> searchProjects(String keyword, List<String> projectIds) {
        String likePattern = "%" + keyword + "%";
        String inClause = placeholders(projectIds.size());

        String sql = """
                SELECT id, name, description, updated_at
                FROM projects
                WHERE archived_at IS NULL
                  AND id IN (%s)
                  AND (LOWER(name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))
                """.formatted(inClause);

        List<Object> params = new ArrayList<>(projectIds);
        params.add(likePattern);
        params.add(likePattern);

        return jdbcTemplate.query(sql,
                (rs, rowNum) -> mapProjectRow(rs, keyword),
                params.toArray());
    }

    /**
     * 在 {@code experiment_records} 表的 title 和 content_json 中搜索。
     */
    private List<SearchHit> searchRecords(String keyword, List<String> projectIds) {
        String likePattern = "%" + keyword + "%";
        String inClause = placeholders(projectIds.size());

        String sql = """
                SELECT id, project_id, title, content_json, updated_at
                FROM experiment_records
                WHERE archived_at IS NULL
                  AND project_id IN (%s)
                  AND (LOWER(title) LIKE LOWER(?) OR LOWER(content_json) LIKE LOWER(?))
                """.formatted(inClause);

        List<Object> params = new ArrayList<>(projectIds);
        params.add(likePattern);
        params.add(likePattern);

        return jdbcTemplate.query(sql,
                (rs, rowNum) -> mapRecordRow(rs, keyword),
                params.toArray());
    }

    /**
     * 在 {@code attachments} 表的 original_name 中搜索。
     * <p>
     * 附件分两类：
     * <ul>
     *   <li>项目级附件：{@code project_id} 直接有值；</li>
     *   <li>记录级附件：{@code record_id} 有值，需通过 JOIN
     *       {@code experiment_records} 获取其所属项目。</li>
     * </ul>
     * 使用 UNION ALL 合并两类查询结果。
     */
    private List<SearchHit> searchAttachments(String keyword, List<String> projectIds) {
        String likePattern = "%" + keyword + "%";
        String inClause = placeholders(projectIds.size());

        String sql = """
                SELECT id, project_id, record_id, original_name, created_at AS updated_at
                FROM attachments
                WHERE deleted = FALSE
                  AND project_id IN (%s)
                  AND LOWER(original_name) LIKE LOWER(?)
                UNION ALL
                SELECT a.id, r.project_id, a.record_id, a.original_name, a.created_at AS updated_at
                FROM attachments a
                         JOIN experiment_records r ON a.record_id = r.id
                WHERE a.deleted = FALSE
                  AND r.archived_at IS NULL
                  AND r.project_id IN (%s)
                  AND LOWER(a.original_name) LIKE LOWER(?)
                """.formatted(inClause, inClause);

        List<Object> params = new ArrayList<>(projectIds);
        params.add(likePattern);
        params.addAll(projectIds);
        params.add(likePattern);

        return jdbcTemplate.query(sql,
                (rs, rowNum) -> mapAttachmentRow(rs, keyword),
                params.toArray());
    }

    // ──────────────────────────────────────────────
    // 行映射
    // ──────────────────────────────────────────────

    /** 将 projects 行映射为 SearchHit。 */
    private SearchHit mapProjectRow(ResultSet rs, String keyword) throws java.sql.SQLException {
        String id = rs.getString("id");
        String name = rs.getString("name");
        String description = rs.getString("description");
        Timestamp updatedAt = rs.getTimestamp("updated_at");

        String snippet = buildSnippet(description, keyword);
        if (snippet.isEmpty()) {
            snippet = buildSnippet(name, keyword);
        }

        return new SearchHit(
                "PROJECT",
                id,
                name,
                snippet,
                "/projects/" + id,
                toOffsetDateTime(updatedAt)
        );
    }

    /** 将 experiment_records 行映射为 SearchHit。 */
    private SearchHit mapRecordRow(ResultSet rs, String keyword) throws java.sql.SQLException {
        String id = rs.getString("id");
        String projectId = rs.getString("project_id");
        String title = rs.getString("title");
        String contentJson = rs.getString("content_json");
        Timestamp updatedAt = rs.getTimestamp("updated_at");

        String snippet = buildSnippet(title, keyword);
        if (contentJson != null && !contentJson.isBlank()) {
            String plainText = extractRecordText(contentJson);
            if (!plainText.isEmpty()) {
                String contentSnippet = buildSnippet(plainText, keyword);
                if (!contentSnippet.isEmpty()) {
                    snippet = contentSnippet;
                }
            }
        }

        return new SearchHit(
                "RECORD",
                id,
                title,
                snippet,
                "/projects/" + projectId + "/records/" + id,
                toOffsetDateTime(updatedAt)
        );
    }

    /** 从 content_json 中提取纯文本（purpose + section bodies），避免在搜索结果中展示原始 JSON。 */
    private String extractRecordText(String contentJson) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            @SuppressWarnings("unchecked")
            var root = mapper.readValue(contentJson, java.util.Map.class);
            StringBuilder sb = new StringBuilder();
            Object purpose = root.get("purpose");
            if (purpose instanceof String s && !s.isBlank()) {
                sb.append(s).append(" ");
            }
            Object sections = root.get("sections");
            if (sections instanceof java.util.List<?> list) {
                for (Object section : list) {
                    if (section instanceof java.util.Map<?, ?> map) {
                        Object body = map.get("body");
                        if (body instanceof String s && !s.isBlank()) {
                            sb.append(s).append(" ");
                        }
                    }
                }
            }
            return sb.toString().trim();
        } catch (Exception e) {
            return "";
        }
    }

    /** 将 attachments 行映射为 SearchHit。 */
    private SearchHit mapAttachmentRow(ResultSet rs, String keyword) throws java.sql.SQLException {
        String id = rs.getString("id");
        String projectId = rs.getString("project_id");
        String recordId = rs.getString("record_id");
        String originalName = rs.getString("original_name");
        Timestamp updatedAt = rs.getTimestamp("updated_at");

        String targetUrl;
        if (recordId != null) {
            targetUrl = "/projects/" + projectId + "/records/" + recordId;
        } else {
            targetUrl = "/projects/" + projectId;
        }

        return new SearchHit(
                "FILE",
                id,
                originalName,
                buildSnippet(originalName, keyword),
                targetUrl,
                toOffsetDateTime(updatedAt)
        );
    }

    // ──────────────────────────────────────────────
    // 工具方法
    // ──────────────────────────────────────────────

    /**
     * 生成 {@code LIKE} 查询所需的占位符字符串，如 {@code "?, ?, ?"}。
     */
    private static String placeholders(int count) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < count; i++) {
            if (i > 0) sb.append(", ");
            sb.append("?");
        }
        return sb.toString();
    }

    /**
     * 从文本中提取包含关键词的摘要片段，关键词用 {@code <em>} 标签包裹。
     *
     * @param text    原始文本（可能为 {@code null}）
     * @param keyword 搜索关键词
     * @return 高亮摘要片段；若文本为空则返回空字符串
     */
    static String buildSnippet(String text, String keyword) {
        if (text == null || text.isBlank() || keyword == null || keyword.isBlank()) {
            return "";
        }

        String lowerText = text.toLowerCase();
        String lowerKeyword = keyword.toLowerCase();
        int idx = lowerText.indexOf(lowerKeyword);

        if (idx < 0) {
            // 关键词未匹配，返回文本开头部分
            return escapeHtml(truncate(text, SNIPPET_RADIUS * 2));
        }

        int start = Math.max(0, idx - SNIPPET_RADIUS);
        int end = Math.min(text.length(), idx + keyword.length() + SNIPPET_RADIUS);

        StringBuilder sb = new StringBuilder();
        if (start > 0) {
            sb.append("...");
        }

        // 关键词之前
        sb.append(escapeHtml(text.substring(start, idx)));
        // 关键词（高亮）
        sb.append("<em>").append(escapeHtml(text.substring(idx, idx + keyword.length()))).append("</em>");
        // 关键词之后
        sb.append(escapeHtml(text.substring(idx + keyword.length(), end)));

        if (end < text.length()) {
            sb.append("...");
        }

        return sb.toString();
    }

    /**
     * 截断文本至指定长度，超出部分用 {@code ...} 表示。
     */
    private static String truncate(String text, int maxLen) {
        if (text.length() <= maxLen) return text;
        return text.substring(0, maxLen) + "...";
    }

    /**
     * 对 HTML 特殊字符进行转义，防止 XSS。
     */
    private static String escapeHtml(String text) {
        if (text == null) return "";
        StringBuilder sb = new StringBuilder(text.length());
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            switch (c) {
                case '<' -> sb.append("&lt;");
                case '>' -> sb.append("&gt;");
                case '&' -> sb.append("&amp;");
                case '"' -> sb.append("&quot;");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * 将 SQL {@link Timestamp} 转换为 {@link OffsetDateTime}（Asia/Shanghai 时区）。
     */
    private static OffsetDateTime toOffsetDateTime(Timestamp ts) {
        if (ts == null) return null;
        return ts.toInstant().atOffset(ZoneOffset.ofHours(8));
    }
}
