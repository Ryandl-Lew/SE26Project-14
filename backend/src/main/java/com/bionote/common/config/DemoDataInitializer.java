package com.bionote.common.config;

import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * 演示数据初始化器（开发/联调阶段专用）。
 *
 * <h3>种子数据范围</h3>
 * <ul>
 *   <li>3 个本地用户（li / wang / zhang）</li>
 *   <li>2 个演示项目（p-001 硬编码 ID）</li>
 *   <li>1 条演示实验记录（r-001 硬编码 ID）</li>
 * </ul>
 *
 * <h3>幂等性</h3>
 * 所有插入操作均检查目标数据是否已存在，重复启动不会报主键冲突。
 *
 * <h3>TODO</h3>
 * 后续各领域实体与 Repository 就绪后，应替换为 JPA 实体构建 +
 * Repository 持久化，移除对 {@link JdbcTemplate} 的直接依赖。
 */
@Component
public class DemoDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final SeedProperties properties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public DemoDataInitializer(
            SeedProperties properties,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) {
            return;
        }

        // 用户
        String liId = createUser("li", "李同学", "li@example.com", "李");
        String wangId = createUser("wang", "王同学", "wang@example.com", "王");
        createUser("zhang", "张老师", "pi@example.com", "张");

        // 项目（使用与前端后端联调一致的硬编码 ID）
        createProject("p-001", "PRJ-2026-001", "GFP 融合蛋白表达项目",
                "扩增 GFP 片段并验证融合蛋白表达条件。", "active", liId);
        createProject("p-002", "PRJ-2026-002", "IFN-β 表达检测",
                "qPCR 检测刺激条件下的基因表达变化。", "reviewing", wangId);

        // 实验记录
        createExperimentRecord("r-001", "EXP-20260707-001", "p-001",
                "PCR 扩增 GFP 片段", "PCR", "draft", liId);
    }

    // ──────────────────────────────────────────────
    // 用户（JPA）
    // ──────────────────────────────────────────────

    private String createUser(String username, String name, String email, String avatarText) {
        if (!userRepository.existsByUsername(username)) {
            User saved = userRepository.save(new User(
                    username,
                    passwordEncoder.encode("123456"),
                    name,
                    email,
                    avatarText
            ));
            log.info("Demo 用户已创建: username={}, id={}", username, saved.getId());
            return saved.getId();
        }
        // 用户已存在，查询其 ID
        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElse(null);
    }

    // ──────────────────────────────────────────────
    // 项目（JdbcTemplate — 暂无 ProjectRepository）
    // ──────────────────────────────────────────────

    private void createProject(String id, String code, String name,
                               String description, String status, String ownerId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM projects WHERE id = ?", Integer.class, id);
        if (count != null && count > 0) {
            return;
        }

        Instant now = Instant.now();
        jdbcTemplate.update(
                """
                INSERT INTO projects (id, code, name, description, status, owner_id,
                                      version, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)
                """,
                id, code, name, description, status, ownerId, now, now);
        log.info("Demo 项目已创建: id={}, name={}", id, name);
    }

    // ──────────────────────────────────────────────
    // 实验记录（JdbcTemplate — 暂无 ExperimentRecordRepository）
    // ──────────────────────────────────────────────

    private void createExperimentRecord(String id, String code, String projectId,
                                        String title, String experimentType,
                                        String status, String ownerId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM experiment_records WHERE id = ?", Integer.class, id);
        if (count != null && count > 0) {
            return;
        }

        Instant now = Instant.now();
        // java.time.Instant 在 JDBC 中映射到 TIMESTAMP，需显式转换为 java.sql.Timestamp
        java.sql.Timestamp ts = java.sql.Timestamp.from(now);
        jdbcTemplate.update(
                """
                INSERT INTO experiment_records
                    (id, code, project_id, title, experiment_type, status, owner_id,
                     experiment_date, content_json, version, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), '{}', 0, ?, ?)
                """,
                id, code, projectId, title, experimentType, status, ownerId, ts, ts);
        log.info("Demo 实验记录已创建: id={}, title={}, projectId={}", id, title, projectId);
    }
}
