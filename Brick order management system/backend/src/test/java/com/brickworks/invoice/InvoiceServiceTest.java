package com.brickworks.invoice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.brickworks.customer.Customer;
import com.brickworks.order.SalesOrder;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {
    @Mock
    private InvoiceRepository invoices;

    @InjectMocks
    private InvoiceService service;

    @Test
    void searchMapsInvoiceAndRelatedOrderAndCustomer() {
        Invoice invoice = mock(Invoice.class);
        SalesOrder order = mock(SalesOrder.class);
        Customer customer = mock(Customer.class);
        when(invoice.getId()).thenReturn(7L);
        when(invoice.getInvoiceNumber()).thenReturn("INV-007");
        when(invoice.getOrder()).thenReturn(order);
        when(order.getOrderNumber()).thenReturn("BO-007");
        when(invoice.getCustomer()).thenReturn(customer);
        when(customer.getCustomerName()).thenReturn("Brick House");
        when(invoice.getInvoiceDate()).thenReturn(LocalDate.of(2026, 11, 6));
        when(invoice.getTaxableAmount()).thenReturn(new BigDecimal("100.00"));
        when(invoice.getCgst()).thenReturn(new BigDecimal("9.00"));
        when(invoice.getSgst()).thenReturn(new BigDecimal("9.00"));
        when(invoice.getIgst()).thenReturn(BigDecimal.ZERO);
        when(invoice.getInvoiceAmount()).thenReturn(new BigDecimal("118.00"));
        when(invoices.search("INV", PageRequest.of(0, 20))).thenReturn(new PageImpl<>(List.of(invoice)));

        InvoiceView result = service.search(" INV ", PageRequest.of(0, 20)).getContent().get(0);

        assertEquals(7L, result.id());
        assertEquals("INV-007", result.invoiceNumber());
        assertEquals("BO-007", result.orderNumber());
        assertEquals("Brick House", result.customerName());
        assertEquals(new BigDecimal("118.00"), result.invoiceAmount());
    }
}
