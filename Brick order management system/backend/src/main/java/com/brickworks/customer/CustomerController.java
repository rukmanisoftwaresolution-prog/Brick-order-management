package com.brickworks.customer;

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
@RequestMapping("/api/v1/customers")
public class CustomerController {
    private final CustomerService service;

    public CustomerController(CustomerService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CustomerView>>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20, sort = "customerName") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok("Customers loaded.", service.search(q, active, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerView>> get(@PathVariable long id) {
        return ResponseEntity.ok(ApiResponse.ok("Customer loaded.", service.get(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CustomerView>> create(@Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Customer created.", service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomerView>> update(@PathVariable long id, @Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Customer updated.", service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Customer deleted.", null));
    }
}
