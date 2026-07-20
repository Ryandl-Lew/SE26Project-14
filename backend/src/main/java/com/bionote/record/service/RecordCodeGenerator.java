package com.bionote.record.service;

import com.bionote.record.repository.ExperimentRecordRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class RecordCodeGenerator {

    private final ExperimentRecordRepository recordRepository;

    public RecordCodeGenerator(ExperimentRecordRepository recordRepository) {
        this.recordRepository = recordRepository;
    }

    public String nextCode() {
        String prefix = "EXP" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        int attempt = 0;
        while (attempt < 10) {
            String suffix = String.format("%05d", ThreadLocalRandom.current().nextInt(0, 100000));
            String candidate = prefix + suffix;
            if (!recordRepository.existsByCode(candidate)) {
                return candidate;
            }
            attempt++;
        }
        throw new IllegalStateException("无法生成唯一实验记录编号");
    }
}
