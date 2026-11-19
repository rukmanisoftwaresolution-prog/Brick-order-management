package com.brickworks.notification;

import java.math.BigDecimal;

public record PaymentReminderMessage(
        PaymentReminderChannel channel,
        String customerName,
        String invoiceNumber,
        String destination,
        BigDecimal invoiceAmount,
        BigDecimal paidAmount,
        BigDecimal outstandingAmount,
        String message
) {
}
