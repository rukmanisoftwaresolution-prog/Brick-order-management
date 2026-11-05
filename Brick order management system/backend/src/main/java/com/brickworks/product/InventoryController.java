package com.brickworks.product;

import com.brickworks.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {
    private final InventoryService service;

    public InventoryController(InventoryService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<InventoryView>>> list(@PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok("Inventory loaded.", service.list(pageable)));
    }

    @PostMapping("/adjustments")
    public ResponseEntity<ApiResponse<InventoryView>> adjust(@Valid @RequestBody InventoryAdjustmentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Inventory adjusted.", service.adjust(request)));
    }
}
