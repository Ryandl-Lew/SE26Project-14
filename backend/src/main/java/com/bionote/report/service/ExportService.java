package com.bionote.report.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
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

// 注: Row / Cell 因 OpenPDF 存在同名类，在代码中使用完全限定名以避免歧义
// org.apache.poi.ss.usermodel.Row  → 方法内全限定引用
// org.apache.poi.ss.usermodel.Cell → 方法内全限定引用
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * 报告导出服务。
 *
 * <h3>支持格式</h3>
 * <ul>
 *   <li><b>Markdown</b> (.md)：纯文本，拼接实验记录元数据与内容。</li>
 *   <li><b>PDF</b> (.pdf)：基于 OpenPDF，支持中文字符（需系统安装中文字体）。</li>
 *   <li><b>Excel</b> (.xlsx)：基于 Apache POI，生成项目下的实验记录一览表。</li>
 * </ul>
 *
 * <h3>当前阶段</h3>
 * 使用 Mock 数据演示导出流程。后续接入真实数据库后，
 * 将 {@code loadMockRecord} / {@code loadMockProjectRecords} 替换为
 * Repository 查询即可。
 *
 * <h3>TODO</h3>
 * <ul>
 *   <li>PDF 中文字体嵌入：打包 Noto Sans SC 子集字体到 resources/fonts/，
 *       替代运行时探测系统字体。</li>
 *   <li>Excel 导出接入真实实验记录数据（P2 阶段）。</li>
 *   <li>Markdown 模板引擎（如 Mustache / Thymeleaf）可选升级。</li>
 * </ul>
 */
@Service
public class ExportService {

    private static final Logger log = LoggerFactory.getLogger(ExportService.class);

    // ──────────────────────────────────────────────
    // Markdown 导出
    // ──────────────────────────────────────────────

