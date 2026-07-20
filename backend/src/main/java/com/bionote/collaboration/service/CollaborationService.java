package com.bionote.collaboration.service;

import com.bionote.collaboration.dto.*;
import com.bionote.collaboration.entity.Comment;
import com.bionote.collaboration.entity.Review;
import com.bionote.collaboration.repository.CommentRepository;
import com.bionote.collaboration.repository.ReviewRepository;
import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.project.entity.Activity;
import com.bionote.project.entity.ProjectMember;
import com.bionote.project.entity.ProjectRole;
import com.bionote.project.ActivityRepository;
import com.bionote.project.MemberRepository;
import com.bionote.project.ProjectRepository;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.entity.RecordStatus;
import com.bionote.record.entity.RecordVersion;
import com.bionote.record.repository.ExperimentRecordRepository;
import com.bionote.record.repository.RecordVersionRepository;
import com.bionote.user.entity.User;
import com.bionote.security.UserPrincipal;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CollaborationService {

    private static final Logger log = LoggerFactory.getLogger(CollaborationService.class);

    private final ExperimentRecordRepository experimentRecordRepository;
    private final CommentRepository commentRepository;
    private final ReviewRepository reviewRepository;
    private final RecordVersionRepository recordVersionRepository;
    private final UserRepository userRepository;
    private final ActivityRepository activityRepository;
    private final ProjectRepository projectRepository;
    private final MemberRepository memberRepository;

    public CollaborationService(ExperimentRecordRepository experimentRecordRepository,
                                CommentRepository commentRepository,
                                ReviewRepository reviewRepository,
                                RecordVersionRepository recordVersionRepository,
                                UserRepository userRepository,
                                ActivityRepository activityRepository,
                                ProjectRepository projectRepository,
                                MemberRepository memberRepository) {
        this.experimentRecordRepository = experimentRecordRepository;
        this.commentRepository = commentRepository;
        this.reviewRepository = reviewRepository;
        this.recordVersionRepository = recordVersionRepository;
        this.userRepository = userRepository;
        this.activityRepository = activityRepository;
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional
    public CommentResponse addComment(String recordId, CommentRequest request, UserPrincipal principal) {
        ExperimentRecord record = experimentRecordRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "记录不存在"));

        Comment comment = new Comment(recordId, principal.id(), request.category(), request.content());
        comment = commentRepository.save(comment);

        Activity activity = new Activity(record.getProjectId(), principal.id(), "COMMENT",
                "RECORD", recordId, "添加了评论");
        activityRepository.save(activity);

        log.info("Comment added: recordId={}, author={}", recordId, principal.username());
        return CommentResponse.from(comment, principal.name());
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(String recordId) {
        if (!experimentRecordRepository.existsById(recordId)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "记录不存在");
        }

        List<Comment> comments = commentRepository.findByRecordIdOrderByCreatedAtAsc(recordId);

        return comments.stream().map(comment -> {
            User author = userRepository.findById(comment.getAuthorId()).orElse(null);
            String authorName = author != null ? author.getName() : "未知用户";
            return CommentResponse.from(comment, authorName);
        }).toList();
    }

    @Transactional
    public void startRecord(String recordId, WorkflowRequest request, UserPrincipal principal) {
        ExperimentRecord record = experimentRecordRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "记录不存在"));

        if (record.getStatus() != RecordStatus.DRAFT) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION, "仅草稿状态的记录可以开始");
        }

        if (!record.getVersion().equals(request.version())) {
            throw new BusinessException(ErrorCode.RECORD_VERSION_CONFLICT, "记录已被修改，请刷新后重试");
        }

        verifyRecordOwner(record, principal);

        record.setStatus(RecordStatus.IN_PROGRESS);
        experimentRecordRepository.save(record);

        recordVersionRepository.save(new RecordVersion(record.getId(), record.getVersion(),
                record.getContentJson(), principal.id(), "开始记录"));

        Activity activity = new Activity(record.getProjectId(), principal.id(), "START",
                "RECORD", recordId, "开始了记录");
        activityRepository.save(activity);

        log.info("Record started: id={}, by={}", recordId, principal.username());
    }

    @Transactional
    public void submitRecord(String recordId, WorkflowRequest request, UserPrincipal principal) {
        ExperimentRecord record = experimentRecordRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "记录不存在"));

        if (record.getStatus() != RecordStatus.DRAFT
                && record.getStatus() != RecordStatus.IN_PROGRESS
                && record.getStatus() != RecordStatus.SUPPLEMENT) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION, "当前状态不允许提交审核");
        }

        if (!record.getVersion().equals(request.version())) {
            throw new BusinessException(ErrorCode.RECORD_VERSION_CONFLICT, "记录已被修改，请刷新后重试");
        }

        verifyRecordOwner(record, principal);

        record.setStatus(RecordStatus.PENDING_REVIEW);
        experimentRecordRepository.save(record);

        recordVersionRepository.save(new RecordVersion(record.getId(), record.getVersion(),
                record.getContentJson(), principal.id(), "提交审核"));

        Activity activity = new Activity(record.getProjectId(), principal.id(), "SUBMIT",
                "RECORD", recordId, "提交了审核");
        activityRepository.save(activity);

        log.info("Record submitted: id={}, by={}", recordId, principal.username());
    }

    @Transactional
    public void reviewRecord(String recordId, ReviewRequest request, UserPrincipal principal) {
        ExperimentRecord record = experimentRecordRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "记录不存在"));

        if (record.getStatus() != RecordStatus.PENDING_REVIEW) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION, "仅待审核状态的记录可以审核");
        }

        if (!record.getVersion().equals(request.version())) {
            throw new BusinessException(ErrorCode.RECORD_VERSION_CONFLICT, "记录已被修改，请刷新后重试");
        }

        checkReviewPermission(record, principal);

        if ("REJECT".equals(request.decision()) && (request.reason() == null || request.reason().isBlank())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "驳回时需要填写原因");
        }

        RecordStatus newStatus = "APPROVE".equals(request.decision()) ? RecordStatus.COMPLETED : RecordStatus.REJECTED;
        record.setStatus(newStatus);
        experimentRecordRepository.save(record);

        String reason = request.reason() != null ? request.reason() : "";
        Review review = new Review(recordId, principal.id(), request.decision(), reason);
        reviewRepository.save(review);

        String reviewReason = "APPROVE".equals(request.decision()) ? "审核通过" : "驳回";
        recordVersionRepository.save(new RecordVersion(record.getId(), record.getVersion(),
                record.getContentJson(), principal.id(), reviewReason));

        String action = "APPROVE".equals(request.decision()) ? "APPROVE" : "REJECT";
        String summary = "APPROVE".equals(request.decision()) ? "审核通过" : "驳回了记录";
        Activity activity = new Activity(record.getProjectId(), principal.id(), action,
                "RECORD", recordId, summary);
        activityRepository.save(activity);

        log.info("Record reviewed: id={}, decision={}, by={}", recordId, request.decision(), principal.username());
    }

    @Transactional
    public void archiveRecord(String recordId, WorkflowRequest request, UserPrincipal principal) {
        ExperimentRecord record = experimentRecordRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "记录不存在"));

        if (record.getStatus() == RecordStatus.ARCHIVED) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION, "记录已归档");
        }

        if (!record.getVersion().equals(request.version())) {
            throw new BusinessException(ErrorCode.RECORD_VERSION_CONFLICT, "记录已被修改，请刷新后重试");
        }

        verifyRecordOwner(record, principal);

        record.setStatus(RecordStatus.ARCHIVED);
        experimentRecordRepository.save(record);

        recordVersionRepository.save(new RecordVersion(record.getId(), record.getVersion(),
                record.getContentJson(), principal.id(), "归档记录"));

        Activity activity = new Activity(record.getProjectId(), principal.id(), "ARCHIVE",
                "RECORD", recordId, "归档了记录");
        activityRepository.save(activity);

        log.info("Record archived: id={}, by={}", recordId, principal.username());
    }

    private void checkReviewPermission(ExperimentRecord record, UserPrincipal principal) {
        if (record.getOwnerId().equals(principal.id())) {
            return;
        }

        boolean isReviewer = memberRepository.findByProjectIdAndUserId(record.getProjectId(), principal.id())
                .filter(m -> m.getRole() == ProjectRole.OWNER || m.getRole() == ProjectRole.ADMIN)
                .isPresent();

        if (!isReviewer) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "您没有审核该记录的权限");
        }
    }

    private boolean isRecordOwner(ExperimentRecord record, UserPrincipal principal) {
        return record.getOwnerId().equals(principal.id());
    }

    private void verifyRecordOwner(ExperimentRecord record, UserPrincipal principal) {
        if (!isRecordOwner(record, principal)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "您没有操作该记录的权限");
        }
    }
}
