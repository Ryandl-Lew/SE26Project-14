package com.bionote.auth;

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
    void registerCreatesLoginReadyAccount() throws Exception {
        String username = "student_" + shortId();
        String email = username + "@example.com";

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(username, email)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.username").value(username))
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.systemRole").doesNotExist())
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
                        .content(registerBody(username, email)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(username.toUpperCase(), "another@example.com")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AUTH_USERNAME_EXISTS"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("another_" + shortId(), email.toUpperCase())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AUTH_EMAIL_EXISTS"));
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

    private String registerBody(String username, String email) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "username", username,
                "email", email,
                "password", "password123",
                "name", "测试用户"
        ));
    }

    private String shortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }
}
