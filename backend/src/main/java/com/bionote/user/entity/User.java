package com.bionote.user.entity;

import com.bionote.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "users")
public class User extends BaseEntity {
    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Column(name = "username_normalized", insertable = false, updatable = false, length = 64)
    private String usernameNormalized;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "email_normalized", insertable = false, updatable = false, length = 255)
    private String emailNormalized;

    @Column(name = "avatar_text", length = 8)
    private String avatarText;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 32)
    private UserStatus status;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "system_role", nullable = false, length = 32)
    private SystemRole systemRole;

    protected User() {
    }

    public User(
            String username,
            String passwordHash,
            String name,
            String email,
            String avatarText
    ) {
        this(username, passwordHash, name, email, avatarText, SystemRole.USER);
    }

    public User(
            String username,
            String passwordHash,
            String name,
            String email,
            String avatarText,
            SystemRole systemRole
    ) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.name = name;
        this.email = email;
        this.avatarText = avatarText;
        this.status = UserStatus.ACTIVE;
        this.systemRole = systemRole;
    }

    public String getUsername() {
        return username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getAvatarText() {
        return avatarText;
    }

    public UserStatus getStatus() {
        return status;
    }

    public SystemRole getSystemRole() {
        return systemRole;
    }
}
