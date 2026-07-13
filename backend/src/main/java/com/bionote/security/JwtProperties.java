package com.bionote.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("bionote.jwt")
public record JwtProperties(String secret, long expirationSeconds) {
    public JwtProperties {
        if (secret == null || secret.length() < 32) {
            throw new IllegalArgumentException("bionote.jwt.secret must contain at least 32 characters");
        }
        if (expirationSeconds <= 0) {
            throw new IllegalArgumentException("bionote.jwt.expiration-seconds must be positive");
        }
    }
}
