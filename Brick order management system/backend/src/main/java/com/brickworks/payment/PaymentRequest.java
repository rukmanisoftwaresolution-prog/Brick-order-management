package com.brickworks.payment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.PastOrPresent;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequest(@NotNull Long customerId, Long orderId, Long invoiceId,
                             @NotNull @Positive @Digits(integer = 12, fraction = 2) BigDecimal amount,
                             @NotNull PaymentType paymentType,
                             @PastOrPresent LocalDate paymentDate,
                             @Size(max = 80) String referenceNumber,
                             @Size(max = 80) String idempotencyKey,
                             @Size(max = 500) String remarks) { }
