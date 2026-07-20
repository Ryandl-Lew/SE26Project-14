package com.bionote.file.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.file.dto.AttachmentResponse;
import com.bionote.file.entity.Attachment;
import com.bionote.file.repository.AttachmentRepository;
import com.bionote.project.entity.ProjectRole;
import com.bionote.project.service.ProjectAccessService;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.service.RecordQueryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

/**
 * 文件附件业务服务，负责附件元数据的生命周期管理。
 * <p>
 * 职责边界：
 * <ul>
 *   <li>与 {@link StorageService} 协作完成文件的物理存取；</li>
 *   <li>维护 {@code attachments} 表的元数据（软删除、查询、恢复）；</li>
 *   <li>将实体转换为前端所需的 {@link AttachmentResponse} DTO。</li>
 * </ul>
 * <p>
 * 项目成员、记录归属和文件修改权限在本服务中统一校验。
 */
@Service
public class FileService {

    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    private final StorageService storageService;
    private final AttachmentRepository attachmentRepository;
    private final ProjectAccessService projectAccessService;
    private final RecordQueryService recordQueryService;

    public FileService(StorageService storageService,
                       AttachmentRepository attachmentRepository,
                       ProjectAccessService projectAccessService,
                       RecordQueryService recordQueryService) {
        this.storageService = storageService;
        this.attachmentRepository = attachmentRepository;
        this.projectAccessService = projectAccessService;
        this.recordQueryService = recordQueryService;
    }

    /**
     * 上传项目级文件。
     *
     * @param projectId     项目 ID
     * @param file          客户端上传的文件
     * @param currentUserId 当前登录用户 ID
     * @return 附件响应体（含下载 URL）
     */
    @Transactional
    public AttachmentResponse uploadProjectFile(String projectId,
                                                MultipartFile file,
                                                String currentUserId) {
        projectAccessService.requireCanUploadFile(projectId, currentUserId);
        String storageKey = storageService.store(file);
        Attachment attachment = new Attachment(
                projectId,
                null,                       // 项目级文件无 recordId
                file.getOriginalFilename(),
                storageKey,
                file.getContentType(),
                file.getSize(),
                currentUserId
        );
        Attachment saved = attachmentRepository.save(attachment);
        log.info("项目文件已上传: projectId={}, attachmentId={}, storageKey={}",
                projectId, saved.getId(), storageKey);
        return toResponse(saved);
    }

