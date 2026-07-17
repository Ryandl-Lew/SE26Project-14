package com.bionote.project.service;

import com.bionote.project.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class ProjectCodeGenerator {

    private final ProjectRepository projectRepository;

    public ProjectCodeGenerator(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public String nextCode() {
        String prefix = "PRJ" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        int attempt = 0;
        while (attempt < 10) {
            String suffix = String.format("%04d", ThreadLocalRandom.current().nextInt(0, 10000));
            String candidate = prefix + suffix;
            if (!projectRepository.existsByCode(candidate)) {
                return candidate;
            }
            attempt++;
        }
        throw new IllegalStateException("无法生成唯一项目编号");
    }
}
