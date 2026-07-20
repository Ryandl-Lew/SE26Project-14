package com.bionote.performance;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 搜索性能压测 — 10,000 条实验记录 + 2,000 条附件。
 *
 * <h3>测试场景</h3>
 * <ol>
 *   <li>在演示项目 {@code p-001} 下批量插入 10,000 条实验记录（其中约 500 条标题含"测试"关键词）。</li>
 *   <li>额外插入 2,000 条附件（其中约 200 条文件名含"测试"），关联到前 2,000 条记录。</li>
 *   <li>通过 {@link MockMvc} 调用 {@code GET /api/v1/search?keyword=测试}。</li>
 *   <li>断言耗时 &lt; 3,000 ms（文档 §11.1 要求：10,000 条记录，核心请求平均响应不超过 3 秒）。</li>
 *   <li>{@link AfterEach @AfterEach} 按 ID 前缀精确清理，不污染其他测试。</li>
 * </ol>
 *
 * <h3>注意事项</h3>
 * <ul>
 *   <li>本测试类不标注 {@code @Transactional}——压测数据必须在 MockMvc 发起搜索前提交到数据库，
 *       否则搜索服务无法读取未提交行。</li>
 *   <li>数据行 ID 统一使用 {@code perf-} 前缀，清理时只删除匹配前缀的行，
 *       不影响 {@link com.bionote.common.config.DemoDataInitializer} 播种的演示数据。</li>
 * </ul>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("搜索性能压测 — 10,000 条实验记录")
class SearchPerformanceTest {

    /* ======================== 常量 ======================== */

    private static final int RECORD_COUNT = 10_000;
    private static final int ATTACHMENT_COUNT = 2_000;
    private static final int BATCH_SIZE = 500;
    private static final String ID_PREFIX = "perf-";
    private static final String TEST_PROJECT_ID = "p-001";

    /** 搜索关键词 — 约 1/20 的记录标题和 1/50 的记录内容包含此词。 */
    private static final String SEARCH_KEYWORD = "测试";

    /** 性能阈值（毫秒），来自文档 §11.1。 */
    private static final long MAX_ACCEPTABLE_MS = 3_000;

    /* ======================== 注入 ======================== */

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /* ======================== 状态 ======================== */

    /** 演示用户 "li" 的 ID，从数据库查询获得。 */
    private String ownerId;

    /** 所有数据行的统一时间戳，避免逐行 new。 */
    private Timestamp now;

    /* ======================== Setup ======================== */

    @BeforeEach
    void setUp() {
        // ── 1. 获取测试用户 ──
        ownerId = jdbcTemplate.queryForObject(
                "SELECT id FROM users WHERE username = ?", String.class, "li");
        if (ownerId == null || ownerId.isBlank()) {
            throw new IllegalStateException(
                    "DemoDataInitializer 未创建用户 'li'，请检查 seed.enabled 配置");
        }

        now = Timestamp.from(Instant.now());

        // ── 2. 批量插入记录 ──
        System.out.println("╔══════════════════════════════════════════════╗");
        System.out.println("║  搜索性能压测 — 数据准备                       ║");
        System.out.println("╠══════════════════════════════════════════════╣");
        long t0 = System.currentTimeMillis();
        insertRecords();
        long t1 = System.currentTimeMillis();
        System.out.printf("║  实验记录: %5d 条 → %6d ms              ║\n",
                RECORD_COUNT, t1 - t0);

        // ── 3. 批量插入附件 ──
        long t2 = System.currentTimeMillis();
        insertAttachments();
        long t3 = System.currentTimeMillis();
        System.out.printf("║  附件数据: %5d 条 → %6d ms              ║\n",
                ATTACHMENT_COUNT, t3 - t2);
        System.out.printf("║  准备总耗时:         %6d ms              ║\n",
                t3 - t0);
        System.out.println("╚══════════════════════════════════════════════╝");
    }

    /* ======================== 测试 ======================== */

    @Test
    @DisplayName("万级数据下搜索关键词耗时不超过 3 秒")
    void testSearchPerformanceUnder10kData() throws Exception {
        long start = System.currentTimeMillis();

        mockMvc.perform(get("/api/v1/search")
                        .param("keyword", SEARCH_KEYWORD)
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("OK"))
                .andExpect(jsonPath("$.data.total").isNumber())
                .andExpect(jsonPath("$.data.items").isArray());

        long elapsed = System.currentTimeMillis() - start;

        System.out.println("╔══════════════════════════════════════════════╗");
        System.out.printf("║  搜索关键词 : \"%s\"                          ║\n", SEARCH_KEYWORD);
        System.out.printf("║  数据规模   : %d 记录 + %d 附件          ║\n",
                RECORD_COUNT, ATTACHMENT_COUNT);
        System.out.printf("║  搜索耗时   : %d ms                         ║\n", elapsed);
        System.out.printf("║  阈值       : < %d ms                       ║\n", MAX_ACCEPTABLE_MS);
        System.out.printf("║  结果       : %s                          ║\n",
                elapsed < MAX_ACCEPTABLE_MS ? "✅ 通过" : "❌ 不通过");
        System.out.println("╚══════════════════════════════════════════════╝");

        assertTrue(elapsed < MAX_ACCEPTABLE_MS,
                String.format(
                        "万级数据下搜索耗时 %d ms 超过阈值 %d ms！"
                                + "请检查 SQL LIKE 查询是否有全表扫描或缺少索引。",
                        elapsed, MAX_ACCEPTABLE_MS));
    }

