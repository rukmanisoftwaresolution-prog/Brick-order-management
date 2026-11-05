package com.brickworks.customer;

import java.math.BigDecimal;
import java.time.Instant;

public record CustomerView(
        Long id,
        String customerCode,
        String customerName,
        CustomerType customerType,
        String gstNumber,
        String panNumber,
        String address,
        String city,
        String state,
        String pincode,
        String contactPerson,
        String mobileNumber,
        String email,
        BigDecimal creditLimit,
        BigDecimal outstandingAmount,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
