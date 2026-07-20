package com.bionote.common.config;

import com.bionote.template.entity.ExperimentTemplate;
import com.bionote.template.entity.TemplateField;
import com.bionote.template.repository.ExperimentTemplateRepository;
import com.bionote.template.repository.TemplateFieldRepository;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Component
public class DemoDataInitializer implements ApplicationRunner {
    private final SeedProperties properties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ExperimentTemplateRepository experimentTemplateRepository;
    private final TemplateFieldRepository templateFieldRepository;

    public DemoDataInitializer(
            SeedProperties properties,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            ExperimentTemplateRepository experimentTemplateRepository,
            TemplateFieldRepository templateFieldRepository
    ) {
        this.properties = properties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.experimentTemplateRepository = experimentTemplateRepository;
        this.templateFieldRepository = templateFieldRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) {
            return;
        }
        createUser("li", "李同学", "li@example.com", "李");
        createUser("wang", "王同学", "wang@example.com", "王");
        createUser("zhang", "张老师", "pi@example.com", "张");
        seedTemplates();
    }

    private void createUser(
            String username,
            String name,
            String email,
            String avatarText
    ) {
        if (!userRepository.existsByUsernameNormalized(username.toLowerCase(Locale.ROOT))) {
            userRepository.save(new User(
                    username,
                    passwordEncoder.encode("123456"),
                    name,
                    email,
                    avatarText
            ));
        }
    }

    private void seedTemplates() {
        if (experimentTemplateRepository.count() > 0) {
            return;
        }

        ExperimentTemplate pcr = experimentTemplateRepository.save(new ExperimentTemplate(
                "PCR 扩增", "PCR",
                "聚合酶链式反应（PCR）用于扩增特定 DNA 片段，是分子生物学中最基础的实验之一。",
                true, null));

        templateFieldRepository.saveAll(List.of(
                field(pcr, "purpose", "实验目的", "textarea", true, 1),
                field(pcr, "templateDna", "模板 DNA", "text", true, 2),
                field(pcr, "primerInfo", "引物信息", "text", true, 3),
                field(pcr, "reactionSystem", "反应体系", "table", true, 4),
                field(pcr, "thermalCycling", "热循环参数", "table", true, 5),
                field(pcr, "electrophoresis", "电泳结果", "textarea", false, 6),
                field(pcr, "conclusion", "实验结论", "textarea", false, 7)
        ));

        ExperimentTemplate gelElectrophoresis = experimentTemplateRepository.save(new ExperimentTemplate(
                "琼脂糖凝胶电泳", "电泳",
                "琼脂糖凝胶电泳用于分离和检测 DNA 片段，是分子生物学中最常用的实验技术之一。",
                true, null));

        templateFieldRepository.saveAll(List.of(
                field(gelElectrophoresis, "purpose", "实验目的", "textarea", true, 1),
                field(gelElectrophoresis, "sampleInfo", "样品信息", "text", true, 2),
                field(gelElectrophoresis, "gelConcentration", "凝胶浓度", "text", true, 3),
                field(gelElectrophoresis, "voltageTime", "电压与时间", "text", true, 4),
                field(gelElectrophoresis, "results", "电泳结果", "textarea", true, 5),
                field(gelElectrophoresis, "conclusion", "实验结论", "textarea", false, 6)
        ));

        ExperimentTemplate fermentation = experimentTemplateRepository.save(new ExperimentTemplate(
                "发酵工程", "发酵工程",
                "发酵工程实验用于微生物培养、发酵条件优化及产物分析。",
                true, null));

        templateFieldRepository.saveAll(List.of(
                field(fermentation, "purpose", "实验目的", "textarea", true, 1),
                field(fermentation, "strainInfo", "菌株信息", "text", true, 2),
                field(fermentation, "medium", "培养基配方", "table", true, 3),
                field(fermentation, "cultureConditions", "培养条件", "text", true, 4),
                field(fermentation, "monitoringData", "监测数据", "table", true, 5),
                field(fermentation, "results", "实验结果", "textarea", true, 6),
                field(fermentation, "conclusion", "实验结论", "textarea", false, 7)
        ));
    }

    private TemplateField field(ExperimentTemplate template, String key, String label,
                                String type, boolean required, int sortOrder) {
        return new TemplateField(template.getId(), key, label, type, required, null, sortOrder);
    }
}
