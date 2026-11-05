package com.brickworks.payment;

import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentView(Long id, String customerCode, String customerName, String orderNumber,
                          LocalDate paymentDate, BigDecimal amount, PaymentType paymentType,
                          String referenceNumber, String remarks) { }
