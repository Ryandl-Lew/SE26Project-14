package com.bionote.common.config;

import com.bionote.user.entity.User;
import com.bionote.user.entity.SystemRole;
import com.bionote.user.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Component
public class DemoDataInitializer implements ApplicationRunner {
    private final SeedProperties properties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataInitializer(
            SeedProperties properties,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) {
            return;
        }
        createUser("admin", "系统管理员", "admin@example.com", "管", SystemRole.ADMIN);
        createUser("li", "李同学", "li@example.com", "李", SystemRole.USER);
        createUser("wang", "王同学", "wang@example.com", "王", SystemRole.USER);
        createUser("zhang", "张老师", "pi@example.com", "张", SystemRole.USER);
    }

    private void createUser(
            String username,
            String name,
            String email,
            String avatarText,
            SystemRole systemRole
    ) {
        if (!userRepository.existsByUsernameNormalized(username.toLowerCase(Locale.ROOT))) {
            userRepository.save(new User(
                    username,
                    passwordEncoder.encode("123456"),
                    name,
                    email,
                    avatarText,
                    systemRole
            ));
        }
    }
}
