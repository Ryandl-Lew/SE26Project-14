package com.bionote.auth.service;

import com.bionote.auth.dto.LoginRequest;
import com.bionote.auth.dto.LoginResponse;
import com.bionote.auth.dto.RegisterRequest;
import com.bionote.auth.dto.RegisterResponse;
import com.bionote.auth.dto.UserResponse;
import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.security.JwtService;
import com.bionote.laboratory.dto.RegistrationJoinApplicationResponse;
import com.bionote.laboratory.service.RegistrationInviteApplicationService;
import com.bionote.user.entity.User;
import com.bionote.user.entity.UserStatus;
import com.bionote.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RegistrationInviteApplicationService registrationInviteApplicationService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RegistrationInviteApplicationService registrationInviteApplicationService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.registrationInviteApplicationService = registrationInviteApplicationService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String identifier = request.identifier().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByLoginIdentifier(identifier)
                .filter(candidate -> candidate.getStatus() == UserStatus.ACTIVE)
                .filter(candidate -> passwordEncoder.matches(request.password(), candidate.getPasswordHash()))
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.AUTH_INVALID_CREDENTIALS, "用户名、邮箱或密码错误"));

        return new LoginResponse(
                jwtService.issueToken(user),
                "Bearer",
                jwtService.expirationSeconds(),
                UserResponse.from(user)
        );
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String username = request.username().trim();
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String name = request.name().trim();
        String inviteCode = trimToNull(request.labInviteCode());
        String joinMessage = trimToNull(request.joinMessage());

        if (userRepository.existsByUsernameNormalized(username.toLowerCase(Locale.ROOT))) {
            throw new BusinessException(ErrorCode.AUTH_USERNAME_EXISTS, "用户名已被注册");
        }
        if (userRepository.existsByEmailNormalized(email)) {
            throw new BusinessException(ErrorCode.AUTH_EMAIL_EXISTS, "邮箱已被注册");
        }
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "密码编码后不能超过72字节");
        }
        if (inviteCode == null && joinMessage != null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "未填写实验室邀请码时不能填写申请说明");
        }

        User user = userRepository.saveAndFlush(new User(
                username,
                passwordEncoder.encode(request.password()),
                name,
                email,
                resolveAvatarText(request.avatarText(), name)
        ));

        RegistrationJoinApplicationResponse joinApplication = inviteCode == null
                ? null
                : registrationInviteApplicationService.createForRegistration(
                        user.getId(), inviteCode, joinMessage);

        return new RegisterResponse(UserResponse.from(user), joinApplication);
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(String userId) {
        return userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .map(UserResponse::from)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.AUTH_UNAUTHORIZED, "当前用户不存在或已停用"));
    }

    private String resolveAvatarText(String avatarText, String name) {
        String normalizedAvatarText = trimToNull(avatarText);
        if (normalizedAvatarText != null) {
            return normalizedAvatarText;
        }
        int firstCodePointEnd = name.offsetByCodePoints(0, 1);
        return name.substring(0, firstCodePointEnd);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
