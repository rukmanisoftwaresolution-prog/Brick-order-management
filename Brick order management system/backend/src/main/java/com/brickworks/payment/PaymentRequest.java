package com.brickworks.payment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record PaymentRequest(@NotNull Long customerId, Long orderId,
                             @NotNull @Positive BigDecimal amount,
                             @NotNull PaymentType paymentType,
                             @Size(max = 80) String referenceNumber,
                             @Size(max = 500) String remarks) { }
