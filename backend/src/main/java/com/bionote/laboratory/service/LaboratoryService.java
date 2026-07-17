package com.bionote.laboratory.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.laboratory.dto.ChangeLaboratoryLeaderRequest;
import com.bionote.laboratory.dto.CreateLaboratoryRequest;
import com.bionote.laboratory.dto.LaboratoryMemberResponse;
import com.bionote.laboratory.dto.LaboratoryResponse;
import com.bionote.laboratory.entity.Laboratory;
import com.bionote.laboratory.entity.LaboratoryMember;
import com.bionote.laboratory.entity.LaboratoryMemberStatus;
import com.bionote.laboratory.entity.LaboratoryRole;
import com.bionote.laboratory.repository.LaboratoryMemberRepository;
import com.bionote.laboratory.repository.LaboratoryRepository;
import com.bionote.user.entity.SystemRole;
import com.bionote.user.entity.User;
import com.bionote.user.entity.UserStatus;
import com.bionote.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class LaboratoryService {
    private final LaboratoryRepository laboratoryRepository;
    private final LaboratoryMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final LaboratoryAccessService accessService;

    public LaboratoryService(
            LaboratoryRepository laboratoryRepository,
            LaboratoryMemberRepository memberRepository,
            UserRepository userRepository,
            LaboratoryAccessService accessService
    ) {
        this.laboratoryRepository = laboratoryRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.accessService = accessService;
    }

    @Transactional
    public LaboratoryResponse create(
            String administratorId,
            CreateLaboratoryRequest request
    ) {
        User administrator = requireSystemAdministrator(administratorId);
        User leader = lockActiveUser(requireActiveUser(request.leaderIdentifier()).getId());
        requireNoActiveMembership(leader.getId());
        Laboratory laboratory = laboratoryRepository.saveAndFlush(new Laboratory(
                generateCode(),
                request.name().trim(),
                request.description().trim(),
                leader,
                administrator
        ));
        memberRepository.save(new LaboratoryMember(
                laboratory,
                leader,
                LaboratoryRole.LAB_ADMIN,
                null,
                Instant.now()
        ));
        return LaboratoryResponse.from(laboratory);
    }

    @Transactional(readOnly = true)
    public LaboratoryResponse get(String laboratoryId, String userId) {
        Laboratory laboratory = accessService.requireActiveLaboratory(laboratoryId);
        User user = userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.AUTH_UNAUTHORIZED, "当前用户不存在或已停用"));
        if (user.getSystemRole() != SystemRole.ADMIN) {
            accessService.requireActiveMember(laboratoryId, userId);
        }
        return LaboratoryResponse.from(laboratory);
    }

    @Transactional(readOnly = true)
    public List<LaboratoryMemberResponse> mine(String userId) {
        return memberRepository.findAllByUser_IdAndMemberStatusOrderByJoinedAtDesc(
                        userId, LaboratoryMemberStatus.ACTIVE)
                .stream()
                .map(LaboratoryMemberResponse::from)
                .toList();
    }

    @Transactional
    public LaboratoryResponse changeLeader(
            String administratorId,
            String laboratoryId,
            ChangeLaboratoryLeaderRequest request
    ) {
        requireSystemAdministrator(administratorId);
        Laboratory laboratory = laboratoryRepository.findByIdForUpdate(laboratoryId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.LABORATORY_NOT_FOUND, "实验室不存在"));
        if (laboratory.getVersion() != request.version()) {
            throw new BusinessException(
                    ErrorCode.LAB_VERSION_CONFLICT, "实验室信息已被修改，请刷新后重试");
        }

        User newLeader = lockActiveUser(requireActiveUser(request.leaderIdentifier()).getId());
        User oldLeader = laboratory.getLeader();
        Instant now = Instant.now();

        if (oldLeader == null || !oldLeader.getId().equals(newLeader.getId())) {
            requireNoMembershipInAnotherLaboratory(newLeader.getId(), laboratoryId);
        }

        if (oldLeader != null && !oldLeader.getId().equals(newLeader.getId())) {
            memberRepository.findByLaboratory_IdAndUser_Id(laboratoryId, oldLeader.getId())
                    .ifPresent(member -> member.update(
                            LaboratoryRole.MENTOR,
                            LaboratoryMemberStatus.ACTIVE,
                            now));
        }

        LaboratoryMember newLeaderMembership = memberRepository
                .findByLaboratory_IdAndUser_Id(laboratoryId, newLeader.getId())
                .orElseGet(() -> new LaboratoryMember(
                        laboratory,
                        newLeader,
                        LaboratoryRole.LAB_ADMIN,
                        null,
                        now));
        if (newLeaderMembership.getId() == null) {
            memberRepository.save(newLeaderMembership);
        } else {
            newLeaderMembership.update(
                    LaboratoryRole.LAB_ADMIN,
                    LaboratoryMemberStatus.ACTIVE,
                    now);
        }

        laboratory.changeLeader(newLeader);
        return LaboratoryResponse.from(laboratoryRepository.saveAndFlush(laboratory));
    }

    private User requireSystemAdministrator(String userId) {
        return userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .filter(user -> user.getSystemRole() == SystemRole.ADMIN)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.ACCESS_DENIED, "只有系统管理员可以执行该操作"));
    }

    private User requireActiveUser(String identifier) {
        String normalized = identifier.trim().toLowerCase(Locale.ROOT);
        return userRepository.findByLoginIdentifier(normalized)
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "指定的实验室负责人不存在或已停用"));
    }

    private User lockActiveUser(String userId) {
        return userRepository.findByIdForUpdate(userId)
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "指定的实验室负责人不存在或已停用"));
    }

    private void requireNoActiveMembership(String userId) {
        if (memberRepository.existsByUser_IdAndMemberStatus(
                userId, LaboratoryMemberStatus.ACTIVE)) {
            throw new BusinessException(
                    ErrorCode.LAB_ALREADY_MEMBER,
                    "指定的实验室负责人已加入其他实验室"
            );
        }
    }

    private void requireNoMembershipInAnotherLaboratory(
            String userId,
            String laboratoryId
    ) {
        if (memberRepository.existsByUser_IdAndMemberStatusAndLaboratory_IdNot(
                userId, LaboratoryMemberStatus.ACTIVE, laboratoryId)) {
            throw new BusinessException(
                    ErrorCode.LAB_ALREADY_MEMBER,
                    "指定的实验室负责人已加入其他实验室"
            );
        }
    }

    private String generateCode() {
        return "LAB-" + UUID.randomUUID().toString()
                .replace("-", "")
                .substring(0, 12)
                .toUpperCase(Locale.ROOT);
    }
}
