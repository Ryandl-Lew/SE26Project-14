package com.bionote.file.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

final class FileContentDetector {
    private static final Map<String, String> CANONICAL_MIME = Map.of(
            "jpg", "image/jpeg",
            "png", "image/png",
            "pdf", "application/pdf",
            "csv", "text/csv",
            "xls", "application/vnd.ms-excel",
            "xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    String validateAndDetect(MultipartFile file, String extension) {
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException exception) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "无法读取上传文件");
        }

        boolean signatureMatches = switch (extension) {
            case "jpg" -> startsWith(bytes, 0xFF, 0xD8, 0xFF);
            case "png" -> startsWith(bytes, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
            case "pdf" -> startsWith(bytes, 0x25, 0x50, 0x44, 0x46, 0x2D);
            case "xls" -> startsWith(bytes, 0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1);
            case "xlsx" -> isXlsx(bytes);
            case "csv" -> isTextCsv(bytes);
            default -> false;
        };
        if (!signatureMatches) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE,
                    "文件内容与扩展名不匹配: ." + extension);
        }

        String detectedMime = CANONICAL_MIME.get(extension);
        validateDeclaredMime(file.getContentType(), extension, detectedMime);
        return detectedMime;
    }

    private void validateDeclaredMime(String declaredMime,
                                      String extension,
                                      String detectedMime) {
        if (declaredMime == null || declaredMime.isBlank()
                || "application/octet-stream".equalsIgnoreCase(declaredMime)) {
            return;
        }
        String normalized = declaredMime.toLowerCase(Locale.ROOT);
        Set<String> compatible = switch (extension) {
            case "jpg" -> Set.of("image/jpeg", "image/jpg");
            case "png" -> Set.of("image/png");
            case "pdf" -> Set.of("application/pdf");
            case "csv" -> Set.of("text/csv", "text/plain", "application/csv",
                    "application/vnd.ms-excel");
            case "xls" -> Set.of("application/vnd.ms-excel");
            case "xlsx" -> Set.of(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "application/zip");
            default -> Set.of(detectedMime);
        };
        if (!compatible.contains(normalized)) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE,
                    "声明的 MIME 类型与文件内容不匹配: " + declaredMime);
        }
    }

    private boolean isTextCsv(byte[] bytes) {
        for (byte value : bytes) {
            int unsigned = value & 0xFF;
            if (unsigned == 0 || (unsigned < 0x09)
                    || (unsigned > 0x0D && unsigned < 0x20)) {
                return false;
            }
        }
        try {
            StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes));
            return true;
        } catch (CharacterCodingException exception) {
            return false;
        }
    }

    private boolean isXlsx(byte[] bytes) {
        if (!startsWith(bytes, 0x50, 0x4B, 0x03, 0x04)) {
            return false;
        }
        boolean contentTypes = false;
        boolean workbookContent = false;
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(bytes))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                String name = entry.getName();
                contentTypes |= "[Content_Types].xml".equals(name);
                workbookContent |= name.startsWith("xl/");
                if (contentTypes && workbookContent) {
                    return true;
                }
            }
            return false;
        } catch (IOException exception) {
            return false;
        }
    }

    private boolean startsWith(byte[] bytes, int... signature) {
        if (bytes.length < signature.length) {
            return false;
        }
        for (int i = 0; i < signature.length; i++) {
            if ((bytes[i] & 0xFF) != signature[i]) {
                return false;
            }
        }
        return true;
    }
}
