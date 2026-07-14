package com.bionote.file.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件存储服务契约，定义文件生命周期中与物理存储交互的核心操作。
 * <p>
 * 业务层（FileService）负责数据库元数据管理，并在合适的时机调用本接口
 * 完成磁盘文件的增删读操作。所有实现必须保证线程安全。
 */
public interface StorageService {

    /**
     * 存储上传文件到物理介质。
     *
     * @param file 客户端上传的文件，不可为 {@code null} 或空
     * @return 随机生成的存储标识（storageKey），形如 {@code uuid.ext}，
     *         供后续加载/删除时使用
     * @throws com.bionote.common.error.BusinessException 文件为空、扩展名不合法时抛出
     */
    String store(MultipartFile file);

    /**
     * 根据存储标识加载文件为 Spring {@link Resource}，供下载与预览使用。
     *
     * @param storageKey 由 {@link #store(MultipartFile)} 返回的存储标识
     * @return 可读的文件资源
     * @throws com.bionote.common.error.BusinessException 文件不存在或不可读时抛出
     */
    Resource loadAsResource(String storageKey);

    /**
     * 物理删除磁盘上的文件。
     * <p>
     * 注意：调用方应先在数据库层面完成软删除（逻辑删除），再调用本方法
     * 清理物理文件。本方法为幂等操作——文件已不存在时不抛异常。
     *
     * @param storageKey 由 {@link #store(MultipartFile)} 返回的存储标识
     */
    void delete(String storageKey);
}
