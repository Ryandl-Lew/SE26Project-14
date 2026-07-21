package com.bionote.report;

import com.bionote.collaboration.entity.Review;
import com.bionote.collaboration.entity.ReviewDecision;
import com.bionote.collaboration.repository.ReviewRepository;
import com.bionote.file.entity.Attachment;
import com.bionote.file.repository.AttachmentRepository;
import com.bionote.project.ProjectRepository;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.repository.ExperimentRecordRepository;
import com.bionote.report.service.ReportExportService;
import com.bionote.security.UserPrincipal;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ReportExportIntegrationTest {
    @Autowired ReportExportService exportService;
    @Autowired ProjectRepository projectRepository;
    @Autowired ExperimentRecordRepository recordRepository;
    @Autowired AttachmentRepository attachmentRepository;
    @Autowired ReviewRepository reviewRepository;
    @Autowired UserRepository userRepository;
    @Autowired MockMvc mockMvc;

    private User li;
    private User zhang;
    private String projectId;
    private ExperimentRecord record;

    @BeforeEach
    void setUp() {
        li = userRepository.findByUsername("li").orElseThrow();
        zhang = userRepository.findByUsername("zhang").orElseThrow();
        projectId = projectRepository.findByCode("PRJ2026070001").orElseThrow().getId();
        record = recordRepository.findByProjectIdOrderByUpdatedAtDesc(projectId).get(0);
        attachmentRepository.save(new Attachment(
                projectId, null, "项目方案.pdf", "export-project-file.pdf",
                "application/pdf", 1024L, li.getId()));
        attachmentRepository.save(new Attachment(
                null, record.getId(), "凝胶结果.png", "export-record-file.png",
                "image/png", 2048L, li.getId()));
        reviewRepository.save(new Review(
                record.getId(), zhang.getId(), ReviewDecision.APPROVE, "导出审核结论完整"));
    }

    @Test
    void projectExportsContainRealMetadataAndPdfUsesClasspathChineseFont() throws Exception {
        byte[] markdown = exportService.exportProjectMarkdown(projectId, li.getId());
        String markdownText = new String(markdown, StandardCharsets.UTF_8);
        assertThat(markdownText)
                .contains("PCR 扩增与克隆实验", "项目方案.pdf", "凝胶结果.png", "导出审核结论完整");

        byte[] projectPdf = exportService.exportProjectPdf(projectId, li.getId());
        byte[] recordPdf = exportService.exportRecordPdf(record.getId(), li.getId());
        assertThat(projectPdf).startsWith("%PDF".getBytes(StandardCharsets.US_ASCII));
        assertThat(recordPdf).startsWith("%PDF".getBytes(StandardCharsets.US_ASCII));
        assertThat(projectPdf.length).isGreaterThan(10_000);

        Path output = Path.of("target", "test-output");
        Files.createDirectories(output);
        Files.write(output.resolve("project-export-test.pdf"), projectPdf);
        Files.write(output.resolve("record-export-test.pdf"), recordPdf);

        byte[] excel = exportService.exportProjectExcel(projectId, li.getId());
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(excel))) {
            assertThat(workbook.getSheet("项目概览")).isNotNull();
            assertThat(workbook.getSheet("实验记录")).isNotNull();
            assertThat(workbook.getSheet("附件元数据").getLastRowNum()).isGreaterThanOrEqualTo(2);
            assertThat(workbook.getSheet("审核结论").getLastRowNum()).isGreaterThanOrEqualTo(1);
        }
    }

    @Test
    void publicExportPathsReturnCorrectContentTypes() throws Exception {
        var authentication = authentication(new UsernamePasswordAuthenticationToken(
                new UserPrincipal(li.getId(), li.getUsername(), li.getName()), null, List.of()));
        mockMvc.perform(get("/api/v1/projects/{id}/export", projectId)
                        .param("format", "md").with(authentication))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/markdown; charset=UTF-8"));
        mockMvc.perform(get("/api/v1/records/{id}/export", record.getId())
                        .with(authentication(new UsernamePasswordAuthenticationToken(
                                new UserPrincipal(li.getId(), li.getUsername(), li.getName()),
                                null, List.of()))))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"));
    }
}
