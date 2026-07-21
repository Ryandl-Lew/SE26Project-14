package com.bionote.record;

import com.bionote.project.ProjectRepository;
import com.bionote.record.repository.ExperimentRecordRepository;
import com.bionote.security.UserPrincipal;
import com.bionote.template.repository.ExperimentTemplateRepository;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.nio.charset.StandardCharsets;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TemplateRecordWorkflowIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired ProjectRepository projectRepository;
    @Autowired ExperimentTemplateRepository templateRepository;
    @Autowired JdbcTemplate jdbcTemplate;

    private User li;
    private User wang;
    private User zhang;
    private User outsider;
    private String projectId;
    private String pcrTemplateId;

    @BeforeEach
    void setUp() {
        li = userRepository.findByUsername("li").orElseThrow();
        wang = userRepository.findByUsername("wang").orElseThrow();
        zhang = userRepository.findByUsername("zhang").orElseThrow();
        outsider = userRepository.findByUsername("workflow-outsider")
                .orElseGet(() -> userRepository.save(new User(
                        "workflow-outsider", "not-used", "外部用户",
                        "workflow-outsider@example.com", "外")));
        projectId = projectRepository.findByCode("PRJ2026070001").orElseThrow().getId();
        pcrTemplateId = templateRepository.findAllByOrderByCategoryAscNameAsc().stream()
                .filter(template -> template.getName().equals("PCR 扩增"))
                .findFirst().orElseThrow().getId();
    }

    @Test
    void templatesCanBeFilteredAndFieldsAreSorted() throws Exception {
        mockMvc.perform(get("/api/v1/templates").with(authentication(auth(li))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.name == 'PCR 扩增')]").exists())
                .andExpect(jsonPath("$.data[?(@.name == '琼脂糖凝胶电泳')]").exists())
                .andExpect(jsonPath("$.data[?(@.name == '发酵工程')]").exists());

        mockMvc.perform(get("/api/v1/templates").param("category", "发酵工程")
                        .with(authentication(auth(li))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));

        mockMvc.perform(get("/api/v1/templates/{id}", pcrTemplateId)
                        .with(authentication(auth(li))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fields[0].sortOrder").value(1))
                .andExpect(jsonPath("$.data.fields[5].sortOrder").value(6));
    }

    @Test
    void templateCreationUsesIndependentSnapshotAndValidatesRequiredFields() throws Exception {
        JsonNode created = createRecord(wang, pcrTemplateId, "PCR 快照测试");
        String recordId = created.path("id").asText();
        long version = created.path("version").asLong();

        org.assertj.core.api.Assertions.assertThat(created.path("contentJson").asText())
                .contains("purpose", "materials", "conclusion");
        org.assertj.core.api.Assertions.assertThat(created.path("templateSnapshotJson").asText())
                .contains("PCR 扩增", "required");

        jdbcTemplate.update("UPDATE template_fields SET required = FALSE, label = '已修改字段' "
                + "WHERE template_id = ?", pcrTemplateId);

        mockMvc.perform(post("/api/v1/records/{id}/submit", recordId)
                        .with(authentication(auth(wang))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.purpose").value("实验目的不能为空"))
                .andExpect(jsonPath("$.fieldErrors.materials").exists());

        mockMvc.perform(put("/api/v1/records/{id}", recordId)
                        .with(authentication(auth(wang)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRequest(version,
                                Map.of("purpose", "x", "materials", "错误类型"),
                                "字段类型校验").toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.materials").exists());

        JsonNode updated = updateRecord(wang, recordId, version, completePcrContent(), "填写模板字段");
        mockMvc.perform(post("/api/v1/records/{id}/submit", recordId)
                        .with(authentication(auth(wang))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/records/{id}", recordId)
                        .with(authentication(auth(wang))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING_REVIEW"))
                .andExpect(jsonPath("$.data.templateSnapshotJson", containsString("实验目的")));
    }

    @Test
    void fullWorkflowRejectSupplementApproveArchiveAndHistoryPermissions() throws Exception {
        JsonNode created = createRecord(wang, null, "完整状态机测试");
        String recordId = created.path("id").asText();

        mockMvc.perform(post("/api/v1/records/{id}/start", recordId)
                        .with(authentication(auth(wang))))
                .andExpect(status().isOk());
        long version = getRecord(wang, recordId).path("version").asLong();
        JsonNode updated = updateRecord(wang, recordId, version,
                Map.of("purpose", "状态机内容"), "开始填写");

        mockMvc.perform(post("/api/v1/records/{id}/submit", recordId)
                        .with(authentication(auth(wang))))
                .andExpect(status().isOk());
        version = getRecord(wang, recordId).path("version").asLong();

        mockMvc.perform(post("/api/v1/records/{id}/review", recordId)
                        .with(authentication(auth(zhang)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reviewBody("REJECT", "", version)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.reason").exists());

        mockMvc.perform(post("/api/v1/records/{id}/review", recordId)
                        .with(authentication(auth(zhang)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reviewBody("REJECT", "补充结果附件", version)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/records/{id}/supplement", recordId)
                        .with(authentication(auth(li))))
                .andExpect(status().isOk());

        version = getRecord(li, recordId).path("version").asLong();
        updateRecord(li, recordId, version,
                Map.of("purpose", "状态机内容", "results", "已补充"), "补充结果");
        mockMvc.perform(post("/api/v1/records/{id}/submit", recordId)
                        .with(authentication(auth(li))))
                .andExpect(status().isOk());
        version = getRecord(li, recordId).path("version").asLong();

        mockMvc.perform(post("/api/v1/records/{id}/review", recordId)
                        .with(authentication(auth(zhang)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reviewBody("APPROVE", "记录完整", version)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/records/{id}/archive", recordId)
                        .with(authentication(auth(wang))))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/records/{id}/versions", recordId)
                        .with(authentication(auth(wang))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(8)));
        mockMvc.perform(get("/api/v1/records/{id}/reviews", recordId)
                        .with(authentication(auth(wang))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
        mockMvc.perform(get("/api/v1/records/{id}/versions", recordId)
                        .with(authentication(auth(outsider))))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/records/{id}/comments", recordId)
                        .with(authentication(auth(outsider))))
                .andExpect(status().isForbidden());
    }

    @Test
    void versionConflictIllegalTransitionAndSelfReviewAreRejected() throws Exception {
        JsonNode draft = createRecord(wang, null, "非法转换测试");
        String draftId = draft.path("id").asText();
        mockMvc.perform(post("/api/v1/records/{id}/supplement", draftId)
                        .with(authentication(auth(wang))))
                .andExpect(status().isConflict());

        ObjectNode stale = updateRequest(99, Map.of("purpose", "x"), "冲突更新");
        mockMvc.perform(put("/api/v1/records/{id}", draftId)
                        .with(authentication(auth(wang)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(stale.toString()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("RECORD_VERSION_CONFLICT"));

        JsonNode own = createRecord(li, null, "禁止自审测试");
        String ownId = own.path("id").asText();
        JsonNode ownUpdated = updateRecord(li, ownId, own.path("version").asLong(),
                Map.of("purpose", "自审测试内容"), "填写内容");
        mockMvc.perform(post("/api/v1/records/{id}/submit", ownId)
                        .with(authentication(auth(li))))
                .andExpect(status().isOk());
        long ownVersion = getRecord(li, ownId).path("version").asLong();
        mockMvc.perform(post("/api/v1/records/{id}/review", ownId)
                        .with(authentication(auth(li)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reviewBody("APPROVE", "自审", ownVersion)))
                .andExpect(status().isForbidden());
    }

    private JsonNode createRecord(User user, String templateId, String title) throws Exception {
        ObjectNode request = objectMapper.createObjectNode();
        request.put("projectId", projectId);
        if (templateId != null) request.put("templateId", templateId);
        request.put("title", title);
        request.put("experimentType", "PCR");
        request.put("experimentDate", "2026-07-20");
        request.put("location", "A203");
        MvcResult result = mockMvc.perform(post("/api/v1/records")
                        .with(authentication(auth(user)))
                        .contentType(MediaType.APPLICATION_JSON).content(request.toString()))
                .andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(
                result.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("data");
    }

    private JsonNode updateRecord(User user, String recordId, long version,
                                  Map<String, ?> content, String reason) throws Exception {
        ObjectNode request = updateRequest(version, content, reason);
        MvcResult result = mockMvc.perform(put("/api/v1/records/{id}", recordId)
                        .with(authentication(auth(user)))
                        .contentType(MediaType.APPLICATION_JSON).content(request.toString()))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(
                result.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("data");
    }

    private ObjectNode updateRequest(long version, Map<String, ?> content, String reason)
            throws Exception {
        ObjectNode request = objectMapper.createObjectNode();
        request.put("version", version);
        request.put("contentJson", objectMapper.writeValueAsString(content));
        request.put("changeReason", reason);
        return request;
    }

    private JsonNode getRecord(User user, String recordId) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/records/{id}", recordId)
                        .with(authentication(auth(user))))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(
                result.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("data");
    }

    private String reviewBody(String decision, String reason, long version) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("decision", decision);
        body.put("reason", reason);
        body.put("version", version);
        return body.toString();
    }

    private Map<String, ?> completePcrContent() {
        return Map.of(
                "purpose", "扩增目标片段",
                "materials", List.of(Map.of("name", "DNA")),
                "steps", "配置体系",
                "parameters", List.of(Map.of("temperature", "58")),
                "results", "750bp 条带",
                "conclusion", "扩增成功");
    }

    private UsernamePasswordAuthenticationToken auth(User user) {
        return new UsernamePasswordAuthenticationToken(
                new UserPrincipal(user.getId(), user.getUsername(), user.getName()),
                null, List.of());
    }
}
