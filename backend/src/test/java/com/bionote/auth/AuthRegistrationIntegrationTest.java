package com.bionote.auth;

import com.bionote.laboratory.service.InviteCodeHasher;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthRegistrationIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private InviteCodeHasher inviteCodeHasher;

    @Test
    void loginByEmailIsCaseInsensitive() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody("  PI@EXAMPLE.COM  ", "123456")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.username").value("zhang"));
    }

    @Test
    void invalidCredentialsUseOneStableError() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody("li", "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("用户名、邮箱或密码错误"));
    }

    @Test
    void registerWithoutInviteCreatesLoginReadyAccount() throws Exception {
        String username = "student_" + shortId();
        String email = username + "@example.com";

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(username, email, null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.user.username").value(username))
                .andExpect(jsonPath("$.data.user.email").value(email))
                .andExpect(jsonPath("$.data.joinApplication").doesNotExist());

        String passwordHash = jdbcTemplate.queryForObject(
                "SELECT password_hash FROM users WHERE username = ?", String.class, username);
        assertThat(passwordHash).isNotEqualTo("password123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(email.toUpperCase(), "password123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.username").value(username));
    }

    @Test
    void registerRejectsDuplicateUsernameAndEmail() throws Exception {
        String username = "duplicate_" + shortId();
        String email = username + "@example.com";

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(username, email, null)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(username.toUpperCase(), "another@example.com", null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AUTH_USERNAME_EXISTS"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("another_" + shortId(), email.toUpperCase(), null)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AUTH_EMAIL_EXISTS"));
    }

    @Test
    void invalidInviteRollsBackRegistration() throws Exception {
        String username = "rollback_" + shortId();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(username, username + "@example.com", "invalid-code")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("LAB_INVITE_INVALID"));

        Integer userCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE username = ?", Integer.class, username);
        assertThat(userCount).isZero();
    }

    @Test
    void validInviteCreatesPendingApplicationAndConsumesOneUse() throws Exception {
        String inviteCode = "invite-" + UUID.randomUUID();
        TestInvite invite = insertActiveInvite(inviteCode);
        String username = "invitee_" + shortId();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(username, username + "@example.com", inviteCode)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.joinApplication.status").value("PENDING"))
                .andExpect(jsonPath("$.data.joinApplication.laboratory.id")
                        .value(invite.laboratoryId()));

        Integer usedCount = jdbcTemplate.queryForObject(
                "SELECT used_count FROM laboratory_invites WHERE id = ?",
                Integer.class,
                invite.inviteId());
        Integer applicationCount = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM laboratory_join_applications application
                JOIN users applicant ON applicant.id = application.user_id
                WHERE applicant.username = ? AND application.status = 'PENDING'
                """,
                Integer.class,
                username);
        assertThat(usedCount).isEqualTo(1);
        assertThat(applicationCount).isEqualTo(1);
    }

    @Test
    void disabledAccountCannotKeepUsingIssuedJwt() throws Exception {
        String token = loginToken("wang", "123456");
        jdbcTemplate.update("UPDATE users SET status = 'DISABLED' WHERE username = 'wang'");
        try {
            mockMvc.perform(get("/api/v1/auth/me")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("AUTH_UNAUTHORIZED"));
        } finally {
            jdbcTemplate.update("UPDATE users SET status = 'ACTIVE' WHERE username = 'wang'");
        }
    }

    private String loginToken(String identifier, String password) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(identifier, password)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode json = objectMapper.readTree(response);
        return json.at("/data/token").asText();
    }

    private String loginBody(String identifier, String password) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "identifier", identifier,
                "password", password
        ));
    }

    private String registerBody(String username, String email, String inviteCode) throws Exception {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("username", username);
        request.put("email", email);
        request.put("password", "password123");
        request.put("name", "测试用户");
        if (inviteCode != null) {
            request.put("labInviteCode", inviteCode);
            request.put("joinMessage", "申请加入实验室");
        }
        return objectMapper.writeValueAsString(request);
    }

    private TestInvite insertActiveInvite(String inviteCode) {
        String creatorId = jdbcTemplate.queryForObject(
                "SELECT id FROM users WHERE username = 'zhang'", String.class);
        String laboratoryId = UUID.randomUUID().toString();
        String inviteId = UUID.randomUUID().toString();
        Instant now = Instant.now();

        jdbcTemplate.update(
                """
                INSERT INTO laboratories (
                    id, code, name, description, status, created_by, version,
                    created_at, updated_at, archived_at
                ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, 0, ?, ?, NULL)
                """,
                laboratoryId,
                "LAB-" + shortId(),
                "认证测试实验室",
                "认证模块邀请码测试",
                creatorId,
                Timestamp.from(now),
                Timestamp.from(now));

        jdbcTemplate.update(
                """
                INSERT INTO laboratory_invites (
                    id, laboratory_id, code_hash, code_hint, status, expires_at,
                    max_uses, used_count, created_by, version, created_at, updated_at, revoked_at
                ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, 3, 0, ?, 0, ?, ?, NULL)
                """,
                inviteId,
                laboratoryId,
                inviteCodeHasher.hash(inviteCode),
                "test",
                Timestamp.from(now.plusSeconds(3600)),
                creatorId,
                Timestamp.from(now),
                Timestamp.from(now));
        return new TestInvite(laboratoryId, inviteId);
    }

    private String shortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }

    private record TestInvite(String laboratoryId, String inviteId) {
    }
}
