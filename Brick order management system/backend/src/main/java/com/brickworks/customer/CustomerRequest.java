package com.brickworks.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CustomerRequest(
        @NotBlank @Size(max = 30) String customerCode,
        @NotBlank @Size(max = 160) String customerName,
        @NotNull CustomerType customerType,
        @Size(max = 15) String gstNumber,
        @Size(max = 10) String panNumber,
        @Size(max = 250) String address,
        @Size(max = 100) String city,
        @Size(max = 100) String state,
        @Size(max = 10) String pincode,
        @Size(max = 120) String contactPerson,
        @Size(max = 20) String mobileNumber,
        @Email @Size(max = 254) String email,
        @NotNull @PositiveOrZero BigDecimal creditLimit,
        boolean active
) {
}
