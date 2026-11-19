package com.brickworks.notification;

import com.brickworks.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customers/{customerId}/payment-reminders")
public class PaymentReminderController {
    private final PaymentReminderService service;

    public PaymentReminderController(PaymentReminderService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> send(@PathVariable long customerId,
                                                  @Valid @RequestBody PaymentReminderRequest request) {
        service.send(customerId, request);
        return ResponseEntity.ok(ApiResponse.ok("Payment reminder sent.", null));
    }
}
