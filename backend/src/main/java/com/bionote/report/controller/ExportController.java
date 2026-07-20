package com.bionote.report.controller;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.report.service.ExportService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 报告导出 REST 接口。
 *
 * <h3>接口设计</h3>
 * 不经过 {@code ApiResponse} 包装，直接将文件字节流写入
 * {@link HttpServletResponse}，由浏览器触发下载。
 *
 * <h3>导出格式</h3>
 * <ul>
 *   <li>实验记录 → {@code ?format=pdf}（默认）或 {@code ?format=md}</li>
 *   <li>项目 → {@code ?format=excel}（默认，目前唯一支持）</li>
 * </ul>
 *
 * 导出服务从真实记录数据生成文件，并在 Service 层校验项目读取权限。
 */
@RestController
@RequestMapping("/api/v1/export")
@Tag(name = "Export", description = "实验记录与项目数据导出（PDF / Markdown / Excel）")
public class ExportController {

    private static final Logger log = LoggerFactory.getLogger(ExportController.class);

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    // ──────────────────────────────────────────────
    // 实验记录导出
    // ──────────────────────────────────────────────

    @GetMapping("/records/{recordId}")
    @Operation(
            summary = "导出实验记录",
            description = "将指定实验记录导出为 PDF 或 Markdown 文件。"
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "文件二进制流"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "不支持的导出格式"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "文件生成失败")
    })
    public void exportRecord(
            @Parameter(description = "实验记录 ID")
            @PathVariable String recordId,

            @Parameter(description = "导出格式", schema =
            @io.swagger.v3.oas.annotations.media.Schema(
                    allowableValues = {"pdf", "md"}, defaultValue = "pdf"))
            @RequestParam(defaultValue = "pdf") String format,

            @AuthenticationPrincipal UserPrincipal principal,

            HttpServletResponse response) throws IOException {

        log.info("导出实验记录: recordId={}, format={}", recordId, format);

        switch (format.toLowerCase()) {
            case "md" -> {
                byte[] bytes = exportService.exportRecordToMarkdown(recordId, principal.id());
                writeResponse(response, bytes,
                        "record-" + recordId + ".md",
                        "text/markdown; charset=UTF-8");
            }
            case "pdf" -> {
                byte[] bytes = exportService.exportRecordToPdf(recordId, principal.id());
                writeResponse(response, bytes,
                        "record-" + recordId + ".pdf",
                        MediaType.APPLICATION_PDF_VALUE);
            }
            default ->
                throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                        "不支持的导出格式: " + format + "（允许值：pdf, md）");
        }
    }

    // ──────────────────────────────────────────────
    // 项目导出
    // ──────────────────────────────────────────────

    @GetMapping("/projects/{projectId}")
    @Operation(
            summary = "导出项目实验记录一览表",
            description = "将指定项目下的实验记录导出为 Excel 工作簿。"
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Excel 文件二进制流"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "不支持的导出格式"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "500",
                    description = "文件生成失败")
    })
    public void exportProject(
            @Parameter(description = "项目 ID")
            @PathVariable String projectId,

            @Parameter(description = "导出格式", schema =
            @io.swagger.v3.oas.annotations.media.Schema(
                    allowableValues = {"excel"}, defaultValue = "excel"))
            @RequestParam(defaultValue = "excel") String format,

            @AuthenticationPrincipal UserPrincipal principal,

            HttpServletResponse response) throws IOException {

        log.info("导出项目: projectId={}, format={}", projectId, format);

        if (!"excel".equalsIgnoreCase(format)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "不支持的导出格式: " + format + "（允许值：excel）");
        }

        byte[] bytes = exportService.exportProjectToExcel(projectId, principal.id());
        writeResponse(response, bytes,
                "project-" + projectId + "-records.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    // ──────────────────────────────────────────────
    // 响应写入工具
    // ──────────────────────────────────────────────

    /**
     * 将字节数组写入 HTTP 响应，自动设置下载头。
     *
     * <h3>文件名编码策略（RFC 5987）</h3>
     * <ul>
     *   <li>{@code filename="..."}：旧式 ASCII 备选名（URL 编码后的形式）</li>
     *   <li>{@code filename*=UTF-8''...}：RFC 5987 UTF-8 编码，现代浏览器优先解析</li>
     * </ul>
     * 与 {@code FileController.download} 保持一致的编码逻辑。
     *
     * @param response   HTTP 响应
     * @param bytes      文件内容
     * @param filename   下载文件名
     * @param contentType MIME 类型
     */
    private void writeResponse(HttpServletResponse response,
                               byte[] bytes,
                               String filename,
                               String contentType) throws IOException {
        String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8)
                .replace("+", "%20");

        response.setContentType(contentType);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + encodedFilename + "\"; " +
                "filename*=UTF-8''" + encodedFilename);
        response.setContentLength(bytes.length);

        response.getOutputStream().write(bytes);
        response.getOutputStream().flush();

        log.debug("文件已写入响应: filename={}, size={}, contentType={}",
                filename, bytes.length, contentType);
    }
}
