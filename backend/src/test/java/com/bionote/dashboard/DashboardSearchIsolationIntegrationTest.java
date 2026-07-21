package com.bionote.dashboard;

import com.bionote.project.ActivityRepository;
import com.bionote.project.MemberRepository;
import com.bionote.project.ProjectRepository;
import com.bionote.project.entity.*;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.entity.RecordStatus;
import com.bionote.record.repository.ExperimentRecordRepository;
import com.bionote.security.UserPrincipal;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class DashboardSearchIsolationIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired ProjectRepository projectRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired ExperimentRecordRepository recordRepository;
    @Autowired ActivityRepository activityRepository;

    private User userA;
    private User userB;
    private Project projectA;
    private Project projectB;

    @BeforeEach
    void setUp() {
        userA = createUser("dash-a-" + shortId(), "隔离用户A");
        userB = createUser("dash-b-" + shortId(), "隔离用户B");
        projectA = createProject(userA, "隔离项目A-isolation-keyword");
        projectB = createProject(userB, "隔离项目B-isolation-keyword");

        createRecord(projectA, userA, "A记录-isolation-keyword", RecordStatus.IN_PROGRESS);
        createRecord(projectA, userA, "A草稿", RecordStatus.DRAFT);
        createRecord(projectB, userB, "B记录-isolation-keyword", RecordStatus.IN_PROGRESS);
        activityRepository.saveAndFlush(new Activity(projectA.getId(), userA.getId(), "UPDATE",
                "PROJECT", projectA.getId(), "成员活动 isolation-keyword"));
    }

    @Test
    void dashboardOnlyAggregatesCurrentUsersProjects() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard").with(authentication(auth(userA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalProjects").value(1))
                .andExpect(jsonPath("$.data.totalRecords").value(2))
                .andExpect(jsonPath("$.data.inProgressRecords").value(1))
                .andExpect(jsonPath("$.data.recentProjects[*].id", hasItem(projectA.getId())))
                .andExpect(jsonPath("$.data.recentProjects[*].id", not(hasItem(projectB.getId()))))
                .andExpect(content().string(not(org.hamcrest.Matchers.containsString("B记录-isolation-keyword"))));
    }

    @Test
    void searchFiltersByPermissionIncludesTemplatesAndProjectActivities() throws Exception {
        mockMvc.perform(get("/api/v1/search")
                        .param("keyword", "isolation-keyword")
                        .with(authentication(auth(userA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[*].title", hasItem("A记录-isolation-keyword")))
                .andExpect(jsonPath("$.data.items[*].title", not(hasItem("B记录-isolation-keyword"))));

        mockMvc.perform(get("/api/v1/search")
                        .param("keyword", "PCR")
                        .with(authentication(auth(userA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[*].entityType", hasItem("TEMPLATE")));

        mockMvc.perform(get("/api/v1/search")
                        .param("keyword", "成员活动")
                        .param("projectId", projectA.getId())
                        .with(authentication(auth(userA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[*].entityType", hasItem("ACTIVITY")));

        mockMvc.perform(get("/api/v1/search")
                        .param("keyword", "isolation-keyword")
                        .param("projectId", projectB.getId())
                        .with(authentication(auth(userA))))
                .andExpect(status().isForbidden());
    }

    @Test
    void searchValidatesPageAndSize() throws Exception {
        mockMvc.perform(get("/api/v1/search")
                        .param("keyword", "PCR").param("page", "-1")
                        .with(authentication(auth(userA))))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/search")
                        .param("keyword", "PCR").param("size", "101")
                        .with(authentication(auth(userA))))
                .andExpect(status().isBadRequest());
    }

    private User createUser(String username, String name) {
        return userRepository.save(new User(
                username, "not-used", name, username + "@example.com", name.substring(0, 1)));
    }

    private Project createProject(User owner, String name) {
        Project project = projectRepository.saveAndFlush(new Project(
                "ISO-" + UUID.randomUUID().toString().substring(0, 8), name,
                "isolation", ProjectStatus.IN_PROGRESS, owner.getId()));
        memberRepository.save(new ProjectMember(
                project.getId(), owner.getId(), ProjectRole.OWNER, MemberStatus.ACTIVE));
        return project;
    }

    private void createRecord(Project project, User owner, String title, RecordStatus status) {
        ExperimentRecord record = new ExperimentRecord(
                "ISO-REC-" + UUID.randomUUID().toString().substring(0, 8),
                project.getId(), null, title, "PCR", owner.getId(), LocalDate.now(),
                "A203", "{\"purpose\":\"isolation-keyword\"}");
        if (status != RecordStatus.DRAFT) {
            record.changeStatus(status);
        }
        recordRepository.saveAndFlush(record);
    }

    private UsernamePasswordAuthenticationToken auth(User user) {
        return new UsernamePasswordAuthenticationToken(
                new UserPrincipal(user.getId(), user.getUsername(), user.getName()),
                null, List.of());
    }

    private String shortId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }
}