    /**
     * 上传实验记录附件。
     * <p>
     * {@code projectId} 参数用于调用方做项目归属校验（当前由 Controller 层完成），
     * 实体仅存储 {@code recordId} 以遵守数据库 CHECK 约束。
     *
     * @param recordId      实验记录 ID
     * @param projectId     所属项目 ID（用于权限校验上下文，暂不落库）
     * @param file          客户端上传的文件
     * @param currentUserId 当前登录用户 ID
     * @return 附件响应体（含下载 URL）
     */
    @Transactional
    public AttachmentResponse uploadRecordAttachment(String recordId,
                                                     String projectId,
                                                     MultipartFile file,
                                                     String currentUserId) {
        ExperimentRecord record = recordQueryService.requireRecord(recordId);
        if (!record.getProjectId().equals(projectId)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "记录不属于指定项目");
        }
        projectAccessService.requireCanUploadFile(projectId, currentUserId);
        String storageKey = storageService.store(file);
        Attachment attachment = new Attachment(
                null,                       // 记录附件无 projectId（遵守 CHECK 约束）
                recordId,
                file.getOriginalFilename(),
                storageKey,
                file.getContentType(),
                file.getSize(),
                currentUserId
        );
        Attachment saved = attachmentRepository.save(attachment);
        log.info("记录附件已上传: projectId={}, recordId={}, attachmentId={}, storageKey={}",
                projectId, recordId, saved.getId(), storageKey);
        return toResponse(saved);
    }

    /**
     * 下载文件资源。
     * <p>
     * 仅返回 Spring {@link Resource} 对象；Content-Disposition 等 HTTP 头
     * 由 Controller 层设置。
     *
     * @param attachmentId 附件 ID
     * @return 文件资源及附件实体（供 Controller 获取原始文件名）
     */
    @Transactional(readOnly = true)
    public AttachmentDownloadResult download(String attachmentId, String currentUserId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.FILE_NOT_FOUND, "附件不存在或已删除: " + attachmentId));

        // 防御性检查：同一事务内 JPA 一级缓存可能返回已标记删除的实体，
        // 绕过 @SQLRestriction("deleted = false")。此处显式拦截已软删除记录。
        if (attachment.getDeleted()) {
            throw new BusinessException(
                    ErrorCode.FILE_NOT_FOUND, "附件不存在或已删除: " + attachmentId);
        }

        requireCanRead(attachment, currentUserId);

        Resource resource = storageService.loadAsResource(attachment.getStorageKey());
        return new AttachmentDownloadResult(attachment, resource);
    }

    /**
     * 软删除附件 — 仅标记 deleted=true，不触碰物理文件。
     * <p>
     * 物理文件的清理由后台定时任务根据过期时间统一处理，
     * 不在用户触发删除时同步执行，以保障恢复功能可用。
     *
     * @param attachmentId 附件 ID
     */
    @Transactional
    public void softDelete(String attachmentId, String currentUserId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.FILE_NOT_FOUND, "附件不存在或已删除: " + attachmentId));
        requireCanModify(attachment, currentUserId);
        attachment.markDeleted();
        attachmentRepository.save(attachment);
        log.info("附件已软删除（物理文件保留待定时清理）: attachmentId={}, storageKey={}",
                attachmentId, attachment.getStorageKey());
    }

    /**
     * 恢复已软删除的附件。
     * <p>
     * 使用原生查询绕过 {@code @SQLRestriction} 以找到已删除记录。
     * 注意：软删除时物理文件可能已被清理，恢复仅恢复元数据；
     * 若物理文件已被清理，后续下载/预览将返回 404，届时由前端提示。
     *
     * @param attachmentId 附件 ID
     */
    @Transactional
    public void restore(String attachmentId, String currentUserId) {
        Attachment attachment = attachmentRepository.findByIdIncludingDeleted(attachmentId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.FILE_NOT_FOUND, "附件不存在: " + attachmentId));
        if (!attachment.getDeleted()) {
            throw new BusinessException(ErrorCode.MALFORMED_REQUEST, "附件未被删除，无需恢复");
        }
        requireCanModify(attachment, currentUserId);
        attachment.markRestored();
        attachmentRepository.save(attachment);
        log.info("附件已恢复: attachmentId={}", attachmentId);
    }

    // ──────────────────────────────────────────────
    // 列表查询
    // ──────────────────────────────────────────────

    /**
     * 查询项目下附件列表。
     *
     * @param projectId      项目 ID
     * @param includeDeleted 是否包含已软删除的附件
     * @return 附件响应体列表（按创建时间降序）
     */
    @Transactional(readOnly = true)
    public List<AttachmentResponse> listProjectFiles(
            String projectId, boolean includeDeleted, String currentUserId) {
        projectAccessService.requireCanRead(projectId, currentUserId);
        List<Attachment> attachments = includeDeleted
                ? attachmentRepository.findAllByProjectIdIncludingDeleted(projectId)
                : attachmentRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        return attachments.stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * 查询实验记录下附件列表。
     *
     * @param recordId       实验记录 ID
     * @param includeDeleted 是否包含已软删除的附件
     * @return 附件响应体列表（按创建时间降序）
     */
    @Transactional(readOnly = true)
    public List<AttachmentResponse> listRecordAttachments(
            String recordId, boolean includeDeleted, String currentUserId) {
        recordQueryService.getRecord(recordId, currentUserId);
        List<Attachment> attachments = includeDeleted
                ? attachmentRepository.findAllByRecordIdIncludingDeleted(recordId)
                : attachmentRepository.findByRecordIdOrderByCreatedAtDesc(recordId);
        return attachments.stream()
                .map(this::toResponse)
                .toList();
    }

    // ──────────────────────────────────────────────
    // DTO 转换
    // ──────────────────────────────────────────────

    /**
     * 将实体转换为前端响应 DTO。
     */
    private AttachmentResponse toResponse(Attachment entity) {
        return new AttachmentResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getRecordId(),
                entity.getOriginalName(),
                entity.getMimeType(),
                entity.getSize(),
                "/api/v1/files/" + entity.getId() + "/download",
                entity.getUploadedBy(),
                entity.getCreatedAt() != null
                        ? entity.getCreatedAt().atOffset(ZoneOffset.ofHours(8))
                        : null,
                entity.getDeleted()
        );
    }

    private void requireCanRead(Attachment attachment, String currentUserId) {
        projectAccessService.requireCanRead(resolveProjectId(attachment), currentUserId);
    }

    private void requireCanModify(Attachment attachment, String currentUserId) {
        if (currentUserId.equals(attachment.getUploadedBy())) {
            return;
        }
        projectAccessService.requireAnyOf(
                resolveProjectId(attachment), currentUserId, ProjectRole.OWNER);
    }

    private String resolveProjectId(Attachment attachment) {
        if (attachment.getProjectId() != null) {
            return attachment.getProjectId();
        }
        return recordQueryService.requireRecord(attachment.getRecordId()).getProjectId();
    }

    // ──────────────────────────────────────────────
    // 内部类型
    // ──────────────────────────────────────────────

    /**
     * 下载结果聚合，包含附件实体（用于获取原始文件名等元数据）和文件资源。
     */
    public record AttachmentDownloadResult(Attachment attachment, Resource resource) {
    }
}
