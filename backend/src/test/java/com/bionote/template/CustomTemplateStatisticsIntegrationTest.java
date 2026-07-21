package com.bionote.template;

import com.bionote.project.ProjectRepository;
import com.bionote.security.UserPrincipal;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CustomTemplateStatisticsIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired ProjectRepository projectRepository;

    private User li;
    private User wang;
    private User outsider;
    private String projectId;

    @BeforeEach
    void setUp() {
        li = userRepository.findByUsername("li").orElseThrow();
        wang = userRepository.findByUsername("wang").orElseThrow();
        outsider = userRepository.findByUsername("stats-outsider")
                .orElseGet(() -> userRepository.save(new User(
                        "stats-outsider", "not-used", "统计外部用户",
                        "stats-outsider@example.com", "外")));
        projectId = projectRepository.findByCode("PRJ2026070001").orElseThrow().getId();
    }

    @Test
    void creatorCanCreateAndUpdateCustomTemplateButOthersCannot() throws Exception {
        String createBody = """
                {
                  "name":"自定义培养模板",
                  "category":"细胞生物学",
                  "description":"课程自定义模板",
                  "fields":[
                    {"fieldKey":"result","label":"结果","fieldType":"textarea","required":true,"sortOrder":2},
                    {"fieldKey":"purpose","label":"目的","fieldType":"textarea","required":true,"sortOrder":1}
                  ]
                }
                """;
        MvcResult created = mockMvc.perform(post("/api/v1/templates")
                        .with(authentication(auth(li)))
                        .contentType(MediaType.APPLICATION_JSON).content(createBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.builtIn").value(false))
                .andExpect(jsonPath("$.data.fields[0].fieldKey").value("purpose"))
                .andReturn();
        JsonNode template = objectMapper.readTree(
                created.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("data");
        String templateId = template.path("id").asText();
        long version = template.path("version").asLong();

        String updateBody = """
                {
                  "version":%d,
                  "name":"自定义培养模板 v2",
                  "category":"细胞生物学",
                  "description":"更新后的模板",
                  "fields":[
                    {"fieldKey":"purpose","label":"目的","fieldType":"textarea","required":true,"sortOrder":1},
                    {"fieldKey":"observation","label":"观察","fieldType":"table","required":false,"sortOrder":2}
                  ]
                }
                """.formatted(version);
        mockMvc.perform(put("/api/v1/templates/{id}", templateId)
                        .with(authentication(auth(wang)))
                        .contentType(MediaType.APPLICATION_JSON).content(updateBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/v1/templates/{id}", templateId)
                        .with(authentication(auth(li)))
                        .contentType(MediaType.APPLICATION_JSON).content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("自定义培养模板 v2"))
                .andExpect(jsonPath("$.data.fields[1].fieldKey").value("observation"));
    }

    @Test
    void statisticsArePermissionScoped() throws Exception {
        mockMvc.perform(get("/api/v1/projects/{id}/statistics", projectId)
                        .with(authentication(auth(wang))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalRecords").isNumber())
                .andExpect(jsonPath("$.data.recordStatusCounts").isMap())
                .andExpect(jsonPath("$.data.experimentTrend").isArray());

        mockMvc.perform(get("/api/v1/projects/{id}/statistics", projectId)
                        .with(authentication(auth(outsider))))
                .andExpect(status().isForbidden());
    }

    private UsernamePasswordAuthenticationToken auth(User user) {
        return new UsernamePasswordAuthenticationToken(
                new UserPrincipal(user.getId(), user.getUsername(), user.getName()),
                null, List.of());
    }
}
