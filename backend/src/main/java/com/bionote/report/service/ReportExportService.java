package com.bionote.report.service;

import com.bionote.collaboration.entity.Review;
import com.bionote.collaboration.repository.ReviewRepository;
import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.file.entity.Attachment;
import com.bionote.file.repository.AttachmentRepository;
import com.bionote.project.ProjectRepository;
import com.bionote.project.entity.Project;
import com.bionote.project.service.ProjectAccessService;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.repository.ExperimentRecordRepository;
import com.bionote.record.service.RecordQueryService;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReportExportService {
    private static final String FONT_RESOURCE = "fonts/NotoSansSC-VF.ttf";
    private static final DateTimeFormatter REPORT_TIME =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ProjectAccessService accessService;
    private final ProjectRepository projectRepository;
    private final ExperimentRecordRepository recordRepository;
    private final RecordQueryService recordQueryService;
    private final AttachmentRepository attachmentRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public ReportExportService(ProjectAccessService accessService,
                               ProjectRepository projectRepository,
                               ExperimentRecordRepository recordRepository,
                               RecordQueryService recordQueryService,
                               AttachmentRepository attachmentRepository,
                               ReviewRepository reviewRepository,
                               UserRepository userRepository,
                               ObjectMapper objectMapper) {
        this.accessService = accessService;
        this.projectRepository = projectRepository;
        this.recordRepository = recordRepository;
        this.recordQueryService = recordQueryService;
        this.attachmentRepository = attachmentRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public byte[] exportProjectMarkdown(String projectId, String currentUserId) {
        ProjectReport report = buildProjectReport(projectId, currentUserId);
        StringBuilder markdown = new StringBuilder();
        markdown.append("# ").append(report.project().getName()).append("\n\n")
                .append("- 项目编号：").append(report.project().getCode()).append("\n")
                .append("- 状态：").append(report.project().getStatus()).append("\n")
                .append("- 负责人：").append(report.projectOwnerName()).append("\n")
                .append("- 描述：").append(report.project().getDescription()).append("\n\n");
        appendFilesMarkdown(markdown, "项目文件", report.projectFiles());
        for (RecordReport record : report.records()) {
            markdown.append("\n## ").append(record.record().getTitle()).append("\n\n")
                    .append("- 实验编号：").append(record.record().getCode()).append("\n")
                    .append("- 类型：").append(record.record().getExperimentType()).append("\n")
                    .append("- 状态：").append(record.record().getStatus()).append("\n")
                    .append("- 负责人：").append(record.ownerName()).append("\n")
                    .append("- 日期：").append(record.record().getExperimentDate()).append("\n\n")
                    .append("### 实验内容\n\n```json\n")
                    .append(prettyJson(record.record().getContentJson())).append("\n```\n\n");
            appendFilesMarkdown(markdown, "记录附件", record.attachments());
            appendReviewsMarkdown(markdown, record.reviews());
        }
        return markdown.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Transactional(readOnly = true)
    public byte[] exportProjectPdf(String projectId, String currentUserId) {
        ProjectReport report = buildProjectReport(projectId, currentUserId);
        return renderPdf(report.project().getName(), (document, fonts) -> {
            addMeta(document, fonts, "项目编号", report.project().getCode());
            addMeta(document, fonts, "项目状态", report.project().getStatus().name());
            addMeta(document, fonts, "项目负责人", report.projectOwnerName());
            addMeta(document, fonts, "项目描述", report.project().getDescription());
            addFilesPdf(document, fonts, "项目文件", report.projectFiles());
            for (RecordReport record : report.records()) {
                document.newPage();
                addRecordPdf(document, fonts, record);
            }
        });
    }

    @Transactional(readOnly = true)
    public byte[] exportRecordPdf(String recordId, String currentUserId) {
        ExperimentRecord record = recordQueryService.getRecord(recordId, currentUserId);
        ProjectReport projectReport = buildProjectReport(record.getProjectId(), currentUserId);
        RecordReport report = projectReport.records().stream()
                .filter(item -> item.record().getId().equals(recordId))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "记录不存在"));
        return renderPdf(report.record().getTitle(), (document, fonts) -> {
            addMeta(document, fonts, "所属项目", projectReport.project().getName());
            addRecordPdf(document, fonts, report);
        });
    }

    @Transactional(readOnly = true)
    public byte[] exportProjectExcel(String projectId, String currentUserId) {
        ProjectReport report = buildProjectReport(projectId, currentUserId);
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            CellStyle header = createHeaderStyle(workbook);
            writeProjectSheet(workbook, header, report);
            writeRecordSheet(workbook, header, report.records());
            writeAttachmentSheet(workbook, header, report);
            writeReviewSheet(workbook, header, report.records());
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Excel 生成失败");
        }
    }

    private ProjectReport buildProjectReport(String projectId, String currentUserId) {
        accessService.requireCanRead(projectId, currentUserId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "项目不存在"));
        List<ExperimentRecord> records = recordRepository.findByProjectIdOrderByUpdatedAtDesc(projectId);
        List<String> recordIds = records.stream().map(ExperimentRecord::getId).toList();
        List<Attachment> projectFiles = attachmentRepository
                .findByProjectIdOrderByCreatedAtDesc(projectId);
        List<Attachment> recordFiles = recordIds.isEmpty()
                ? List.of() : attachmentRepository.findByRecordIdIn(recordIds);
        List<Review> reviews = recordIds.isEmpty()
                ? List.of() : reviewRepository.findByRecordIdInOrderByCreatedAtDesc(recordIds);

        List<String> userIds = new ArrayList<>();
        userIds.add(project.getOwnerId());
        records.forEach(item -> userIds.add(item.getOwnerId()));
        projectFiles.forEach(item -> userIds.add(item.getUploadedBy()));
        recordFiles.forEach(item -> userIds.add(item.getUploadedBy()));
        reviews.forEach(item -> userIds.add(item.getReviewerId()));
        Map<String, User> users = loadUsers(userIds);

        Map<String, List<Attachment>> filesByRecord = recordFiles.stream()
                .collect(Collectors.groupingBy(Attachment::getRecordId));
        Map<String, List<Review>> reviewsByRecord = reviews.stream()
                .collect(Collectors.groupingBy(Review::getRecordId));
        List<RecordReport> recordReports = records.stream()
                .map(item -> new RecordReport(item, userName(users, item.getOwnerId()),
                        filesByRecord.getOrDefault(item.getId(), List.of()).stream()
                                .map(file -> toFileReport(file, users)).toList(),
                        reviewsByRecord.getOrDefault(item.getId(), List.of()).stream()
                                .map(review -> toReviewReport(review, users)).toList()))
                .toList();
        return new ProjectReport(project, userName(users, project.getOwnerId()),
                projectFiles.stream().map(file -> toFileReport(file, users)).toList(),
                recordReports);
    }

    private byte[] renderPdf(String title, PdfContent content) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 42, 42, 42, 42);
            PdfWriter.getInstance(document, output);
            document.open();
            PdfFonts fonts = loadFonts();
            Paragraph titleParagraph = new Paragraph(title, fonts.title());
            titleParagraph.setAlignment(Element.ALIGN_CENTER);
            titleParagraph.setSpacingAfter(16);
            document.add(titleParagraph);
            content.write(document, fonts);
            document.close();
            return output.toByteArray();
        } catch (DocumentException | IOException exception) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "PDF 生成失败: " + exception.getMessage());
        }
    }

    private PdfFonts loadFonts() throws IOException, DocumentException {
        byte[] fontBytes = new ClassPathResource(FONT_RESOURCE).getInputStream().readAllBytes();
        BaseFont baseFont = BaseFont.createFont(
                "NotoSansSC-VF.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED,
                true, fontBytes, null);
        return new PdfFonts(
                new Font(baseFont, 19, Font.BOLD),
                new Font(baseFont, 14, Font.BOLD),
                new Font(baseFont, 10.5f, Font.NORMAL),
                new Font(baseFont, 9, Font.NORMAL));
    }

    private void addRecordPdf(Document document, PdfFonts fonts, RecordReport report)
            throws DocumentException {
        Paragraph heading = new Paragraph(report.record().getTitle(), fonts.heading());
        heading.setSpacingBefore(14);
        heading.setSpacingAfter(8);
        document.add(heading);
        addMeta(document, fonts, "实验编号", report.record().getCode());
        addMeta(document, fonts, "类型/状态", report.record().getExperimentType()
                + " / " + report.record().getStatus());
        addMeta(document, fonts, "负责人/日期", report.ownerName()
                + " / " + report.record().getExperimentDate());
        Paragraph content = new Paragraph(prettyJson(report.record().getContentJson()), fonts.body());
        content.setSpacingBefore(5);
        document.add(content);
        addFilesPdf(document, fonts, "记录附件", report.attachments());
        addReviewsPdf(document, fonts, report.reviews());
    }

    private void addMeta(Document document, PdfFonts fonts, String label, String value)
            throws DocumentException {
        document.add(new Paragraph(label + "：" + nullToEmpty(value), fonts.body()));
    }

    private void addFilesPdf(Document document, PdfFonts fonts,
                             String title, List<FileReport> files) throws DocumentException {
        Paragraph heading = new Paragraph(title, fonts.heading());
        heading.setSpacingBefore(9);
        document.add(heading);
        if (files.isEmpty()) {
            document.add(new Paragraph("无", fonts.body()));
            return;
        }
        PdfPTable table = new PdfPTable(new float[]{3.2f, 2.2f, 1.2f, 2.0f});
        table.setWidthPercentage(100);
        addPdfHeader(table, fonts, "文件名", "MIME", "大小", "上传者");
        for (FileReport file : files) {
            addPdfRow(table, fonts, file.name(), file.mimeType(),
                    file.size() + " B", file.uploaderName());
        }
        document.add(table);
    }

    private void addReviewsPdf(Document document, PdfFonts fonts,
                               List<ReviewReport> reviews) throws DocumentException {
        Paragraph heading = new Paragraph("审核结论", fonts.heading());
        heading.setSpacingBefore(9);
        document.add(heading);
        if (reviews.isEmpty()) {
            document.add(new Paragraph("暂无审核", fonts.body()));
            return;
        }
        PdfPTable table = new PdfPTable(new float[]{1.4f, 2.0f, 4.0f, 2.3f});
        table.setWidthPercentage(100);
        addPdfHeader(table, fonts, "决定", "审核人", "原因", "时间");
        for (ReviewReport review : reviews) {
            addPdfRow(table, fonts, review.decision(), review.reviewerName(),
                    review.reason(), review.createdAt());
        }
        document.add(table);
    }

    private void addPdfHeader(PdfPTable table, PdfFonts fonts, String... values) {
        for (String value : values) {
            PdfPCell cell = new PdfPCell(new Phrase(value, fonts.small()));
            cell.setBackgroundColor(new java.awt.Color(225, 239, 235));
            cell.setPadding(4);
            table.addCell(cell);
        }
    }

    private void addPdfRow(PdfPTable table, PdfFonts fonts, String... values) {
        for (String value : values) {
            PdfPCell cell = new PdfPCell(new Phrase(nullToEmpty(value), fonts.small()));
            cell.setPadding(4);
            table.addCell(cell);
        }
    }

    private void appendFilesMarkdown(StringBuilder markdown, String title,
                                     List<FileReport> files) {
        markdown.append("### ").append(title).append("\n\n");
        if (files.isEmpty()) {
            markdown.append("无\n\n");
            return;
        }
        markdown.append("| 文件名 | MIME | 大小 | 上传者 |\n|---|---|---:|---|\n");
        files.forEach(file -> markdown.append("| ").append(escapePipe(file.name()))
                .append(" | ").append(file.mimeType()).append(" | ").append(file.size())
                .append(" | ").append(file.uploaderName()).append(" |\n"));
        markdown.append("\n");
    }

    private void appendReviewsMarkdown(StringBuilder markdown, List<ReviewReport> reviews) {
        markdown.append("### 审核结论\n\n");
        if (reviews.isEmpty()) {
            markdown.append("暂无审核\n\n");
            return;
        }
        markdown.append("| 决定 | 审核人 | 原因 | 时间 |\n|---|---|---|---|\n");
        reviews.forEach(review -> markdown.append("| ").append(review.decision())
                .append(" | ").append(review.reviewerName()).append(" | ")
                .append(escapePipe(review.reason())).append(" | ")
                .append(review.createdAt()).append(" |\n"));
        markdown.append("\n");
    }

    private void writeProjectSheet(Workbook workbook, CellStyle header, ProjectReport report) {
        Sheet sheet = workbook.createSheet("项目概览");
        String[][] values = {
                {"字段", "内容"},
                {"项目编号", report.project().getCode()},
                {"项目名称", report.project().getName()},
                {"状态", report.project().getStatus().name()},
                {"负责人", report.projectOwnerName()},
                {"描述", report.project().getDescription()}
        };
        writeMatrix(sheet, header, values);
    }

    private void writeRecordSheet(Workbook workbook, CellStyle header,
                                  List<RecordReport> records) {
        Sheet sheet = workbook.createSheet("实验记录");
        writeHeader(sheet, header, "编号", "标题", "类型", "状态", "负责人", "日期", "内容JSON");
        int row = 1;
        for (RecordReport report : records) {
            writeRow(sheet, row++, report.record().getCode(), report.record().getTitle(),
                    report.record().getExperimentType(), report.record().getStatus().name(),
                    report.ownerName(), String.valueOf(report.record().getExperimentDate()),
                    report.record().getContentJson());
        }
        autoSize(sheet, 7);
    }

    private void writeAttachmentSheet(Workbook workbook, CellStyle header, ProjectReport report) {
        Sheet sheet = workbook.createSheet("附件元数据");
        writeHeader(sheet, header, "所属", "记录编号", "文件名", "MIME", "大小", "上传者", "上传时间");
        int row = 1;
        for (FileReport file : report.projectFiles()) {
            writeRow(sheet, row++, "项目", "", file.name(), file.mimeType(),
                    String.valueOf(file.size()), file.uploaderName(), file.createdAt());
        }
        for (RecordReport record : report.records()) {
            for (FileReport file : record.attachments()) {
                writeRow(sheet, row++, "记录", record.record().getCode(), file.name(), file.mimeType(),
                        String.valueOf(file.size()), file.uploaderName(), file.createdAt());
            }
        }
        autoSize(sheet, 7);
    }

    private void writeReviewSheet(Workbook workbook, CellStyle header,
                                  List<RecordReport> records) {
        Sheet sheet = workbook.createSheet("审核结论");
        writeHeader(sheet, header, "记录编号", "记录标题", "决定", "审核人", "原因", "时间");
        int row = 1;
        for (RecordReport record : records) {
            for (ReviewReport review : record.reviews()) {
                writeRow(sheet, row++, record.record().getCode(), record.record().getTitle(),
                        review.decision(), review.reviewerName(), review.reason(), review.createdAt());
            }
        }
        autoSize(sheet, 6);
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        org.apache.poi.ss.usermodel.Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private void writeMatrix(Sheet sheet, CellStyle header, String[][] values) {
        for (int row = 0; row < values.length; row++) {
            org.apache.poi.ss.usermodel.Row excelRow = sheet.createRow(row);
            for (int column = 0; column < values[row].length; column++) {
                var cell = excelRow.createCell(column);
                cell.setCellValue(values[row][column]);
                if (row == 0) cell.setCellStyle(header);
            }
        }
        autoSize(sheet, values[0].length);
    }

    private void writeHeader(Sheet sheet, CellStyle style, String... values) {
        org.apache.poi.ss.usermodel.Row row = sheet.createRow(0);
        for (int i = 0; i < values.length; i++) {
            var cell = row.createCell(i);
            cell.setCellValue(values[i]);
            cell.setCellStyle(style);
        }
    }

    private void writeRow(Sheet sheet, int index, String... values) {
        org.apache.poi.ss.usermodel.Row row = sheet.createRow(index);
        for (int i = 0; i < values.length; i++) {
            row.createCell(i).setCellValue(nullToEmpty(values[i]));
        }
    }

    private void autoSize(Sheet sheet, int columns) {
        for (int i = 0; i < columns; i++) {
            sheet.autoSizeColumn(i);
            sheet.setColumnWidth(i, Math.min(sheet.getColumnWidth(i) + 1200, 20000));
        }
    }

    private String prettyJson(String json) {
        try {
            return objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValueAsString(objectMapper.readTree(json));
        } catch (Exception exception) {
            return nullToEmpty(json);
        }
    }

    private Map<String, User> loadUsers(Collection<String> ids) {
        return userRepository.findAllById(ids.stream().distinct().toList()).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private FileReport toFileReport(Attachment file, Map<String, User> users) {
        return new FileReport(file.getOriginalName(), file.getMimeType(), file.getSize(),
                userName(users, file.getUploadedBy()),
                file.getCreatedAt() == null ? "" : file.getCreatedAt()
                        .atOffset(ZoneOffset.ofHours(8)).format(REPORT_TIME));
    }

    private ReviewReport toReviewReport(Review review, Map<String, User> users) {
        return new ReviewReport(review.getDecision().name(),
                userName(users, review.getReviewerId()), review.getReason(),
                review.getCreatedAt() == null ? "" : review.getCreatedAt()
                        .atOffset(ZoneOffset.ofHours(8)).format(REPORT_TIME));
    }

    private String userName(Map<String, User> users, String id) {
        return users.containsKey(id) ? users.get(id).getName() : id;
    }

    private static String nullToEmpty(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private static String escapePipe(String value) {
        return nullToEmpty(value).replace("|", "\\|");
    }

    private interface PdfContent {
        void write(Document document, PdfFonts fonts) throws DocumentException;
    }

    private record PdfFonts(Font title, Font heading, Font body, Font small) {
    }

    private record ProjectReport(Project project, String projectOwnerName,
                                 List<FileReport> projectFiles, List<RecordReport> records) {
    }

    private record RecordReport(ExperimentRecord record, String ownerName,
                                List<FileReport> attachments, List<ReviewReport> reviews) {
    }

    private record FileReport(String name, String mimeType, long size,
                              String uploaderName, String createdAt) {
    }

    private record ReviewReport(String decision, String reviewerName,
                                String reason, String createdAt) {
    }
}
