package com.bionote.collaboration.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.collaboration.dto.CommentRequest;
import com.bionote.collaboration.dto.CommentResponse;
import com.bionote.collaboration.entity.Comment;
import com.bionote.collaboration.entity.CommentCategory;
import com.bionote.collaboration.repository.CommentRepository;
import com.bionote.project.service.ProjectAccessService;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.service.RecordQueryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final RecordQueryService recordQueryService;
    private final ProjectAccessService accessService;
    private final AuditService auditService;

    public CommentService(CommentRepository commentRepository,
                          RecordQueryService recordQueryService,
                          ProjectAccessService accessService,
                          AuditService auditService) {
        this.commentRepository = commentRepository;
        this.recordQueryService = recordQueryService;
        this.accessService = accessService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> listComments(String recordId, String currentUserId) {
        ExperimentRecord record = recordQueryService.requireRecord(recordId);
        accessService.requireCanRead(record.getProjectId(), currentUserId);

        return commentRepository.findByRecordIdOrderByCreatedAtDesc(recordId)
                .stream()
                .map(CommentResponse::from)
                .toList();
    }

    @Transactional
    public CommentResponse addComment(String recordId,
                                       CommentRequest request,
                                       String currentUserId) {
        ExperimentRecord record = recordQueryService.requireRecord(recordId);
        accessService.requireCanComment(record.getProjectId(), currentUserId);

        Comment comment = new Comment(
                recordId,
                currentUserId,
                request.category() != null ? request.category() : CommentCategory.COMMENT,
                request.content()
        );
        Comment saved = commentRepository.save(comment);

        auditService.logRecord(record.getProjectId(), currentUserId, "COMMENT",
                recordId, "添加评论: " + record.getTitle());

        return CommentResponse.from(saved);
    }
}