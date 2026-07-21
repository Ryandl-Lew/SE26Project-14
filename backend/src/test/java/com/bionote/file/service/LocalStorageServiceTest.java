package com.bionote.file.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.file.config.FileStorageProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * {@link LocalStorageService} 的单元测试。
 * <p>
 * 每个测试用例使用独立的临时目录作为上传根目录，测试完成后自动清理。
 */
@DisplayName("LocalStorageService 单元测试")
class LocalStorageServiceTest {

    private Path tempDir;
    private LocalStorageService service;

    @BeforeEach
    void setUp() throws IOException {
        tempDir = Files.createTempDirectory("bionote-test-");
        FileStorageProperties props = new FileStorageProperties();
        props.setUploadDir(tempDir.toString());
        props.setAllowedExtensions(List.of("jpg", "png", "pdf", "csv", "xls", "xlsx"));
        service = new LocalStorageService(props);
    }

    @AfterEach
    void tearDown() throws IOException {
        if (Files.exists(tempDir)) {
            try (Stream<Path> walk = Files.walk(tempDir)) {
                walk.sorted(Comparator.reverseOrder())
                        .forEach(path -> {
                            try {
                                Files.deleteIfExists(path);
                            } catch (IOException ignored) {
                                // 忽略清理异常，避免掩盖测试失败
                            }
                        });
            }
        }
    }

    // ──────────────────────────────────────────────
    // store 正常流程
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("store() 正常上传 PDF 文件，返回 UUID 重命名后的 storageKey")
    void testStoreValidFile() throws Exception {
        byte[] content = validContent("pdf");
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "实验报告.pdf",
                "application/pdf",
                content);

        String storageKey = service.store(file).storageKey();

        assertThat(storageKey).isNotNull();
        assertThat(storageKey).endsWith(".pdf");

        // 验证 storageKey 格式: UUID + ".pdf"（36 位 UUID + 点号 + 3 位扩展名 = 40 字符）
        String uuidPart = storageKey.substring(0, storageKey.lastIndexOf('.'));
        assertThat(uuidPart).containsPattern("^[0-9a-f\\-]{36}$")
                .as("storageKey 前缀应为标准 UUID 格式");

