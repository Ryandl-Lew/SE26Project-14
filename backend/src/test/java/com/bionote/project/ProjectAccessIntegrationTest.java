package com.bionote.project;

import com.bionote.project.entity.MemberStatus;
import com.bionote.project.entity.Project;
import com.bionote.project.entity.ProjectMember;
import com.bionote.project.entity.ProjectRole;
import com.bionote.project.entity.ProjectStatus;
import com.bionote.security.UserPrincipal;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ProjectAccessIntegrationTest {
    @Autowired MockMvc mockMvc;
    @Autowired ProjectRepository projectRepository;
    @Autowired MemberRepository memberRepository;
    @Autowired UserRepository userRepository;

    private User li;
    private User wang;
    private User zhang;
    private Project ownerProject;
    private Project outsiderProject;

    @BeforeEach
    void setUp() {
        li = userRepository.findByUsername("li").orElseThrow();
        wang = userRepository.findByUsername("wang").orElseThrow();
        zhang = userRepository.findByUsername("zhang").orElseThrow();

        ownerProject = createProject("ACCESS-LI-", "权限隔离-LI", li, ProjectRole.OWNER);
        memberRepository.save(new ProjectMember(
                ownerProject.getId(), wang.getId(), ProjectRole.MEMBER, MemberStatus.ACTIVE));
        outsiderProject = createProject("ACCESS-ZH-", "权限隔离-ZHANG", zhang, ProjectRole.OWNER);
    }

    @Test
    void projectListOnlyContainsActiveMemberships() throws Exception {
        mockMvc.perform(get("/api/v1/projects").with(authentication(auth(li))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[*].id", hasItem(ownerProject.getId())))
                .andExpect(jsonPath("$.data.items[*].id", not(hasItem(outsiderProject.getId()))));

        memberRepository.findByProjectIdAndUserId(ownerProject.getId(), li.getId())
                .orElseThrow().setMemberStatus(MemberStatus.DEACTIVATED);
        memberRepository.flush();

        mockMvc.perform(get("/api/v1/projects").with(authentication(auth(li))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[*].id", not(hasItem(ownerProject.getId()))));
    }

    @Test
    void nonMemberCannotReadProjectMembersActivitiesOrFiles() throws Exception {
        var outsider = authentication(auth(wang));
        mockMvc.perform(get("/api/v1/projects/{id}", outsiderProject.getId()).with(outsider))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/projects/{id}/members", outsiderProject.getId()).with(outsider))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/projects/{id}/activities", outsiderProject.getId()).with(outsider))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/projects/{id}/files", outsiderProject.getId()).with(outsider))
                .andExpect(status().isForbidden());
    }

    @Test
    void onlyOwnerCanEditManageMembersAndArchiveDirectly() throws Exception {
        String update = """
                {"name":"越权修改","description":"x","version":0}
                """;
        mockMvc.perform(patch("/api/v1/projects/{id}", ownerProject.getId())
                        .with(authentication(auth(wang)))
                        .contentType(MediaType.APPLICATION_JSON).content(update))
                .andExpect(status().isForbidden());

        String memberBody = """
                {"userId":"%s","role":"OBSERVER"}
                """.formatted(zhang.getId());
        mockMvc.perform(post("/api/v1/projects/{id}/members", ownerProject.getId())
                        .with(authentication(auth(wang)))
                        .contentType(MediaType.APPLICATION_JSON).content(memberBody))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/projects/{id}/archive", ownerProject.getId())
                        .with(authentication(auth(wang))))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/projects/{id}/archive", ownerProject.getId())
                        .with(authentication(auth(li))))
                .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/v1/projects/{id}/archive", ownerProject.getId())
                        .with(authentication(auth(li))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ILLEGAL_STATE_TRANSITION"));
    }

    @Test
    void createReturns201AndStaleProjectVersionReturns409() throws Exception {
        mockMvc.perform(post("/api/v1/projects")
                        .with(authentication(auth(li)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"新建项目\",\"description\":\"test\"}"))
                .andExpect(status().isCreated());

        String stale = """
                {"name":"冲突","description":"x","version":99}
                """;
        mockMvc.perform(patch("/api/v1/projects/{id}", ownerProject.getId())
                        .with(authentication(auth(li)))
                        .contentType(MediaType.APPLICATION_JSON).content(stale))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROJECT_VERSION_CONFLICT"));
    }

    private Project createProject(String codePrefix,
                                  String name,
                                  User owner,
                                  ProjectRole ownerRole) {
        Project project = projectRepository.saveAndFlush(new Project(
                codePrefix + UUID.randomUUID().toString().substring(0, 8),
                name, "integration test", ProjectStatus.IN_PROGRESS, owner.getId()));
        memberRepository.save(new ProjectMember(
                project.getId(), owner.getId(), ownerRole, MemberStatus.ACTIVE));
        return project;
    }

    private UsernamePasswordAuthenticationToken auth(User user) {
        return new UsernamePasswordAuthenticationToken(
                new UserPrincipal(user.getId(), user.getUsername(), user.getName()),
                null, List.of());
    }
}
