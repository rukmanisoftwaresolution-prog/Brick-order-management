package com.brickworks.product;

import com.brickworks.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {
    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductView>>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20, sort = "productName") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok("Products loaded.", service.search(q, active, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductView>> get(@PathVariable long id) {
        return ResponseEntity.ok(ApiResponse.ok("Product loaded.", service.get(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductView>> create(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Product created.", service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductView>> update(@PathVariable long id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Product updated.", service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Product deactivated.", null));
    }
}
