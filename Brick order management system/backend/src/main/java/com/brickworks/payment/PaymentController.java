package com.brickworks.payment;

import com.brickworks.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final PaymentService service;

    public PaymentController(PaymentService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PaymentView>>> search(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "paymentDate", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok("Payments loaded.", service.search(q, pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PaymentView>> collect(@Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Payment recorded.", service.collect(request)));
    }
}