        // 验证文件确实已写入磁盘
        Path storedFile = tempDir.resolve(storageKey);
        assertThat(storedFile).exists();
        assertThat(storedFile).hasContent(new String(content, StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("store() 上传不同扩展名的文件，各自生成合法 storageKey")
    void testStoreMultipleExtensions() throws Exception {
        String[][] cases = {
                {"photo.jpg", "image/jpeg"},
                {"chart.png", "image/png"},
                {"data.csv", "text/csv"},
                {"sheet.xls", "application/vnd.ms-excel"},
                {"sheet.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
        };

        for (String[] c : cases) {
            String originalName = c[0];
            String mime = c[1];
            String expectedExt = originalName.substring(originalName.lastIndexOf('.') + 1);

            MockMultipartFile file = new MockMultipartFile(
                    "file", originalName, mime, validContent(expectedExt));
            String storageKey = service.store(file).storageKey();

            assertThat(storageKey).endsWith("." + expectedExt);
            assertThat(tempDir.resolve(storageKey)).exists();
        }
    }

    // ──────────────────────────────────────────────
    // store 异常流程
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("store() 上传非法扩展名文件，抛出 INVALID_FILE_TYPE")
    void testStoreInvalidExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malware.exe",
                "application/octet-stream",
                "evil".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> service.store(file))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).errorCode())
                .isEqualTo(ErrorCode.INVALID_FILE_TYPE);
    }

    @Test
    @DisplayName("store() 上传无扩展名文件，抛出 INVALID_FILE_TYPE")
    void testStoreNoExtension() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "README",
                "text/plain",
                "readme content".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> service.store(file))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).errorCode())
                .isEqualTo(ErrorCode.INVALID_FILE_TYPE);
    }

    @Test
    @DisplayName("store() 上传空文件，抛出 VALIDATION_ERROR")
    void testStoreEmptyFile() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.pdf",
                "application/pdf",
                new byte[0]);

        assertThatThrownBy(() -> service.store(file))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).errorCode())
                .isEqualTo(ErrorCode.VALIDATION_ERROR);
    }

    // ──────────────────────────────────────────────
    // loadAsResource
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("loadAsResource() 根据 storageKey 加载已存储的文件")
    void testLoadAsResource() throws Exception {
        byte[] content = validContent("pdf");
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", content);
        String storageKey = service.store(file).storageKey();

        Resource resource = service.loadAsResource(storageKey);

        assertThat(resource).isNotNull();
        assertThat(resource.exists()).isTrue();
        assertThat(resource.isReadable()).isTrue();
        assertThat(resource.getContentAsByteArray()).isEqualTo(content);
    }

    @Test
    @DisplayName("loadAsResource() 加载不存在的文件，抛出 PHYSICAL_FILE_MISSING")
    void testLoadAsResourceFileNotFound() {
        String nonExistentKey = "00000000-0000-0000-0000-000000000000.pdf";

        assertThatThrownBy(() -> service.loadAsResource(nonExistentKey))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).errorCode())
                .isEqualTo(ErrorCode.PHYSICAL_FILE_MISSING);
    }

    // ──────────────────────────────────────────────
    // delete
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("delete() 物理删除已存储的文件")
    void testDelete() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "to-delete.pdf", "application/pdf",
                validContent("pdf"));
        String storageKey = service.store(file).storageKey();
        assertThat(tempDir.resolve(storageKey)).exists();

        service.delete(storageKey);

        assertThat(tempDir.resolve(storageKey)).doesNotExist();
    }

    @Test
    @DisplayName("delete() 删除不存在的文件不抛异常（幂等）")
    void testDeleteNonExistentIsIdempotent() {
        String nonExistentKey = "ffffffff-ffff-ffff-ffff-ffffffffffff.pdf";
        // 不应抛出任何异常
        service.delete(nonExistentKey);
    }

    // ──────────────────────────────────────────────
    // 路径穿越防御
    // ──────────────────────────────────────────────

    @Test
    @DisplayName("loadAsResource() 检测到路径穿越时抛出 ACCESS_DENIED")
    void testPathTraversalDefenseLoad() {
        // storageKey 包含 "../" 试图跳出上传根目录
        String maliciousKey = "../../../etc/passwd";

        assertThatThrownBy(() -> service.loadAsResource(maliciousKey))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).errorCode())
                .isEqualTo(ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("delete() 检测到路径穿越时抛出 ACCESS_DENIED")
    void testPathTraversalDefenseDelete() {
        String maliciousKey = "../../../etc/passwd";

        assertThatThrownBy(() -> service.delete(maliciousKey))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).errorCode())
                .isEqualTo(ErrorCode.ACCESS_DENIED);
    }

    @Test
    @DisplayName("loadAsResource() 检测到绝对路径注入时抛出 ACCESS_DENIED")
    void testPathTraversalDefenseAbsolutePath() {
        // 绝对路径企图绕过上传根目录
        String maliciousKey = "/etc/passwd";

        assertThatThrownBy(() -> service.loadAsResource(maliciousKey))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).errorCode())
                .isEqualTo(ErrorCode.ACCESS_DENIED);
    }

    private static byte[] validContent(String extension) throws IOException {
        return switch (extension) {
            case "jpg" -> new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00};
            case "png" -> new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
            case "pdf" -> "%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF"
                    .getBytes(StandardCharsets.US_ASCII);
            case "csv" -> "name,value\nPCR,1\n".getBytes(StandardCharsets.UTF_8);
            case "xls" -> new byte[]{(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0,
                    (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1};
            case "xlsx" -> xlsxBytes();
            default -> throw new IllegalArgumentException(extension);
        };
    }

    private static byte[] xlsxBytes() throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(output)) {
            zip.putNextEntry(new ZipEntry("[Content_Types].xml"));
            zip.write("<Types/>".getBytes(StandardCharsets.UTF_8));
            zip.closeEntry();
            zip.putNextEntry(new ZipEntry("xl/workbook.xml"));
            zip.write("<workbook/>".getBytes(StandardCharsets.UTF_8));
            zip.closeEntry();
        }
        return output.toByteArray();
    }
}
