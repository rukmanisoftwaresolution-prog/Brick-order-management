package com.brickworks.product;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank @Size(max = 30) String productCode,
        @NotBlank @Size(max = 120) String productName,
        @Size(max = 80) String size,
        @PositiveOrZero BigDecimal weightKg,
        @NotNull @PositiveOrZero @DecimalMax("100.00") BigDecimal gstPercentage,
        @NotNull @PositiveOrZero BigDecimal currentRate,
        @NotNull @PositiveOrZero Long openingStock,
        @NotNull @PositiveOrZero Long minimumStock,
        boolean active
) { }
