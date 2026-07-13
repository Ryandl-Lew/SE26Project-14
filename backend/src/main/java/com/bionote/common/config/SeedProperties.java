package com.bionote.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("bionote.seed")
public record SeedProperties(boolean enabled) {
}
