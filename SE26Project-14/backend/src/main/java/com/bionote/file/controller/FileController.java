package com.bionote.file.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.file.dto.AttachmentResponse;
import com.bionote.file.service.FileService;
import com.bionote.security.UserPrincipal;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Files", description = "文件上传、下载、删除与恢复")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping(value = "/projects/{projectId}/files",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "上传项目文件")
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
            @Parameter(description = "要上传的文件") @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {
        AttachmentResponse response = fileService.uploadProjectFile(projectId, file, principal.id());
        return ApiResponse.success(response);
    }

    @PostMapping(value = "/records/{recordId}/attachments",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "上传实验记录附件")
    public ApiResponse<AttachmentResponse> uploadRecordAttachment(
            @Parameter(description = "实验记录 ID") @PathVariable String recordId,
            @Parameter(description = "所属项目 ID（用于权限校验）") @RequestParam("projectId") String projectId,
            @Parameter(description = "要上传的文件") @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {
        AttachmentResponse response = fileService.uploadRecordAttachment(recordId, projectId, file, principal.id());
        return ApiResponse.success(response);
    }

    @GetMapping("/projects/{projectId}/files")
    @Operation(summary = "查询项目文件列表")
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
        List<AttachmentResponse> files = fileService.listProjectFiles(projectId, includeDeleted);
        return ApiResponse.success(files);
    }

    @GetMapping("/records/{recordId}/attachments")
    @Operation(summary = "查询实验记录附件列表")
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
        List<AttachmentResponse> attachments = fileService.listRecordAttachments(recordId, includeDeleted);
        return ApiResponse.success(attachments);
    }

    @GetMapping("/files/{id}/download")
    @Operation(summary = "下载文件")
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

    @GetMapping("/files/{id}/preview")
    @Operation(summary = "预览文件（图片/PDF）")
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

    @DeleteMapping("/files/{id}")
    @Operation(summary = "删除文件（软删除）")
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
        fileService.softDelete(attachmentId);
        return ApiResponse.success();
    }

    @PutMapping("/files/{id}/restore")
    @Operation(summary = "恢复已删除文件")
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
        fileService.restore(attachmentId);
        return ApiResponse.success();
    }
}
