package com.bionote.file.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.file.config.FileStorageProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 基于本地文件系统的 {@link StorageService} 实现。
 *
 * <h3>安全措施</h3>
 * <ul>
 *   <li>上传文件使用 {@link UUID} 重命名为随机文件名，杜绝路径穿越攻击。</li>
 *   <li>加载/删除前校验解析后的 {@link Path} 确实位于配置的上传根目录内。</li>
 *   <li>扩展名白名单校验，仅允许配置中指定的类型。</li>
 * </ul>
 *
 * <h3>线程安全</h3>
 * 本实现为无状态服务（仅依赖不可变配置），所有方法线程安全。
 */
@Service
public class LocalStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);

    private final Path uploadRoot;
    private final Set<String> allowedExtensions;

    public LocalStorageService(FileStorageProperties properties) {
        this.uploadRoot = Paths.get(properties.getUploadDir()).toAbsolutePath().normalize();
        this.allowedExtensions = properties.getAllowedExtensions().stream()
                .map(ext -> ext.toLowerCase(Locale.ROOT))
                .collect(Collectors.toUnmodifiableSet());
        initStorageDirectory();
    }

    /**
     * 确保上传根目录存在；若创建失败则快速失败。
     */
    private void initStorageDirectory() {
        try {
            Files.createDirectories(uploadRoot);
            log.info("文件存储根目录已就绪: {}", uploadRoot);
        } catch (IOException e) {
            throw new IllegalStateException(
                    "无法创建文件存储根目录: " + uploadRoot.toAbsolutePath(), e);
        }
    }

    @Override
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "上传文件不能为空");
        }

        String originalFilename = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown");
        String extension = extractExtension(originalFilename);

        if (!allowedExtensions.contains(extension.toLowerCase(Locale.ROOT))) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE,
                    "不支持的文件类型: ." + extension + "，允许的类型: " + allowedExtensions);
        }

        String storageKey = UUID.randomUUID().toString() + "." + extension.toLowerCase(Locale.ROOT);
        Path targetPath = uploadRoot.resolve(storageKey);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("文件已存储: {} -> {}", originalFilename, storageKey);
            return storageKey;
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "文件存储失败: " + e.getMessage());
        }
    }

    @Override
    public Resource loadAsResource(String storageKey) {
        Path filePath = resolveSafe(storageKey);

        if (!Files.exists(filePath)) {
            throw new BusinessException(ErrorCode.PHYSICAL_FILE_MISSING,
                    "物理文件已丢失（数据库记录存在，但磁盘文件缺失）: " + storageKey);
        }

        if (!Files.isReadable(filePath)) {
            throw new BusinessException(ErrorCode.PHYSICAL_FILE_MISSING,
                    "物理文件不可读（可能存在权限问题）: " + storageKey);
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new BusinessException(ErrorCode.PHYSICAL_FILE_MISSING,
                        "文件资源不可用: " + storageKey);
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "文件路径解析失败: " + storageKey);
        }
    }

    @Override
    public void delete(String storageKey) {
        Path filePath = resolveSafe(storageKey);

        try {
            boolean deleted = Files.deleteIfExists(filePath);
            if (deleted) {
                log.info("文件已物理删除: {}", storageKey);
            } else {
                log.debug("文件不存在，无需删除: {}", storageKey);
            }
        } catch (IOException e) {
            log.warn("删除文件失败: {} — {}", storageKey, e.getMessage());
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "文件删除失败: " + e.getMessage());
        }
    }

    /**
     * 安全解析 storageKey 为绝对路径，并校验结果位于上传根目录内。
     * <p>
     * 即使 storageKey 由系统生成（UUID + 扩展名），此处仍然做防御性校验，
     * 防止未来代码变更或外部输入导致的路径穿越风险。
     *
     * @param storageKey 存储标识
     * @return 位于上传根目录内的绝对路径
     * @throws BusinessException 路径穿越检测时抛出
     */
    private Path resolveSafe(String storageKey) {
        // 防御：清理可能存在的路径穿越字符
        String cleaned = StringUtils.cleanPath(storageKey);
        Path resolved = uploadRoot.resolve(cleaned).normalize().toAbsolutePath();

        if (!resolved.startsWith(uploadRoot)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED,
                    "非法的文件路径: " + storageKey);
        }
        return resolved;
    }

    /**
     * 从原始文件名中提取扩展名（不含点号）。
     *
     * @param filename 原始文件名
     * @return 小写的扩展名，若无扩展名则返回空字符串
     */
    private String extractExtension(String filename) {
        String extension = StringUtils.getFilenameExtension(filename);
        return extension != null ? extension : "";
    }
}
