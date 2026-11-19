package com.brickworks.invoice;

import com.brickworks.common.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {
    private final InvoiceService service;

    public InvoiceController(InvoiceService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<InvoiceView>>> search(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "invoiceDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok("Invoices loaded.", service.search(q, pageable)));
    }
}
