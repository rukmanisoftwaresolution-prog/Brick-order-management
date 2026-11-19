package com.brickworks.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record PaymentView(Long id, Long customerId, String customerCode, String customerName, String orderNumber,
                          LocalDate paymentDate, Instant createdAt, BigDecimal amount, PaymentType paymentType,
                          String referenceNumber, String remarks, String invoiceNumber,
                          PaymentStatus paymentStatus) { }
