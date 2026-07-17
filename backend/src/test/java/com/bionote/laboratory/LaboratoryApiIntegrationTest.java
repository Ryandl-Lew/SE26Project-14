package com.bionote.laboratory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultMatcher;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LaboratoryApiIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void completeLaboratoryAdministrationWorkflow() throws Exception {
        String administratorToken = loginToken("admin");
        String leaderToken = loginToken("zhang");
        String liToken = loginToken("li");
        String wangToken = loginToken("wang");
        Map<String, Object> createLaboratoryRequest = Map.of(
                "name", "Integration laboratory " + shortId(),
                "description", "Laboratory API integration test",
                "leaderIdentifier", "zhang"
        );

        performJson(
                post("/api/v1/laboratories"),
                leaderToken,
                createLaboratoryRequest,
                status().isForbidden()
        ).with(json -> assertThat(json.path("code").asText()).isEqualTo("ACCESS_DENIED"));

        JsonNode createdLaboratory = performJson(
                post("/api/v1/laboratories"),
                administratorToken,
                createLaboratoryRequest,
                status().isCreated()
        ).json();
        String laboratoryId = createdLaboratory.at("/data/id").asText();
        long laboratoryVersion = createdLaboratory.at("/data/version").asLong();
        assertThat(createdLaboratory.at("/data/leader/username").asText()).isEqualTo("zhang");

        JsonNode createdInvite = performJson(
                post("/api/v1/laboratories/{laboratoryId}/invites", laboratoryId),
                leaderToken,
                Map.of(
                        "expiresAt", Instant.now().plusSeconds(3600).toString(),
                        "maxUses", 10
                ),
                status().isCreated()
        ).json();
        String inviteCode = createdInvite.at("/data/inviteCode").asText();
        String inviteId = createdInvite.at("/data/invite/id").asText();
        assertThat(inviteCode).isNotBlank();

        JsonNode liApplication = createApplication(liToken, inviteCode, "Please add Li");
        approveApplication(
                leaderToken,
                laboratoryId,
                liApplication.at("/data/id").asText(),
                liApplication.at("/data/version").asLong()
        );

        performJson(
                post("/api/v1/laboratories"),
                administratorToken,
                Map.of(
                        "name", "Duplicate membership laboratory " + shortId(),
                        "description", "Li cannot lead a second laboratory",
                        "leaderIdentifier", "li"
                ),
                status().isConflict()
        ).with(json -> assertThat(json.path("code").asText())
                .isEqualTo("LAB_ALREADY_MEMBER"));

        JsonNode secondaryLaboratory = performJson(
                post("/api/v1/laboratories"),
                administratorToken,
                Map.of(
                        "name", "Secondary laboratory " + shortId(),
                        "description", "Laboratory used to verify exclusive membership",
                        "leaderIdentifier", "admin"
                ),
                status().isCreated()
        ).json();
        String secondaryLaboratoryId = secondaryLaboratory.at("/data/id").asText();
        JsonNode secondaryInvite = performJson(
                post("/api/v1/laboratories/{laboratoryId}/invites", secondaryLaboratoryId),
                administratorToken,
                Map.of("maxUses", 2),
                status().isCreated()
        ).json();
        performJson(
                post("/api/v1/laboratory-join-applications"),
                liToken,
                Map.of(
                        "inviteCode", secondaryInvite.at("/data/inviteCode").asText(),
                        "message", "Try to join a second laboratory"
                ),
                status().isConflict()
        ).with(json -> assertThat(json.path("code").asText())
                .isEqualTo("LAB_ALREADY_MEMBER"));

        JsonNode wangApplication = createApplication(wangToken, inviteCode, "Please add Wang");
        String wangApplicationId = wangApplication.at("/data/id").asText();
        long wangApplicationVersion = wangApplication.at("/data/version").asLong();

        performJson(
                post(
                        "/api/v1/laboratories/{laboratoryId}/join-applications/{applicationId}/review",
                        laboratoryId,
                        wangApplicationId
                ),
                liToken,
                Map.of("decision", "APPROVE", "version", wangApplicationVersion),
                status().isForbidden()
        ).with(json -> assertThat(json.path("code").asText())
                .isEqualTo("LABORATORY_ACCESS_DENIED"));

        approveApplication(
                leaderToken,
                laboratoryId,
                wangApplicationId,
                wangApplicationVersion
        );

        JsonNode members = getJson(
                get("/api/v1/laboratories/{laboratoryId}/members", laboratoryId),
                leaderToken,
                status().isOk()
        );
        JsonNode liMembership = findMember(members, "li");
        JsonNode leaderMembership = findMember(members, "zhang");

        JsonNode updatedLiMembership = performJson(
                patch(
                        "/api/v1/laboratories/{laboratoryId}/members/{userId}",
                        laboratoryId,
                        liMembership.at("/user/id").asText()
                ),
                leaderToken,
                Map.of(
                        "role", "MENTOR",
                        "memberStatus", "ACTIVE",
                        "version", liMembership.path("version").asLong()
                ),
                status().isOk()
        ).json();
        assertThat(updatedLiMembership.at("/data/role").asText()).isEqualTo("MENTOR");

        String rejectedUsername = "rejected_" + shortId();
        register(rejectedUsername, rejectedUsername + "@example.com");
        String rejectedUserToken = loginToken(rejectedUsername);
        JsonNode rejectedApplication = createApplication(
                rejectedUserToken,
                inviteCode,
                "This application will be rejected"
        );
        String rejectedApplicationId = rejectedApplication.at("/data/id").asText();
        long rejectedApplicationVersion = rejectedApplication.at("/data/version").asLong();

        performJson(
                post(
                        "/api/v1/laboratories/{laboratoryId}/join-applications/{applicationId}/review",
                        laboratoryId,
                        rejectedApplicationId
                ),
                liToken,
                Map.of("decision", "REJECT", "version", rejectedApplicationVersion),
                status().isBadRequest()
        ).with(json -> assertThat(json.path("code").asText()).isEqualTo("VALIDATION_ERROR"));

        JsonNode rejected = performJson(
                post(
                        "/api/v1/laboratories/{laboratoryId}/join-applications/{applicationId}/review",
                        laboratoryId,
                        rejectedApplicationId
                ),
                liToken,
                Map.of(
                        "decision", "REJECT",
                        "reason", "Insufficient information",
                        "version", rejectedApplicationVersion
                ),
                status().isOk()
        ).json();
        assertThat(rejected.at("/data/status").asText()).isEqualTo("REJECTED");

        performJson(
                patch(
                        "/api/v1/laboratories/{laboratoryId}/members/{userId}",
                        laboratoryId,
                        leaderMembership.at("/user/id").asText()
                ),
                leaderToken,
                Map.of(
                        "role", "MENTOR",
                        "memberStatus", "ACTIVE",
                        "version", leaderMembership.path("version").asLong()
                ),
                status().isConflict()
        ).with(json -> assertThat(json.path("code").asText())
                .isEqualTo("LAB_FINAL_ADMIN_REQUIRED"));

        mockMvc.perform(delete(
                        "/api/v1/laboratories/{laboratoryId}/members/{userId}",
                        laboratoryId,
                        leaderMembership.at("/user/id").asText()
                ).header("Authorization", bearer(leaderToken)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LAB_FINAL_ADMIN_REQUIRED"));

        mockMvc.perform(post(
                        "/api/v1/laboratories/{laboratoryId}/invites/{inviteId}/revoke",
                        laboratoryId,
                        inviteId
                ).header("Authorization", bearer(leaderToken)))
                .andExpect(status().isNoContent());

        JsonNode invites = getJson(
                get("/api/v1/laboratories/{laboratoryId}/invites", laboratoryId),
                liToken,
                status().isOk()
        );
        assertThat(invites.at("/data/items/0/status").asText()).isEqualTo("REVOKED");

        performJson(
                post("/api/v1/laboratory-join-applications"),
                rejectedUserToken,
                Map.of("inviteCode", inviteCode, "message", "Try revoked invite"),
                status().isConflict()
        ).with(json -> assertThat(json.path("code").asText())
                .isEqualTo("LAB_INVITE_UNAVAILABLE"));

        JsonNode transferredLaboratory = performJson(
                patch("/api/v1/laboratories/{laboratoryId}/leader", laboratoryId),
                administratorToken,
                Map.of(
                        "leaderIdentifier", "wang",
                        "version", laboratoryVersion
                ),
                status().isOk()
        ).json();
        assertThat(transferredLaboratory.at("/data/leader/username").asText()).isEqualTo("wang");

        JsonNode transferredMembers = getJson(
                get("/api/v1/laboratories/{laboratoryId}/members", laboratoryId),
                wangToken,
                status().isOk()
        );
        assertThat(findMember(transferredMembers, "wang").path("role").asText())
                .isEqualTo("LAB_ADMIN");
        assertThat(findMember(transferredMembers, "zhang").path("role").asText())
                .isEqualTo("MENTOR");
    }

    @Test
    void approvingASecondPendingApplicationIsRejected() throws Exception {
        String administratorToken = loginToken("admin");
        String zhangToken = loginToken("zhang");
        String candidateUsername = "exclusive_" + shortId();
        register(candidateUsername, candidateUsername + "@example.com");
        String candidateToken = loginToken(candidateUsername);

        JsonNode firstLaboratory = performJson(
                post("/api/v1/laboratories"),
                administratorToken,
                Map.of(
                        "name", "First exclusive laboratory " + shortId(),
                        "description", "First laboratory for exclusive membership test",
                        "leaderIdentifier", "zhang"
                ),
                status().isCreated()
        ).json();
        JsonNode secondLaboratory = performJson(
                post("/api/v1/laboratories"),
                administratorToken,
                Map.of(
                        "name", "Second exclusive laboratory " + shortId(),
                        "description", "Second laboratory for exclusive membership test",
                        "leaderIdentifier", "admin"
                ),
                status().isCreated()
        ).json();
        String firstLaboratoryId = firstLaboratory.at("/data/id").asText();
        String secondLaboratoryId = secondLaboratory.at("/data/id").asText();

        String firstInviteCode = performJson(
                post("/api/v1/laboratories/{laboratoryId}/invites", firstLaboratoryId),
                zhangToken,
                Map.of("maxUses", 2),
                status().isCreated()
        ).json().at("/data/inviteCode").asText();
        String secondInviteCode = performJson(
                post("/api/v1/laboratories/{laboratoryId}/invites", secondLaboratoryId),
                administratorToken,
                Map.of("maxUses", 2),
                status().isCreated()
        ).json().at("/data/inviteCode").asText();

        JsonNode firstApplication = createApplication(
                candidateToken, firstInviteCode, "Apply to the first laboratory");
        JsonNode secondApplication = createApplication(
                candidateToken, secondInviteCode, "Apply to the second laboratory");

        approveApplication(
                zhangToken,
                firstLaboratoryId,
                firstApplication.at("/data/id").asText(),
                firstApplication.at("/data/version").asLong()
        );

        performJson(
                post(
                        "/api/v1/laboratories/{laboratoryId}/join-applications/{applicationId}/review",
                        secondLaboratoryId,
                        secondApplication.at("/data/id").asText()
                ),
                administratorToken,
                Map.of(
                        "decision", "APPROVE",
                        "version", secondApplication.at("/data/version").asLong()
                ),
                status().isConflict()
        ).with(json -> assertThat(json.path("code").asText())
                .isEqualTo("LAB_ALREADY_MEMBER"));

        JsonNode memberships = getJson(
                get("/api/v1/laboratories/mine"),
                candidateToken,
                status().isOk()
        );
        assertThat(memberships.at("/data")).hasSize(1);
        assertThat(memberships.at("/data/0/laboratory/id").asText())
                .isEqualTo(firstLaboratoryId);
    }

    private JsonNode createApplication(String token, String inviteCode, String message)
            throws Exception {
        JsonNode response = performJson(
                post("/api/v1/laboratory-join-applications"),
                token,
                Map.of("inviteCode", inviteCode, "message", message),
                status().isCreated()
        ).json();
        assertThat(response.at("/data/status").asText()).isEqualTo("PENDING");
        return response;
    }

    private void approveApplication(
            String token,
            String laboratoryId,
            String applicationId,
            long version
    ) throws Exception {
        performJson(
                post(
                        "/api/v1/laboratories/{laboratoryId}/join-applications/{applicationId}/review",
                        laboratoryId,
                        applicationId
                ),
                token,
                Map.of("decision", "APPROVE", "version", version),
                status().isOk()
        ).with(json -> assertThat(json.at("/data/status").asText()).isEqualTo("APPROVED"));
    }

    private void register(String username, String email) throws Exception {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("username", username);
        request.put("email", email);
        request.put("password", "password123");
        request.put("name", "Integration candidate");
        performJson(
                post("/api/v1/auth/register"),
                null,
                request,
                status().isCreated()
        );
    }

    private String loginToken(String identifier) throws Exception {
        JsonNode response = performJson(
                post("/api/v1/auth/login"),
                null,
                Map.of("identifier", identifier, "password", passwordFor(identifier)),
                status().isOk()
        ).json();
        return response.at("/data/token").asText();
    }

    private String passwordFor(String identifier) {
        return switch (identifier) {
            case "admin", "li", "wang", "zhang" -> "123456";
            default -> "password123";
        };
    }

    private JsonNode getJson(
            MockHttpServletRequestBuilder request,
            String token,
            ResultMatcher expectedStatus
    ) throws Exception {
        String response = mockMvc.perform(request.header("Authorization", bearer(token)))
                .andExpect(expectedStatus)
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response);
    }

    private JsonResult performJson(
            MockHttpServletRequestBuilder request,
            String token,
            Object body,
            ResultMatcher expectedStatus
    ) throws Exception {
        request.contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body));
        if (token != null) {
            request.header("Authorization", bearer(token));
        }
        String response = mockMvc.perform(request)
                .andExpect(expectedStatus)
                .andReturn()
                .getResponse()
                .getContentAsString();
        return new JsonResult(objectMapper.readTree(response));
    }

    private JsonNode findMember(JsonNode response, String username) {
        for (JsonNode member : response.at("/data/items")) {
            if (username.equals(member.at("/user/username").asText())) {
                return member;
            }
        }
        throw new AssertionError("Membership not found for " + username);
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }

    private String shortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }

    private record JsonResult(JsonNode json) {
        private void with(Consumer<JsonNode> assertion) {
            assertion.accept(json);
        }
    }
}
