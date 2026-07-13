package com.bionote.health;

import com.bionote.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health")
public class HealthController {
    @GetMapping
    @Operation(summary = "应用存活检查")
    public ApiResponse<HealthResponse> health() {
        return ApiResponse.success(new HealthResponse("UP", "0.1.0", Instant.now()));
    }

    public record HealthResponse(String status, String version, Instant timestamp) {
    }
}
