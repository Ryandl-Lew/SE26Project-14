package com.bionote.common.config;

import com.bionote.collaboration.entity.RecordVersion;
import com.bionote.collaboration.repository.RecordVersionRepository;
import com.bionote.project.MemberRepository;
import com.bionote.project.ProjectRepository;
import com.bionote.project.entity.MemberStatus;
import com.bionote.project.entity.Project;
import com.bionote.project.entity.ProjectMember;
import com.bionote.project.entity.ProjectRole;
import com.bionote.project.entity.ProjectStatus;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.repository.ExperimentRecordRepository;
import com.bionote.record.service.RecordCodeGenerator;
import com.bionote.template.entity.ExperimentTemplate;
import com.bionote.template.entity.TemplateField;
import com.bionote.template.repository.ExperimentTemplateRepository;
import com.bionote.template.repository.TemplateFieldRepository;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Component
public class DemoDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final SeedProperties properties;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final MemberRepository memberRepository;
    private final ExperimentTemplateRepository templateRepository;
    private final TemplateFieldRepository templateFieldRepository;
    private final ExperimentRecordRepository recordRepository;
    private final RecordVersionRepository versionRepository;
    private final RecordCodeGenerator recordCodeGenerator;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public DemoDataInitializer(
            SeedProperties properties,
            UserRepository userRepository,
            ProjectRepository projectRepository,
            MemberRepository memberRepository,
            ExperimentTemplateRepository templateRepository,
            TemplateFieldRepository templateFieldRepository,
            ExperimentRecordRepository recordRepository,
            RecordVersionRepository versionRepository,
            RecordCodeGenerator recordCodeGenerator,
            PasswordEncoder passwordEncoder,
            ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.templateRepository = templateRepository;
        this.templateFieldRepository = templateFieldRepository;
        this.recordRepository = recordRepository;
        this.versionRepository = versionRepository;
        this.recordCodeGenerator = recordCodeGenerator;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) {
            return;
        }

        // 1. 创建用户
        User li = createUser("li", "李同学", "li@example.com", "李");
        User wang = createUser("wang", "王同学", "wang@example.com", "王");
        User zhang = createUser("zhang", "张老师", "pi@example.com", "张");

        // 2. 创建内置模板
        createPcrTemplate();
        createElectrophoresisTemplate();
        createFermentationTemplate();

        // 3. 创建演示项目
        if (!projectRepository.existsByCode("PRJ2026070001")) {
            Project project = new Project("PRJ2026070001", "PCR 扩增与克隆实验",
                    "本项目用于 PCR 扩增 GFP 片段及后续克隆实验",
                    ProjectStatus.IN_PROGRESS, li.getId());
            project = projectRepository.saveAndFlush(project);

            memberRepository.save(new ProjectMember(
                    project.getId(), li.getId(), ProjectRole.OWNER, MemberStatus.ACTIVE));
            memberRepository.save(new ProjectMember(
                    project.getId(), wang.getId(), ProjectRole.MEMBER, MemberStatus.ACTIVE));
            memberRepository.save(new ProjectMember(
                    project.getId(), zhang.getId(), ProjectRole.REVIEWER, MemberStatus.ACTIVE));

            // 创建演示记录
            createDemoRecord(project, li, "PCR 扩增 GFP 片段",
                    "PCR", LocalDate.of(2026, 7, 10), "A203",
                    buildContent("扩增 GFP 目标片段", "模板 DNA、引物、dNTP、Phusion 聚合酶",
                            "1. 配制 PCR 反应体系\n2. 设置扩增程序\n3. 琼脂糖凝胶电泳验证",
                            "退火温度: 58°C, 延伸时间: 30s, 循环数: 30",
                            "电泳显示约 750bp 清晰条带", "扩增成功，条带大小符合预期"));

            createDemoRecord(project, wang, "质粒酶切验证",
                    "酶切", LocalDate.of(2026, 7, 12), "B307",
                    buildContent("验证重组质粒的正确性", "质粒 DNA、EcoRI、HindIII、Buffer",
                            "1. 配制酶切体系\n2. 37°C 孵育 1h\n3. 电泳检测",
                            "酶切温度: 37°C, 时间: 60min",
                            "酶切后可见载体和插入片段两条带", "酶切结果正确，质粒构建成功"));

            log.info("演示数据已初始化");
        }

        createAdditionalDemoProjects(li, wang, zhang);
    }

    private void createAdditionalDemoProjects(User li, User wang, User zhang) {
        if (!projectRepository.existsByCode("PRJ2026070002")) {
            Project project = new Project("PRJ2026070002", "发酵条件优化项目",
                    "比较温度、pH 与溶氧对发酵产量的影响",
                    ProjectStatus.IN_PROGRESS, wang.getId());
            project = projectRepository.saveAndFlush(project);
            memberRepository.save(new ProjectMember(
                    project.getId(), wang.getId(), ProjectRole.OWNER, MemberStatus.ACTIVE));
            memberRepository.save(new ProjectMember(
                    project.getId(), li.getId(), ProjectRole.MEMBER, MemberStatus.ACTIVE));
            memberRepository.save(new ProjectMember(
                    project.getId(), zhang.getId(), ProjectRole.REVIEWER, MemberStatus.ACTIVE));
            createDemoRecord(project, wang, "摇瓶发酵预实验", "发酵工程",
                    LocalDate.of(2026, 7, 13), "发酵实验室",
                    buildContent("确定基础培养条件", "工程菌、培养基",
                            "接种后分组培养", "30°C, 200 rpm", "生长正常", "可进入优化实验"));
            createDemoRecord(project, li, "温度梯度发酵", "发酵工程",
                    LocalDate.of(2026, 7, 14), "发酵实验室",
                    buildContent("比较温度影响", "工程菌、培养基",
                            "设置 25/30/37°C", "pH 7.0", "30°C 组产量最高", "选择 30°C"));
            createDemoRecord(project, wang, "pH 梯度发酵", "发酵工程",
                    LocalDate.of(2026, 7, 15), "发酵实验室",
                    buildContent("比较 pH 影响", "工程菌、缓冲培养基",
                            "设置 pH 6.0/7.0/8.0", "30°C", "pH 7.0 最优", "确定 pH 7.0"));
            createDemoRecord(project, li, "溶氧条件验证", "发酵工程",
                    LocalDate.of(2026, 7, 16), "发酵实验室",
                    buildContent("验证溶氧条件", "工程菌、培养基",
                            "比较不同装液量", "30°C, pH 7.0", "低装液量产量较高", "提高通气"));
        }

        if (!projectRepository.existsByCode("PRJ2026070003")) {
            Project project = new Project("PRJ2026070003", "凝胶电泳教学验证",
                    "用于验证不同凝胶浓度对 DNA 片段分辨率的影响",
                    ProjectStatus.IN_PROGRESS, li.getId());
            project = projectRepository.saveAndFlush(project);
            memberRepository.save(new ProjectMember(
                    project.getId(), li.getId(), ProjectRole.OWNER, MemberStatus.ACTIVE));
            memberRepository.save(new ProjectMember(
                    project.getId(), wang.getId(), ProjectRole.OBSERVER, MemberStatus.ACTIVE));
            memberRepository.save(new ProjectMember(
                    project.getId(), zhang.getId(), ProjectRole.REVIEWER, MemberStatus.ACTIVE));
            createDemoRecord(project, li, "1% 琼脂糖凝胶电泳", "电泳",
                    LocalDate.of(2026, 7, 14), "A203",
                    buildContent("观察大分子 DNA", "琼脂糖、TAE、Marker",
                            "制胶、上样、电泳", "120V, 25min", "大分子条带清晰", "适合较大片段"));
            createDemoRecord(project, li, "1.5% 琼脂糖凝胶电泳", "电泳",
                    LocalDate.of(2026, 7, 15), "A203",
                    buildContent("比较分辨率", "琼脂糖、TAE、Marker",
                            "制胶、上样、电泳", "110V, 30min", "中等片段分离较好", "推荐常规使用"));
            createDemoRecord(project, li, "2% 琼脂糖凝胶电泳", "电泳",
                    LocalDate.of(2026, 7, 16), "A203",
                    buildContent("观察小片段 DNA", "琼脂糖、TAE、Marker",
                            "制胶、上样、电泳", "100V, 35min", "小片段分离清晰", "适合小片段"));
            createDemoRecord(project, li, "凝胶浓度对比分析", "数据分析",
                    LocalDate.of(2026, 7, 17), "A203",
                    buildContent("汇总电泳结果", "三组凝胶图像",
                            "比较条带分辨率", "统一曝光参数", "不同浓度各有优势", "按片段大小选浓度"));
        }
    }

    private void createDemoRecord(Project project, User owner, String title, String type,
                                   LocalDate date, String location, String contentJson) {
        ExperimentRecord record = new ExperimentRecord(
                recordCodeGenerator.nextCode(),
                project.getId(),
                null,
                title,
                type,
                owner.getId(),
                date,
                location,
                contentJson
        );
        record = recordRepository.saveAndFlush(record);

        // 初始版本快照
        try {
            String snapshot = objectMapper.writeValueAsString(Map.of(
                    "title", title, "type", type, "content", contentJson));
            versionRepository.save(new RecordVersion(
                    record.getId(), record.getVersion(), snapshot, owner.getId(), "创建实验记录"));
        } catch (JsonProcessingException e) {
            log.warn("版本快照序列化失败");
        }
    }

    private void createPcrTemplate() {
        if (templateRepository.existsByName("PCR 扩增")) {
            return;
        }
        ExperimentTemplate template = new ExperimentTemplate(
                "PCR 扩增", "分子生物学", "标准 PCR 扩增实验模板", true);
        template = templateRepository.saveAndFlush(template);

        templateFieldRepository.saveAll(List.of(
                new TemplateField(template.getId(), "purpose", "实验目的", "textarea", true, 1),
                new TemplateField(template.getId(), "materials", "实验材料", "table", true, 2),
                new TemplateField(template.getId(), "steps", "实验步骤", "textarea", true, 3),
                new TemplateField(template.getId(), "parameters", "反应参数", "table", false, 4),
                new TemplateField(template.getId(), "results", "实验结果", "textarea", true, 5),
                new TemplateField(template.getId(), "conclusion", "实验结论", "textarea", true, 6)
        ));
    }

    private void createElectrophoresisTemplate() {
        if (templateRepository.existsByName("琼脂糖凝胶电泳")) {
            return;
        }
        ExperimentTemplate template = new ExperimentTemplate(
                "琼脂糖凝胶电泳", "分子生物学", "琼脂糖凝胶电泳检测 DNA 片段", true);
        template = templateRepository.saveAndFlush(template);

        templateFieldRepository.saveAll(List.of(
                new TemplateField(template.getId(), "purpose", "实验目的", "textarea", true, 1),
                new TemplateField(template.getId(), "gelConcentration", "凝胶浓度", "text", true, 2),
                new TemplateField(template.getId(), "samples", "样品列表", "table", true, 3),
                new TemplateField(template.getId(), "voltage", "电泳参数", "table", false, 4),
                new TemplateField(template.getId(), "results", "电泳结果", "textarea", true, 5),
                new TemplateField(template.getId(), "conclusion", "实验结论", "textarea", true, 6)
        ));
    }

    private void createFermentationTemplate() {
        if (templateRepository.existsByName("发酵工程")) {
            return;
        }
        ExperimentTemplate template = new ExperimentTemplate(
                "发酵工程", "发酵工程", "标准发酵工艺实验模板", true);
        template = templateRepository.saveAndFlush(template);

        templateFieldRepository.saveAll(List.of(
                new TemplateField(template.getId(), "purpose", "实验目的", "textarea", true, 1),
                new TemplateField(template.getId(), "strain", "菌株信息", "text", true, 2),
                new TemplateField(template.getId(), "medium", "培养基配方", "table", true, 3),
                new TemplateField(template.getId(), "parameters", "发酵参数", "table", true, 4),
                new TemplateField(template.getId(), "results", "发酵结果", "textarea", true, 5),
                new TemplateField(template.getId(), "conclusion", "实验结论", "textarea", true, 6)
        ));
    }

    private String buildContent(String purpose, String materials, String steps,
                                 String parameters, String results, String conclusion) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "purpose", purpose,
                    "materials", List.of(materials),
                    "steps", steps,
                    "parameters", List.of(parameters),
                    "results", results,
                    "conclusion", conclusion
            ));
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }

    private User createUser(String username, String name, String email, String avatarText) {
        return userRepository.findByUsername(username)
                .orElseGet(() -> userRepository.save(new User(
                        username,
                        passwordEncoder.encode("123456"),
                        name,
                        email,
                        avatarText
                )));
    }
}
