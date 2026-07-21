package com.bionote.file.service;

import com.bionote.file.entity.Attachment;
import com.bionote.file.repository.AttachmentRepository;
import com.bionote.project.service.ProjectAccessService;
import com.bionote.project.ProjectRepository;
import com.bionote.project.MemberRepository;
import com.bionote.record.service.RecordQueryService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class FileServiceCompensationTest {
    @Test
    void physicalFileIsDeletedWhenMetadataSaveFails() {
        StorageService storage = mock(StorageService.class);
        AttachmentRepository repository = mock(AttachmentRepository.class);
        ProjectAccessService access = new ProjectAccessService(
                mock(ProjectRepository.class), mock(MemberRepository.class)) {
            @Override
            public void requireCanUploadFile(String projectId, String userId) {
                // 本测试只关注存储补偿，权限规则由集成测试覆盖。
            }
        };
        RecordQueryService recordQuery = null;
        FileService service = new FileService(storage, repository, access, recordQuery);
        MockMultipartFile file = new MockMultipartFile(
                "file", "safe.csv", "text/csv", "a,b\n1,2\n".getBytes());

        when(storage.store(file)).thenReturn(
                new StorageService.StoredFile("random-key.csv", "text/csv"));
        when(repository.saveAndFlush(any(Attachment.class)))
                .thenThrow(new RuntimeException("database failed"));

        assertThatThrownBy(() -> service.uploadProjectFile("project-id", file, "user-id"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("database failed");
        verify(storage).delete("random-key.csv");
    }
}
