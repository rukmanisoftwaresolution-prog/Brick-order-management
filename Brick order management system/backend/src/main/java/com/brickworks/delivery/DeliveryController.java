package com.brickworks.delivery;

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
@RequestMapping("/api/v1/deliveries")
public class DeliveryController {
    private final DeliveryService service;

    public DeliveryController(DeliveryService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<DeliveryView>>> search(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok("Deliveries loaded.", service.search(q, pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DeliveryView>> create(@Valid @RequestBody DeliveryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Delivery created.", service.create(request)));
    }
}
