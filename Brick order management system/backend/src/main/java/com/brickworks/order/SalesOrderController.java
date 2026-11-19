package com.brickworks.order;

import com.brickworks.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
public class SalesOrderController {
    private final SalesOrderService service;

    public SalesOrderController(SalesOrderService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<OrderView>>> search(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 20, sort = "orderDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok("Orders loaded.", service.search(q, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderView>> get(@PathVariable long id) {
        return ResponseEntity.ok(ApiResponse.ok("Order loaded.", service.get(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderView>> create(@Valid @RequestBody OrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Draft order created.", service.create(request)));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<OrderView>> confirm(@PathVariable long id) {
        return ResponseEntity.ok(ApiResponse.ok("Order confirmed.", service.confirm(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDraft(@PathVariable long id) {
        service.deleteDraft(id);
        return ResponseEntity.ok(ApiResponse.ok("Draft order deleted.", null));
    }
}
