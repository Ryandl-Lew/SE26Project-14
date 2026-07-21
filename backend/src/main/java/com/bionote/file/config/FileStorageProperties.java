package com.bionote.file.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;

import java.util.List;

/**
 * 文件存储相关配置，绑定 {@code application.yml} 中以 {@code bionote.storage} 为前缀的属性。
 * <p>
 * 典型配置示例：
 * <pre>{@code
 * bionote:
 *   storage:
 *     upload-dir: ./storage
 *     allowed-extensions:
 *       - jpg
 *       - png
 *       - pdf
 *       - csv
 *       - xls
 *       - xlsx
 * }</pre>
 */
@ConfigurationProperties(prefix = "bionote.storage")
public class FileStorageProperties {

    /**
     * 文件上传的本地存储根目录，支持相对路径（相对于应用工作目录）或绝对路径。
     * 默认值：{@code ./storage}
     */
    private String uploadDir = "./storage";

    /**
     * 允许上传的文件扩展名列表（小写，不含点号）。
     * 默认值：jpg, png, pdf, csv, xls, xlsx
     */
    private List<String> allowedExtensions = List.of("jpg", "png", "pdf", "csv", "xls", "xlsx");

    private DataSize maxSize = DataSize.ofMegabytes(20);

    public String getUploadDir() {
        return uploadDir;
    }

    public void setUploadDir(String uploadDir) {
        this.uploadDir = uploadDir;
    }

    public List<String> getAllowedExtensions() {
        return allowedExtensions;
    }

    public void setAllowedExtensions(List<String> allowedExtensions) {
        this.allowedExtensions = allowedExtensions;
    }

    public DataSize getMaxSize() {
        return maxSize;
    }

    public void setMaxSize(DataSize maxSize) {
        this.maxSize = maxSize;
    }
}
