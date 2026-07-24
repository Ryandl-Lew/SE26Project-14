package com.bionote.template.repository;

import com.bionote.template.entity.UserTemplateFavorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserTemplateFavoriteRepository extends JpaRepository<UserTemplateFavorite, String> {

    List<UserTemplateFavorite> findByUserId(String userId);

    Optional<UserTemplateFavorite> findByUserIdAndTemplateId(String userId, String templateId);

    boolean existsByUserIdAndTemplateId(String userId, String templateId);

    void deleteByUserIdAndTemplateId(String userId, String templateId);
}
