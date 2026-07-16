package com.bionote.user.repository;

import com.bionote.user.entity.User;
import com.bionote.user.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    @Query("""
            select user from User user
            where user.usernameNormalized = :identifier
               or user.emailNormalized = :identifier
            """)
    Optional<User> findByLoginIdentifier(@Param("identifier") String identifier);

    Optional<User> findByIdAndStatus(String id, UserStatus status);

    boolean existsByUsernameNormalized(String usernameNormalized);

    boolean existsByEmailNormalized(String emailNormalized);
}