    /**
     * 将指定实验记录导出为 Markdown 文本。
     *
     * @param recordId 实验记录 ID
     * @return Markdown 文本的字节数组（UTF-8）
     */
    public byte[] exportRecordToMarkdown(String recordId) {
        MockRecord record = loadMockRecord(recordId);

        StringBuilder md = new StringBuilder();
        md.append("# ").append(record.title()).append("\n\n");
        md.append("> 实验编号: ").append(record.code()).append("\n");
        md.append("> 实验类型: ").append(record.experimentType()).append("\n");
        md.append("> 实验日期: ").append(record.experimentDate()).append("\n");
        md.append("> 实验地点: ").append(record.location()).append("\n");
        md.append("> 负责人:   ").append(record.ownerName()).append("\n\n");

        md.append("---\n\n");
        md.append("## 实验目的\n\n");
        md.append(record.purpose()).append("\n\n");

        md.append("## 实验内容\n\n");
        md.append(record.body()).append("\n\n");

        if (!record.reactionTable().isEmpty()) {
            md.append("## 反应体系\n\n");
            md.append("| 组分 | 用量 |\n");
            md.append("|------|------|\n");
            for (Reactant r : record.reactionTable()) {
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

    /**
     * 将指定实验记录渲染为 PDF 文件。
     *
     * <h3>中文字体策略</h3>
     * <ol>
     *   <li>按顺序探测系统常见中文字体路径；</li>
     *   <li>若找到则使用该字体渲染中文内容；</li>
     *   <li>若未找到，回退为 Helvetica（ASCII 无问题，中文将显示为空白）。
     *       生产环境请将 CJK 字体文件放入 {@code src/main/resources/fonts/}
     *       并通过 {@code classpath:} 加载。</li>
     * </ol>
     *
     * @param recordId 实验记录 ID
     * @return PDF 文件字节数组
     */
    public byte[] exportRecordToPdf(String recordId) {
        MockRecord record = loadMockRecord(recordId);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            com.lowagie.text.Document document =
                    new com.lowagie.text.Document(PageSize.A4, 50, 50, 50, 50);
            PdfWriter.getInstance(document, baos);
            document.open();

            // ── 加载中文字体 ──
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

            // ── 标题 ──
            Paragraph titlePara = new Paragraph(record.title(), titleFont);
            titlePara.setAlignment(Element.ALIGN_CENTER);
            titlePara.setSpacingAfter(10);
            document.add(titlePara);

            // ── 元信息表 ──
            document.add(metaParagraph("实验编号", record.code(), bodyFont));
            document.add(metaParagraph("实验类型", record.experimentType(), bodyFont));
            document.add(metaParagraph("实验日期", record.experimentDate(), bodyFont));
            document.add(metaParagraph("实验地点", record.location(), bodyFont));
            document.add(metaParagraph("负责人", record.ownerName(), bodyFont));
            document.add(Chunk.NEWLINE);

            // ── 实验目的 ──
            document.add(new Paragraph("实验目的", headingFont));
            document.add(new Paragraph(record.purpose(), bodyFont));
            document.add(Chunk.NEWLINE);

            // ── 实验内容 ──
            document.add(new Paragraph("实验内容", headingFont));
            document.add(new Paragraph(record.body(), bodyFont));
            document.add(Chunk.NEWLINE);

            // ── 反应体系表格 ──
            if (!record.reactionTable().isEmpty()) {
                document.add(new Paragraph("反应体系", headingFont));
                com.lowagie.text.Table table = new com.lowagie.text.Table(2);
                table.setPadding(4);
                table.setBorderWidth(0.5f);

                table.addCell(new Phrase("组分", headingFont));
                table.addCell(new Phrase("用量", headingFont));
                for (Reactant r : record.reactionTable()) {
                    table.addCell(new Phrase(r.component(), bodyFont));
                    table.addCell(new Phrase(r.amount(), bodyFont));
                }
                document.add(table);
            }

            // ── 页脚 ──
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

    /**
     * 将指定项目下的实验记录导出为 Excel 工作簿。
     *
     * @param projectId 项目 ID
     * @return Excel (.xlsx) 文件字节数组
     */
    public byte[] exportProjectToExcel(String projectId) {
        List<MockRecordSummary> records = loadMockProjectRecords(projectId);

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("实验记录一览");

            // ── 表头样式 ──
            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.PALE_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            // ── 数据行样式 ──
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);

            // ── 表头 ──
            String[] headers = {"实验编号", "实验名称", "实验类型", "状态", "负责人", "日期"};
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // ── 数据行 ──
            int rowIdx = 1;
            for (MockRecordSummary r : records) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                createCell(row, 0, r.code(), dataStyle);
                createCell(row, 1, r.title(), dataStyle);
                createCell(row, 2, r.experimentType(), dataStyle);
                createCell(row, 3, r.status(), dataStyle);
                createCell(row, 4, r.ownerName(), dataStyle);
                createCell(row, 5, r.experimentDate(), dataStyle);
            }

            // ── 自动列宽 ──
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                // 加一点额外宽度避免中文列过窄
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

    /**
     * 探测系统可用的中文字体。
     *
     * @return 可用的 {@link BaseFont}；若未找到则返回 {@code null}
     */
    private BaseFont resolveCjkFont() {
        // 常见系统中文字体路径（按优先级排列）
        String[] candidatePaths = {
                // Windows
                "C:/Windows/Fonts/msyh.ttc,0",        // 微软雅黑（未加粗）
                "C:/Windows/Fonts/simsun.ttc,0",      // 宋体
                "C:/Windows/Fonts/simhei.ttf",         // 黑体
                // macOS
                "/System/Library/Fonts/PingFang.ttc,0",
                "/System/Library/Fonts/STHeiti Light.ttc,0",
                // Linux
                "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc,0",
                "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc,0",
                "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
        };

        for (String path : candidatePaths) {
            try {
                BaseFont bf = BaseFont.createFont(path, BaseFont.IDENTITY_H,
                        BaseFont.EMBEDDED);
                log.debug("已加载中文字体: {}", path);
                return bf;
            } catch (Exception ignored) {
                // 该路径无字体，继续尝试下一个
            }
        }

        log.warn("未找到系统中文字体，PDF 中文内容可能无法正常显示。"
                + "请将 CJK 字体文件放入 resources/fonts/ 并通过 classpath 加载。");
        return null;
    }

    // ──────────────────────────────────────────────
    // 工具方法
    // ──────────────────────────────────────────────

    /** 生成 "标签: 值" 样式的元信息段落。 */
    private Paragraph metaParagraph(String label, String value, Font font) {
        Paragraph p = new Paragraph();
        p.add(new Phrase(label + "：",
                new Font(font.getBaseFont(), font.getSize(), Font.BOLD)));
        p.add(new Phrase(value, font));
        p.setSpacingAfter(2);
        return p;
    }

    /** 在单元格中写入字符串，避免 null 异常。 */
    private void createCell(org.apache.poi.ss.usermodel.Row row, int col,
                            String value, CellStyle style) {
        org.apache.poi.ss.usermodel.Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    // ──────────────────────────────────────────────
    // Mock 数据
    // ──────────────────────────────────────────────

    /**
     * 加载单条实验记录（Mock）。
     * TODO: 替换为 ExperimentRecordRepository.findById(recordId)
     */
    private MockRecord loadMockRecord(String recordId) {
        return new MockRecord(
                "EXP-20260707-001",
                "PCR 扩增 GFP 片段",
                "PCR",
                "2026-07-07",
                "分子生物学教学实验室 A203",
                "李同学",
                "以 Sample-001 为模板扩增 GFP 目标片段，为后续酶切连接和重组质粒构建提供目的基因片段。验证引物特异性并优化退火温度。",
                "本次 PCR 使用 Sample-001 作为模板，GFP-F / GFP-R 作为引物。"
                + "反应体系总体积 50 μL，退火温度 58 ℃，循环 35 次。"
                + "电泳检测结果显示约 750 bp 处有明显条带，阴性对照未见扩增，"
                + "初步判断 GFP 片段扩增成功，产物可用于后续酶切和连接实验。",
                List.of(
                        new Reactant("Template DNA", "1 μL"),
                        new Reactant("Forward Primer (10 μM)", "1 μL"),
                        new Reactant("Reverse Primer (10 μM)", "1 μL"),
                        new Reactant("2× Master Mix", "25 μL"),
                        new Reactant("ddH₂O", "22 μL"),
                        new Reactant("Total", "50 μL")
                )
        );
    }

    /**
     * 加载项目下的实验记录列表（Mock）。
     * TODO: 替换为 ExperimentRecordRepository.findByProjectId(projectId)
     */
    private List<MockRecordSummary> loadMockProjectRecords(String projectId) {
        return List.of(
                new MockRecordSummary("EXP-20260707-001", "PCR 扩增 GFP 片段",
                        "PCR", "待审核", "李同学", "2026-07-07"),
                new MockRecordSummary("EXP-20260706-001", "质粒 pEGFP-N1 小提",
                        "质粒提取", "已完成", "王同学", "2026-07-06"),
                new MockRecordSummary("EXP-20260706-002", "Western blot 验证 GFP 表达",
                        "WB", "进行中", "陈同学", "2026-07-06"),
                new MockRecordSummary("EXP-20260703-001", "测序送样",
                        "测序", "已完成", "陈同学", "2026-07-03"),
                new MockRecordSummary("EXP-20260702-001", "细胞转染效率测定",
                        "转染", "已完成", "李同学", "2026-07-02"),
                new MockRecordSummary("EXP-20260630-001", "qPCR 检测 IFN-β 表达",
                        "qPCR", "退回修改", "李同学", "2026-06-30")
        );
    }

    // ──────────────────────────────────────────────
    // 内部 Mock 数据类型
    // ──────────────────────────────────────────────

    /** 单条实验记录（完整内容）。 */
    private record MockRecord(
            String code, String title, String experimentType,
            String experimentDate, String location, String ownerName,
            String purpose, String body, List<Reactant> reactionTable) {
    }

    /** 项目下实验记录一览条目。 */
    private record MockRecordSummary(
            String code, String title, String experimentType,
            String status, String ownerName, String experimentDate) {
    }

    /** 反应体系组分。 */
    private record Reactant(String component, String amount) {
    }
}
