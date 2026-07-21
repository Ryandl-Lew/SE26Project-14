package com.bionote.file.controller;

import com.bionote.file.entity.Attachment;
import com.bionote.file.repository.AttachmentRepository;
import com.bionote.security.UserPrincipal;
import com.bionote.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.test.context.TestSecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 文件接口集成测试。
 * <p>
 * 使用 H2 内存数据库 + 真实 Spring MVC 栈验证文件上传、下载与软删除全链路。
 * {@link Transactional @Transactional} 保证每个测试方法结束后数据库自动回滚；
 * 磁盘上的文件残留可接受（{@code storage/} 目录已在 {@code .gitignore} 中排除）。
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("FileController 集成测试")
class FileControllerIntegrationTest {

    private static final String TEST_PROJECT_ID = "test-proj-integ-001";
    private static final String TEST_PROJECT_CODE = "INTEG-TEST";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EntityManager entityManager;

    private String seedUserId;

    /**
     * 取种子用户的 ID 并写入测试项目，满足 {@code attachments} 表外键约束。
     * <p>
     * 注意：{@link BeforeEach} 不在 {@link Transactional} 包裹范围内，
     * 插入的 project 行会持久化到 H2 内存中，测试方法回滚时 project 行保留。
     * 每次测试复用同一条 project 记录，互不干扰。
     */
    @BeforeEach
    void setUp() {
        seedUserId = userRepository.findByUsername("li")
                .orElseThrow(() -> new IllegalStateException("种子用户 li 不存在，请检查 DemoDataInitializer"))
                .getId();

        // 幂等插入测试项目（H2 兼容：MERGE INTO 等价于 INSERT OR UPDATE）
        jdbcTemplate.update(
                "MERGE INTO projects (id, code, name, description, status, owner_id, version, created_at, updated_at) " +
                "KEY (id) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)",
                TEST_PROJECT_ID,
                TEST_PROJECT_CODE,
                "Integration Test Project",
                "Created by FileControllerIntegrationTest",
                "IN_PROGRESS",
                seedUserId,
                Instant.now(),
                Instant.now()
        );

        jdbcTemplate.update(
                "MERGE INTO project_members "
                        + "(id, project_id, user_id, role, member_status, joined_at) "
                        + "KEY (project_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
                "test-member-integ-001",
                TEST_PROJECT_ID,
                seedUserId,
                "OWNER",
                "ACTIVE",
                Instant.now()
        );

        TestSecurityContextHolder.setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new UserPrincipal(seedUserId, "li", "李同学"), null, List.of()));
    }

    // ──────────────────────────────────────────────
    // 上传 + 下载 全链路
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("上传含中文名的 CSV 文件后可通过 id 下载，Content-Disposition 包含编码后的中文文件名")
    void testUploadProjectFileAndDownload() throws Exception {
        // ---- 上传 ----
        byte[] content = "col1,col2\nval1,val2\n".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile mockFile = new MockMultipartFile(
                "file",
                "实验数据.csv",
                "text/csv",
                content);

        MvcResult uploadResult = mockMvc.perform(
                        multipart("/api/v1/projects/{projectId}/files", TEST_PROJECT_ID)
                                .file(mockFile)
                                .with(request -> {
                                    request.setMethod("POST"); // enforce POST for multipart
                                    return request;
                                }))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("OK"))
                .andExpect(jsonPath("$.data.originalName").value("实验数据.csv"))
                .andExpect(jsonPath("$.data.mimeType").value("text/csv"))
                .andExpect(jsonPath("$.data.projectId").value(TEST_PROJECT_ID))
                .andExpect(jsonPath("$.data.recordId").doesNotExist())
                .andExpect(jsonPath("$.data.url").isString())
                .andExpect(jsonPath("$.data.size").value((int) content.length))
                .andReturn();

        String attachmentId = extractJsonField(uploadResult, "/data/id");
        assertThat(attachmentId).as("返回的附件 ID 不为空").isNotBlank();

        // 验证数据库元数据已落库
        Optional<Attachment> dbRecord = attachmentRepository.findById(attachmentId);
        assertThat(dbRecord).as("附件在数据库中存在").isPresent();
        assertThat(dbRecord.get().getStorageKey()).as("storageKey 已生成").isNotNull();
        assertThat(dbRecord.get().getUploadedBy()).as("uploadedBy 为当前登录用户")
                .isEqualTo(seedUserId);

        // ---- 下载 ----
        String expectedEncoded = URLEncoder.encode("实验数据.csv", StandardCharsets.UTF_8)
                .replace("+", "%20");

        mockMvc.perform(get("/api/v1/files/{id}/download", attachmentId))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        containsString("attachment; filename=\"" + expectedEncoded + "\"")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        containsString("filename*=UTF-8''" + expectedEncoded)));
    }

    // ──────────────────────────────────────────────
    // 软删除
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("软删除后下载返回 404，数据库记录 deleted=true")
    void testSoftDelete() throws Exception {
        // ---- 上传 ----
        MockMultipartFile mockFile = new MockMultipartFile(
                "file",
                "to-be-deleted.pdf",
                "application/pdf",
                "%PDF-1.4\n%%EOF".getBytes(StandardCharsets.US_ASCII));

        MvcResult uploadResult = mockMvc.perform(
                        multipart("/api/v1/projects/{projectId}/files", TEST_PROJECT_ID)
                                .file(mockFile)
                                .with(request -> {
                                    request.setMethod("POST");
                                    return request;
                                }))
                .andExpect(status().isCreated())
                .andReturn();

        String attachmentId = extractJsonField(uploadResult, "/data/id");

        // ---- 软删除 ----
        mockMvc.perform(delete("/api/v1/files/{id}", attachmentId))
                .andExpect(status().isNoContent());

        // ---- 再次下载应 404 ----
        mockMvc.perform(get("/api/v1/files/{id}/download", attachmentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FILE_NOT_FOUND"));

        // ---- 验证软删除：flush + clear 绕过 JPA 一级缓存后，
        //      @SQLRestriction 使 findById 返回 empty ----
        entityManager.flush();
        entityManager.clear();
        assertThat(attachmentRepository.findById(attachmentId))
                .as("清空一级缓存后，@SQLRestriction 过滤使 findById 返回空")
                .isEmpty();

        // ---- 验证物理记录仍存在且 deleted=true ----
        Integer deleted = jdbcTemplate.queryForObject(
                "SELECT deleted FROM attachments WHERE id = ?",
                Integer.class,
                attachmentId);
        assertThat(deleted).as("数据库物理记录 deleted 字段为 1 (true)").isEqualTo(1);
    }

    // ──────────────────────────────────────────────
    // 边界场景
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("下载不存在的附件 ID 返回 404 FILE_NOT_FOUND")
    void testDownloadNonExistentReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/files/{id}/download", "non-existent-uuid-000000000000"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FILE_NOT_FOUND"));
    }

    @Test
    @DisplayName("删除不存在的附件 ID 返回 404 FILE_NOT_FOUND")
    void testDeleteNonExistentReturns404() throws Exception {
        mockMvc.perform(delete("/api/v1/files/{id}", "non-existent-uuid-000000000000"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("FILE_NOT_FOUND"));
    }

    @Test
    @DisplayName("上传非法扩展名文件返回 400 INVALID_FILE_TYPE")
    void testUploadInvalidExtensionReturns400() throws Exception {
        MockMultipartFile exeFile = new MockMultipartFile(
                "file",
                "virus.exe",
                "application/octet-stream",
                "malicious".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(
                        multipart("/api/v1/projects/{projectId}/files", TEST_PROJECT_ID)
                                .file(exeFile)
                                .with(request -> {
                                    request.setMethod("POST");
                                    return request;
                                }))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_FILE_TYPE"));
    }

    @Test
    @DisplayName("伪造 PDF 扩展名或声明 MIME 不一致时返回 400")
    void testForgedSignatureAndMimeReturn400() throws Exception {
        MockMultipartFile forgedPdf = new MockMultipartFile(
                "file", "forged.pdf", "application/pdf",
                "plain text".getBytes(StandardCharsets.UTF_8));
        mockMvc.perform(multipart("/api/v1/projects/{projectId}/files", TEST_PROJECT_ID)
                        .file(forgedPdf))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_FILE_TYPE"));

        MockMultipartFile wrongMime = new MockMultipartFile(
                "file", "image.png", "application/pdf",
                new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});
        mockMvc.perform(multipart("/api/v1/projects/{projectId}/files", TEST_PROJECT_ID)
                        .file(wrongMime))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_FILE_TYPE"));
    }

    @Test
    @DisplayName("超过 20 MB 的文件返回 413 FILE_TOO_LARGE")
    void testOversizedFileReturns413() throws Exception {
        byte[] oversized = new byte[20 * 1024 * 1024 + 1];
        java.util.Arrays.fill(oversized, (byte) 'a');
        MockMultipartFile file = new MockMultipartFile(
                "file", "too-large.csv", "text/csv", oversized);
        mockMvc.perform(multipart("/api/v1/projects/{projectId}/files", TEST_PROJECT_ID)
                        .file(file))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.code").value("FILE_TOO_LARGE"));
    }

    @Test
    @DisplayName("非项目成员不能下载附件")
    void testUnauthorizedDownloadReturns403() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "private.csv", "text/csv",
                "name,value\nsecret,1\n".getBytes(StandardCharsets.UTF_8));
        MvcResult upload = mockMvc.perform(
                        multipart("/api/v1/projects/{projectId}/files", TEST_PROJECT_ID).file(file))
                .andExpect(status().isCreated()).andReturn();
        String attachmentId = extractJsonField(upload, "/data/id");
        var wang = userRepository.findByUsername("wang").orElseThrow();

        mockMvc.perform(get("/api/v1/files/{id}/download", attachmentId)
                        .with(authentication(new UsernamePasswordAuthenticationToken(
                                new UserPrincipal(wang.getId(), wang.getUsername(), wang.getName()),
                                null, List.of()))))
                .andExpect(status().isForbidden());
    }

    // ──────────────────────────────────────────────
    // 工具方法
    // ──────────────────────────────────────────────

    /** 从 JSON 响应体中按 JSON Pointer 路径提取字符串值。 */
    private String extractJsonField(MvcResult result, String jsonPointer) throws Exception {
        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode node = root.at(jsonPointer);
        if (node.isMissingNode()) {
            throw new AssertionError("JSON path " + jsonPointer + " not found in response: "
                    + result.getResponse().getContentAsString());
        }
        return node.asText();
    }
}
