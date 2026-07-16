package com.bionote.laboratory.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.laboratory.entity.Laboratory;
import com.bionote.laboratory.entity.LaboratoryMember;
import com.bionote.laboratory.entity.LaboratoryMemberStatus;
import com.bionote.laboratory.entity.LaboratoryRole;
import com.bionote.laboratory.entity.LaboratoryStatus;
import com.bionote.laboratory.repository.LaboratoryMemberRepository;
import com.bionote.laboratory.repository.LaboratoryRepository;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class LaboratoryAccessService {
    private final LaboratoryRepository laboratoryRepository;
    private final LaboratoryMemberRepository memberRepository;

    public LaboratoryAccessService(
            LaboratoryRepository laboratoryRepository,
            LaboratoryMemberRepository memberRepository
    ) {
        this.laboratoryRepository = laboratoryRepository;
        this.memberRepository = memberRepository;
    }

    public Laboratory requireActiveLaboratory(String laboratoryId) {
        return laboratoryRepository.findByIdAndStatus(laboratoryId, LaboratoryStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.LABORATORY_NOT_FOUND, "实验室不存在或已归档"));
    }

    public LaboratoryMember requireActiveMember(String laboratoryId, String userId) {
        return memberRepository.findByLaboratory_IdAndUser_IdAndMemberStatus(
                        laboratoryId, userId, LaboratoryMemberStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.LABORATORY_ACCESS_DENIED, "当前用户不是该实验室的有效成员"));
    }

    public LaboratoryMember requireAnyRole(
            String laboratoryId,
            String userId,
            LaboratoryRole... roles
    ) {
        LaboratoryMember member = requireActiveMember(laboratoryId, userId);
        if (!Set.of(roles).contains(member.getRole())) {
            throw new BusinessException(
                    ErrorCode.LABORATORY_ACCESS_DENIED, "当前实验室角色无权执行该操作");
        }
        return member;
    }
}
