package com.bionote.user.repository;

import com.bionote.user.entity.User;
import com.bionote.user.entity.UserStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select user from User user where user.id = :userId")
    Optional<User> findByIdForUpdate(@Param("userId") String userId);

    boolean existsByUsernameNormalized(String usernameNormalized);

    boolean existsByEmailNormalized(String emailNormalized);
}
