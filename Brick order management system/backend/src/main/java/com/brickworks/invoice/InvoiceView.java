package com.brickworks.invoice;

import java.math.BigDecimal;
import java.time.LocalDate;

public record InvoiceView(
        Long id,
        String invoiceNumber,
        String orderNumber,
        String customerName,
        LocalDate invoiceDate,
        BigDecimal taxableAmount,
        BigDecimal cgst,
        BigDecimal sgst,
        BigDecimal igst,
        BigDecimal invoiceAmount
) {
}
