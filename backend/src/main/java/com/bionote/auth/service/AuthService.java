package com.bionote.auth.service;

import com.bionote.auth.dto.LoginRequest;
import com.bionote.auth.dto.LoginResponse;
import com.bionote.auth.dto.UserResponse;
import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.security.JwtService;
import com.bionote.user.entity.User;
import com.bionote.user.entity.UserStatus;
import com.bionote.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .filter(candidate -> candidate.getStatus() == UserStatus.ACTIVE)
                .filter(candidate -> passwordEncoder.matches(request.password(), candidate.getPasswordHash()))
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.AUTH_INVALID_CREDENTIALS, "用户名或密码错误"));

        return new LoginResponse(
                jwtService.issueToken(user),
                "Bearer",
                jwtService.expirationSeconds(),
                UserResponse.from(user)
        );
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(String userId) {
        return userRepository.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.AUTH_UNAUTHORIZED, "当前用户不存在或已停用"));
    }
}