    /* ======================== Teardown ======================== */

    @AfterEach
    void tearDown() {
        // 先删附件（部分关联了性能测试记录），再删记录
        int delAtt = jdbcTemplate.update(
                "DELETE FROM attachments WHERE id LIKE ?", ID_PREFIX + "%");
        int delRec = jdbcTemplate.update(
                "DELETE FROM experiment_records WHERE id LIKE ?", ID_PREFIX + "%");

        System.out.printf("[性能测试清理] 附件 %d 条 + 记录 %d 条已删除\n", delAtt, delRec);
    }

    /* ======================== 批量插入 ======================== */

    /**
     * 向 {@code experiment_records} 表插入 10,000 行。
     *
     * <h3>关键词分布</h3>
     * <ul>
     *   <li>约 500 条（每 20 条中 1 条）标题含"测试" → 命中 {@code searchRecords} 的 title LIKE</li>
     *   <li>约 200 条（每 50 条中 1 条）content_json 含"测试" → 命中 content_json LIKE</li>
     *   <li>同时命中标题和内容的行去重后约 490 条独有的，加上附件约 200 条 → 总命中约 690 条</li>
     * </ul>
     */
    private void insertRecords() {
        String sql = """
                INSERT INTO experiment_records
                    (id, code, project_id, template_id, title, experiment_type,
                     status, owner_id, experiment_date, location, content_json,
                     version, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        List<Object[]> batch = new ArrayList<>(BATCH_SIZE);

        for (int i = 1; i <= RECORD_COUNT; i++) {
            Object[] row = buildRecordRow(i);
            batch.add(row);

            if (batch.size() >= BATCH_SIZE) {
                jdbcTemplate.batchUpdate(sql, batch);
                batch.clear();
            }
        }

        // 残余批次
        if (!batch.isEmpty()) {
            jdbcTemplate.batchUpdate(sql, batch);
        }
    }

    /**
     * 向 {@code attachments} 表插入 2,000 行，关联到前 2,000 条性能测试记录。
     *
     * <h3>关键词分布</h3>
     * 约 200 条（每 10 条中 1 条）文件名含"测试" → 命中 {@code searchAttachments} 的 original_name LIKE。
     */
    private void insertAttachments() {
        String sql = """
                INSERT INTO attachments
                    (id, project_id, record_id, original_name, storage_key,
                     mime_type, size_bytes, uploaded_by, created_at, deleted)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;

        List<Object[]> batch = new ArrayList<>(BATCH_SIZE);

        for (int i = 1; i <= ATTACHMENT_COUNT; i++) {
            Object[] row = buildAttachmentRow(i);
            batch.add(row);

            if (batch.size() >= BATCH_SIZE) {
                jdbcTemplate.batchUpdate(sql, batch);
                batch.clear();
            }
        }

        if (!batch.isEmpty()) {
            jdbcTemplate.batchUpdate(sql, batch);
        }
    }

    /* ======================== 行构造 ======================== */

    /** 构造一条 {@code experiment_records} 行。 */
    private Object[] buildRecordRow(int i) {
        String id = ID_PREFIX + "rec-" + String.format("%05d", i);
        String code = "PERF-20260716-" + String.format("%05d", i);
        java.sql.Date expDate = java.sql.Date.valueOf("2026-07-16");

        // 每 20 条中 1 条的标题包含"测试"
        String title = (i % 20 == 0)
                ? "性能测试-PCR扩增-" + String.format("%04d", i)
                : "PCR扩增实验-" + String.format("%04d", i);

        // 每 50 条中 1 条的 content_json 包含"测试"
        String contentJson = (i % 50 == 0)
                ? "{\"purpose\":\"测试基因片段扩增效率\",\"steps\":[]}"
                : "{\"purpose\":\"扩增目标片段\",\"steps\":[]}";

        return new Object[]{
                id,                          // id
                code,                        // code (UNIQUE)
                TEST_PROJECT_ID,             // project_id
                null,                        // template_id (nullable)
                title,                       // title
                "PCR",                       // experiment_type
                "completed",                 // status
                ownerId,                     // owner_id
                expDate,                     // experiment_date
                null,                        // location (nullable)
                contentJson,                 // content_json
                0,                           // version
                now,                         // created_at
                now,                         // updated_at
        };
    }

    /** 构造一条 {@code attachments} 行。 */
    private Object[] buildAttachmentRow(int i) {
        String id = ID_PREFIX + "att-" + String.format("%05d", i);
        // 关联到第 i 条性能测试记录
        String recordId = ID_PREFIX + "rec-" + String.format("%05d", i);

        // 每 10 条中 1 条的文件名包含"测试"
        String originalName = (i % 10 == 0)
                ? "测试-凝胶图-" + String.format("%04d", i) + ".png"
                : "gel-electrophoresis-" + String.format("%04d", i) + ".png";

        String storageKey = "perf/fake/" + id + ".png";

        return new Object[]{
                id,                          // id
                null,                        // project_id = null（记录附件）
                recordId,                    // record_id
                originalName,                // original_name
                storageKey,                  // storage_key (UNIQUE)
                "image/png",                 // mime_type
                102_400L,                    // size_bytes (100 KB)
                ownerId,                     // uploaded_by
                now,                         // created_at
                false,                       // deleted
        };
    }
}
