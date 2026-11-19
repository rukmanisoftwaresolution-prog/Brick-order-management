package com.brickworks.report;

import java.math.BigDecimal;
import java.time.LocalDate;

public record OperationsReportView(
        LocalDate fromDate,
        LocalDate toDate,
        long orderCount,
        BigDecimal orderValue,
        long paymentCount,
        BigDecimal paymentTotal,
        long deliveryCount,
        long productionEntryCount,
        long producedQuantity,
        long rejectedQuantity,
        long productCount,
        long availableStock,
        long reservedStock,
        long damagedStock,
        long deliveredStock
) {
}
