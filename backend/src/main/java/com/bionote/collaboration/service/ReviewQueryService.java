package com.bionote.collaboration.service;

import com.bionote.collaboration.dto.ReviewResponse;
import com.bionote.collaboration.repository.ReviewRepository;
import com.bionote.project.service.ProjectAccessService;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.service.RecordQueryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewQueryService {

    private final ReviewRepository reviewRepository;
    private final RecordQueryService recordQueryService;
    private final ProjectAccessService accessService;

    public ReviewQueryService(ReviewRepository reviewRepository,
                              RecordQueryService recordQueryService,
                              ProjectAccessService accessService) {
        this.reviewRepository = reviewRepository;
        this.recordQueryService = recordQueryService;
        this.accessService = accessService;
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> listReviews(String recordId, String currentUserId) {
        ExperimentRecord record = recordQueryService.requireRecord(recordId);
        accessService.requireCanRead(record.getProjectId(), currentUserId);

        return reviewRepository.findByRecordIdOrderByCreatedAtDesc(recordId)
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }
}