package com.brickworks.report;

import com.brickworks.common.ConflictException;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class OperationsReportService {
    private final OperationsReportRepository reports;

    public OperationsReportService(OperationsReportRepository reports) {
        this.reports = reports;
    }

    public OperationsReportView summarize(LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new ConflictException("Report start date must be on or before its end date.");
        }
        Object[] orders = reports.orderSummary(from, to);
        Object[] payments = reports.paymentSummary(from, to);
        Object[] production = reports.productionSummary(from, to);
        Object[] inventory = reports.inventorySummary();
        return new OperationsReportView(from, to,
                number(orders[0]), decimal(orders[1]),
                number(payments[0]), decimal(payments[1]),
                reports.deliveryCount(from, to),
                number(production[0]), number(production[1]), number(production[2]),
                number(inventory[0]), number(inventory[1]), number(inventory[2]),
                number(inventory[3]), number(inventory[4]));
    }

    private long number(Object value) {
        return ((Number) value).longValue();
    }

    private BigDecimal decimal(Object value) {
        return value instanceof BigDecimal amount ? amount : BigDecimal.valueOf(((Number) value).longValue());
    }
}
