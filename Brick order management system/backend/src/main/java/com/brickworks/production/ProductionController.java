package com.brickworks.production;

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
@RequestMapping("/api/v1/production-entries")
public class ProductionController {
    private final ProductionService service;

    public ProductionController(ProductionService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductionView>>> list(
            @RequestParam(required = false) Long productId,
            @PageableDefault(size = 20, sort = "productionDate") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok("Production entries loaded.", service.list(productId, pageable)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductionView>> create(@Valid @RequestBody ProductionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Production entry recorded.", service.create(request)));
    }
}
