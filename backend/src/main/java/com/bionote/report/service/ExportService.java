package com.bionote.report.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.entity.RecordStatus;
import com.bionote.record.repository.ExperimentRecordRepository;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.*;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExportService {

    private static final Logger log = LoggerFactory.getLogger(ExportService.class);

    private final ExperimentRecordRepository recordRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public ExportService(ExperimentRecordRepository recordRepository,
                         UserRepository userRepository,
                         ObjectMapper objectMapper) {
        this.recordRepository = recordRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    private String getOwnerName(ExperimentRecord record) {
        return userRepository.findById(record.getOwnerId())
                .map(User::getName)
                .orElse("未知");
    }

    private Map<String, Object> parseContent(String contentJson) {
        if (contentJson == null || contentJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(contentJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Map.of();
        }
    }

    @SuppressWarnings("unchecked")
    private String extractBody(Map<String, Object> content) {
        List<Map<String, Object>> sections = (List<Map<String, Object>>) content.getOrDefault("sections", List.of());
        StringBuilder sb = new StringBuilder();
        for (Map<String, Object> section : sections) {
            String title = (String) section.getOrDefault("title", "");
            String body = (String) section.getOrDefault("body", "");
            if (!title.isEmpty()) {
                sb.append(title).append("\n");
            }
            if (!body.isEmpty()) {
                sb.append(body).append("\n\n");
            }
        }
        return sb.toString().trim();
    }

    @SuppressWarnings("unchecked")
    private List<Reactant> extractReactionTable(Map<String, Object> content) {
        List<Map<String, Object>> sections = (List<Map<String, Object>>) content.getOrDefault("sections", List.of());
        for (Map<String, Object> section : sections) {
            List<Map<String, Object>> table = (List<Map<String, Object>>) section.get("table");
            if (table != null && !table.isEmpty()) {
                return table.stream()
                        .map(row -> new Reactant(
                                (String) row.getOrDefault("component", ""),
                                (String) row.getOrDefault("amount", "")))
                        .toList();
            }
        }
        return List.of();
    }

    // ──────────────────────────────────────────────
    // Markdown 导出
    // ──────────────────────────────────────────────

    public byte[] exportRecordToMarkdown(String recordId) {
        ExperimentRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "记录不存在"));

        String ownerName = getOwnerName(record);
        Map<String, Object> content = parseContent(record.getContentJson());
        String purpose = (String) content.getOrDefault("purpose", "");
        String body = extractBody(content);
        List<Reactant> reactionTable = extractReactionTable(content);

        StringBuilder md = new StringBuilder();
        md.append("# ").append(record.getTitle()).append("\n\n");
        md.append("> 实验编号: ").append(record.getCode()).append("\n");
        md.append("> 实验类型: ").append(record.getExperimentType()).append("\n");
        md.append("> 实验日期: ").append(record.getExperimentDate()).append("\n");
        md.append("> 实验地点: ").append(record.getLocation() != null ? record.getLocation() : "").append("\n");
        md.append("> 负责人:   ").append(ownerName).append("\n\n");

        md.append("---\n\n");
        md.append("## 实验目的\n\n");
        md.append(purpose).append("\n\n");

        md.append("## 实验内容\n\n");
        md.append(body).append("\n\n");

        if (!reactionTable.isEmpty()) {
            md.append("## 反应体系\n\n");
            md.append("| 组分 | 用量 |\n");
            md.append("|------|------|\n");
            for (Reactant r : reactionTable) {
                md.append("| ").append(r.component()).append(" | ")
                  .append(r.amount()).append(" |\n");
            }
            md.append("\n");
        }

        md.append("---\n\n");
        md.append("*报告由 BioNote 自动生成 — ")
          .append(LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE))
          .append("*\n");

        log.info("Markdown 已生成: recordId={}, length={}", recordId, md.length());
        return md.toString().getBytes(StandardCharsets.UTF_8);
    }

    // ──────────────────────────────────────────────
    // PDF 导出
    // ──────────────────────────────────────────────

    public byte[] exportRecordToPdf(String recordId) {
        ExperimentRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "记录不存在"));

        String ownerName = getOwnerName(record);
        Map<String, Object> content = parseContent(record.getContentJson());
        String purpose = (String) content.getOrDefault("purpose", "");
        String body = extractBody(content);
        List<Reactant> reactionTable = extractReactionTable(content);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            com.lowagie.text.Document document =
                    new com.lowagie.text.Document(PageSize.A4, 50, 50, 50, 50);
            PdfWriter.getInstance(document, baos);
            document.open();

            BaseFont cjkBaseFont = resolveCjkFont();
            Font titleFont = (cjkBaseFont != null)
                    ? new Font(cjkBaseFont, 20, Font.BOLD)
                    : FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
            Font headingFont = (cjkBaseFont != null)
                    ? new Font(cjkBaseFont, 14, Font.BOLD)
                    : FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font bodyFont = (cjkBaseFont != null)
                    ? new Font(cjkBaseFont, 11, Font.NORMAL)
                    : FontFactory.getFont(FontFactory.HELVETICA, 11);

            Paragraph titlePara = new Paragraph(record.getTitle(), titleFont);
            titlePara.setAlignment(Element.ALIGN_CENTER);
            titlePara.setSpacingAfter(10);
            document.add(titlePara);

            document.add(metaParagraph("实验编号", record.getCode(), bodyFont));
            document.add(metaParagraph("实验类型", record.getExperimentType(), bodyFont));
            document.add(metaParagraph("实验日期",
                    record.getExperimentDate() != null ? record.getExperimentDate().toString() : "", bodyFont));
            document.add(metaParagraph("实验地点",
                    record.getLocation() != null ? record.getLocation() : "", bodyFont));
            document.add(metaParagraph("负责人", ownerName, bodyFont));
            document.add(Chunk.NEWLINE);

            document.add(new Paragraph("实验目的", headingFont));
            document.add(new Paragraph(purpose, bodyFont));
            document.add(Chunk.NEWLINE);

            document.add(new Paragraph("实验内容", headingFont));
            document.add(new Paragraph(body, bodyFont));
            document.add(Chunk.NEWLINE);

            if (!reactionTable.isEmpty()) {
                document.add(new Paragraph("反应体系", headingFont));
                com.lowagie.text.Table table = new com.lowagie.text.Table(2);
                table.setPadding(4);
                table.setBorderWidth(0.5f);
                table.addCell(new Phrase("组分", headingFont));
                table.addCell(new Phrase("用量", headingFont));
                for (Reactant r : reactionTable) {
                    table.addCell(new Phrase(r.component(), bodyFont));
                    table.addCell(new Phrase(r.amount(), bodyFont));
                }
                document.add(table);
            }

            document.add(Chunk.NEWLINE);
            Paragraph footer = new Paragraph(
                    "报告由 BioNote 自动生成 — " +
                    LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE),
                    new Font(cjkBaseFont != null ? cjkBaseFont
                            : FontFactory.getFont(FontFactory.HELVETICA).getBaseFont(),
                            9, Font.ITALIC, new java.awt.Color(128, 128, 128)));
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();

            byte[] pdfBytes = baos.toByteArray();
            log.info("PDF 已生成: recordId={}, size={} bytes, cjkFont={}",
                    recordId, pdfBytes.length, cjkBaseFont != null);
            return pdfBytes;

        } catch (DocumentException | IOException e) {
            log.error("PDF 生成失败: recordId={}", recordId, e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "PDF 生成失败: " + e.getMessage());
        }
    }

    // ──────────────────────────────────────────────
    // Excel 导出
    // ──────────────────────────────────────────────

    public byte[] exportProjectToExcel(String projectId) {
        List<ExperimentRecord> records = recordRepository
                .findByProjectIdOrderByUpdatedAtDesc(projectId,
                        PageRequest.of(0, Integer.MAX_VALUE, Sort.by(Sort.Direction.DESC, "updatedAt")))
                .getContent();

        List<String> ownerIds = records.stream()
                .map(ExperimentRecord::getOwnerId).distinct().toList();
        Map<String, String> ownerNameMap = userRepository.findAllById(ownerIds).stream()
                .collect(Collectors.toMap(User::getId, User::getName));

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("实验记录一览");

            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.PALE_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);

            String[] headers = {"实验编号", "实验名称", "实验类型", "状态", "负责人", "日期"};
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (ExperimentRecord r : records) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                createCell(row, 0, r.getCode(), dataStyle);
                createCell(row, 1, r.getTitle(), dataStyle);
                createCell(row, 2, r.getExperimentType(), dataStyle);
                createCell(row, 3, r.getStatus() != null ? r.getStatus().name() : "", dataStyle);
                createCell(row, 4, ownerNameMap.getOrDefault(r.getOwnerId(), "未知"), dataStyle);
                createCell(row, 5,
                        r.getExperimentDate() != null ? r.getExperimentDate().toString() : "", dataStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                int width = Math.min(sheet.getColumnWidth(i) + 2000, 14000);
                sheet.setColumnWidth(i, width);
            }

            workbook.write(baos);
            byte[] excelBytes = baos.toByteArray();
            log.info("Excel 已生成: projectId={}, rows={}, size={} bytes",
                    projectId, records.size(), excelBytes.length);
            return excelBytes;

        } catch (IOException e) {
            log.error("Excel 生成失败: projectId={}", projectId, e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "Excel 生成失败: " + e.getMessage());
        }
    }

    // ──────────────────────────────────────────────
    // 中文字体解析
    // ──────────────────────────────────────────────

    private BaseFont resolveCjkFont() {
        String[] candidatePaths = {
                "C:/Windows/Fonts/msyh.ttc,0",
                "C:/Windows/Fonts/simsun.ttc,0",
                "C:/Windows/Fonts/simhei.ttf",
                "/System/Library/Fonts/PingFang.ttc,0",
                "/System/Library/Fonts/STHeiti Light.ttc,0",
                "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc,0",
                "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc,0",
                "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
        };

        for (String path : candidatePaths) {
            try {
                BaseFont bf = BaseFont.createFont(path, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                log.debug("已加载中文字体: {}", path);
                return bf;
            } catch (Exception ignored) {
            }
        }

        log.warn("未找到系统中文字体，PDF 中文内容可能无法正常显示。");
        return null;
    }

    private Paragraph metaParagraph(String label, String value, Font font) {
        Paragraph p = new Paragraph();
        p.add(new Phrase(label + "：",
                new Font(font.getBaseFont(), font.getSize(), Font.BOLD)));
        p.add(new Phrase(value, font));
        p.setSpacingAfter(2);
        return p;
    }

    private void createCell(org.apache.poi.ss.usermodel.Row row, int col,
                            String value, CellStyle style) {
        org.apache.poi.ss.usermodel.Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private record Reactant(String component, String amount) {
    }
}
