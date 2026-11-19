package com.brickworks.report;

import com.brickworks.common.ApiResponse;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
public class OperationsReportController {
    private final OperationsReportService service;

    public OperationsReportController(OperationsReportService service) {
        this.service = service;
    }

    @GetMapping("/operations")
    public ResponseEntity<ApiResponse<OperationsReportView>> operations(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok("Operations report loaded.", service.summarize(from, to)));
    }
}
