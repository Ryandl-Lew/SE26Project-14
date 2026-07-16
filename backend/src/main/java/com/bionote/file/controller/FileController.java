package com.bionote.file.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.file.dto.AttachmentResponse;
import com.bionote.file.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 文件与附件管理 REST 接口。
 *
 * <h3>TODO — 安全增强</h3>
 * <ul>
 *   <li>上传接口：调用 {@code ProjectAccessService} 校验用户是否为项目成员。</li>
 *   <li>下载接口：调用 {@code ProjectAccessService} 校验用户对附件所属项目/记录的读取权限。</li>
 *   <li>删除接口：调用 {@code ProjectAccessService} 校验用户是否为项目 Owner 或附件上传者。</li>
 *   <li>{@code currentUserId} 应从 {@code SecurityContextHolder} 或
 *       {@code @AuthenticationPrincipal} 获取，当前 Mock 为 {@code "mock-user-id"}。</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Files", description = "文件上传、下载、删除与恢复")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    // TODO: 接入认证模块后替换为 SecurityContextHolder 获取的当前用户 ID
    private static final String MOCK_USER_ID = "mock-user-id";

    // ──────────────────────────────────────────────
    // 上传
    // ──────────────────────────────────────────────

    @PostMapping(value = "/projects/{projectId}/files",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "上传项目文件",
            description = "向指定项目上传一个文件附件。文件大小限制 20 MB，允许的扩展名见服务端配置。")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "上传成功，返回附件元数据",
                    content = @Content(schema = @Schema(implementation = AttachmentResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "文件类型不支持或文件为空")
    })
    public ApiResponse<AttachmentResponse> uploadProjectFile(
            @Parameter(description = "项目 ID") @PathVariable String projectId,
            @Parameter(description = "要上传的文件") @RequestParam("file") MultipartFile file) {

        // TODO: 调用 ProjectAccessService 校验用户是否为 projectId 对应项目的成员
        AttachmentResponse response = fileService.uploadProjectFile(
                projectId, file, MOCK_USER_ID);
        return ApiResponse.success(response);
    }

    @PostMapping(value = "/records/{recordId}/attachments",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "上传实验记录附件",
            description = "向指定实验记录上传一个附件。需要提供所属项目 ID 用于权限校验。")
    public ApiResponse<AttachmentResponse> uploadRecordAttachment(
            @Parameter(description = "实验记录 ID") @PathVariable String recordId,
            @Parameter(description = "所属项目 ID（用于权限校验）") @RequestParam("projectId") String projectId,
            @Parameter(description = "要上传的文件") @RequestParam("file") MultipartFile file) {

        // TODO: 调用 ProjectAccessService 校验用户是否为 projectId 对应项目的成员
        AttachmentResponse response = fileService.uploadRecordAttachment(
                recordId, projectId, file, MOCK_USER_ID);
        return ApiResponse.success(response);
    }

    // ──────────────────────────────────────────────
    // 列表
    // ──────────────────────────────────────────────

    @GetMapping("/projects/{projectId}/files")
    @Operation(summary = "查询项目文件列表",
            description = "返回指定项目下的附件元数据列表，按创建时间降序排列。"
                    + "支持 includeDeleted=true 查询含已删除附件。")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "文件列表",
                    content = @Content(schema = @Schema(implementation = AttachmentResponse.class)))
    })
    public ApiResponse<List<AttachmentResponse>> listProjectFiles(
            @Parameter(description = "项目 ID") @PathVariable String projectId,
            @Parameter(description = "是否包含已删除附件")
            @RequestParam(value = "includeDeleted", defaultValue = "false") boolean includeDeleted) {

        // TODO: P2 ProjectAccessService 权限校验 — 校验当前用户是否为项目成员
        List<AttachmentResponse> files = fileService.listProjectFiles(projectId, includeDeleted);
        return ApiResponse.success(files);
    }

    @GetMapping("/records/{recordId}/attachments")
    @Operation(summary = "查询实验记录附件列表",
            description = "返回指定实验记录下的附件元数据列表，按创建时间降序排列。"
                    + "支持 includeDeleted=true 查询含已删除附件。")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "附件列表",
                    content = @Content(schema = @Schema(implementation = AttachmentResponse.class)))
    })
    public ApiResponse<List<AttachmentResponse>> listRecordAttachments(
            @Parameter(description = "实验记录 ID") @PathVariable String recordId,
            @Parameter(description = "是否包含已删除附件")
            @RequestParam(value = "includeDeleted", defaultValue = "false") boolean includeDeleted) {

        // TODO: P2 ProjectAccessService 权限校验 — 校验当前用户对记录的读取权限
        List<AttachmentResponse> attachments = fileService.listRecordAttachments(recordId, includeDeleted);
        return ApiResponse.success(attachments);
    }

    // ──────────────────────────────────────────────
    // 下载
    // ──────────────────────────────────────────────

    @GetMapping("/files/{id}/download")
    @Operation(summary = "下载文件",
            description = "根据附件 ID 下载文件。响应头自动设置 Content-Disposition 以触发浏览器下载。")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "文件二进制流"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "附件不存在或已删除")
    })
    public ResponseEntity<Resource> download(
            @Parameter(description = "附件 ID") @PathVariable("id") String attachmentId,
            HttpServletResponse servletResponse) throws IOException {

        // TODO: 调用 ProjectAccessService 校验当前用户对附件的读取权限
        FileService.AttachmentDownloadResult result = fileService.download(attachmentId);

        String encodedFilename = URLEncoder.encode(
                result.attachment().getOriginalName(), StandardCharsets.UTF_8)
                .replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        result.attachment().getMimeType() != null
                                ? result.attachment().getMimeType()
                                : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + encodedFilename + "\"; " +
                                "filename*=UTF-8''" + encodedFilename)
                .body(result.resource());
    }

    // ──────────────────────────────────────────────
    // 预览
    // ──────────────────────────────────────────────

    @GetMapping("/files/{id}/preview")
    @Operation(summary = "预览文件（图片/PDF）",
            description = "与下载接口共享同一底层资源，但设置 Content-Disposition 为 inline，"
                    + "使浏览器直接在页面内打开图片或 PDF，而非触发下载。")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "文件二进制流（inline）"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "附件不存在或已删除")
    })
    public ResponseEntity<Resource> preview(
            @Parameter(description = "附件 ID") @PathVariable("id") String attachmentId,
            HttpServletResponse servletResponse) throws IOException {

        // TODO: P2 ProjectAccessService 权限校验 — 校验当前用户对附件的读取权限
        FileService.AttachmentDownloadResult result = fileService.download(attachmentId);

        String encodedFilename = URLEncoder.encode(
                result.attachment().getOriginalName(), StandardCharsets.UTF_8)
                .replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        result.attachment().getMimeType() != null
                                ? result.attachment().getMimeType()
                                : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + encodedFilename + "\"; " +
                                "filename*=UTF-8''" + encodedFilename)
                .body(result.resource());
    }

    // ──────────────────────────────────────────────
    // 删除 & 恢复
    // ──────────────────────────────────────────────

    @DeleteMapping("/files/{id}")
    @Operation(summary = "删除文件（软删除）",
            description = "将附件标记为已删除。删除后可通过恢复接口找回。"
                    + "物理文件的清理由后台定时任务异步处理。")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "删除成功"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "附件不存在或已删除")
    })
    public ApiResponse<Void> delete(
            @Parameter(description = "附件 ID") @PathVariable("id") String attachmentId) {

        // TODO: 调用 ProjectAccessService 校验用户是否为附件上传者或项目 Owner
        fileService.softDelete(attachmentId);
        return ApiResponse.success();
    }

    @PutMapping("/files/{id}/restore")
    @Operation(summary = "恢复已删除文件",
            description = "将已软删除的附件恢复为正常状态。仅当附件处于已删除状态时有效。")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "恢复成功"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "附件不存在"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "附件未被删除，无需恢复")
    })
    public ApiResponse<Void> restore(
            @Parameter(description = "附件 ID") @PathVariable("id") String attachmentId) {

        // TODO: 调用 ProjectAccessService 校验用户是否为附件上传者或项目 Owner
        fileService.restore(attachmentId);
        return ApiResponse.success();
    }
}
