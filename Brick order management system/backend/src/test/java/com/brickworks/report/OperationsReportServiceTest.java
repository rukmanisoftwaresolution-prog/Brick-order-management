package com.brickworks.report;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.brickworks.common.ConflictException;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OperationsReportServiceTest {
    @Mock
    private OperationsReportRepository reports;

    @InjectMocks
    private OperationsReportService service;

    @Test
    void summarizesDatedOperationsAndCurrentInventory() {
        LocalDate from = LocalDate.of(2026, 11, 1);
        LocalDate to = LocalDate.of(2026, 11, 30);
        when(reports.orderSummary(from, to)).thenReturn(new Object[]{3L, new BigDecimal("1500.25")});
        when(reports.paymentSummary(from, to)).thenReturn(new Object[]{2L, new BigDecimal("500.25")});
        when(reports.deliveryCount(from, to)).thenReturn(4L);
        when(reports.productionSummary(from, to)).thenReturn(new Object[]{5L, 800L, 20L});
        when(reports.inventorySummary()).thenReturn(new Object[]{6L, 400L, 30L, 8L, 200L});

        OperationsReportView result = service.summarize(from, to);

        assertEquals(from, result.fromDate());
        assertEquals(to, result.toDate());
        assertEquals(3L, result.orderCount());
        assertEquals(new BigDecimal("1500.25"), result.orderValue());
        assertEquals(2L, result.paymentCount());
        assertEquals(new BigDecimal("500.25"), result.paymentTotal());
        assertEquals(4L, result.deliveryCount());
        assertEquals(5L, result.productionEntryCount());
        assertEquals(800L, result.producedQuantity());
        assertEquals(20L, result.rejectedQuantity());
        assertEquals(6L, result.productCount());
        assertEquals(400L, result.availableStock());
        assertEquals(30L, result.reservedStock());
        assertEquals(8L, result.damagedStock());
        assertEquals(200L, result.deliveredStock());
    }

    @Test
    void rejectsDateRangeWithStartAfterEnd() {
        assertThrows(ConflictException.class, () -> service.summarize(
                LocalDate.of(2026, 11, 30), LocalDate.of(2026, 11, 1)));
        verifyNoInteractions(reports);
    }
}
