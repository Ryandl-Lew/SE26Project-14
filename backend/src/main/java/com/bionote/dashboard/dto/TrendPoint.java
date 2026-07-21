package com.bionote.dashboard.dto;

import java.time.LocalDate;

public record TrendPoint(LocalDate date, long count) {
}
