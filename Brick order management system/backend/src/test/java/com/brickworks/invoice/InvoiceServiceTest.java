package com.brickworks.invoice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.brickworks.customer.Customer;
import com.brickworks.customer.CustomerRepository;
import com.brickworks.order.SalesOrder;
import com.brickworks.order.SalesOrderRepository;
import com.brickworks.order.SalesOrderService;
import com.brickworks.order.OrderStatus;
import com.brickworks.payment.PaymentRepository;
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

    @Mock
    private SalesOrderRepository orders;

    @Mock
    private CustomerRepository customers;

    @Mock
    private PaymentRepository payments;

    @Mock
    private SalesOrderService orderService;

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
        when(invoices.search("INV", null, false, PageRequest.of(0, 20))).thenReturn(new PageImpl<>(List.of(invoice)));
        when(payments.totalSuccessfulForInvoice(7L)).thenReturn(new BigDecimal("18.00"));

        InvoiceView result = service.search(" INV ", null, false, PageRequest.of(0, 20)).getContent().get(0);

        assertEquals(7L, result.id());
        assertEquals("INV-007", result.invoiceNumber());
        assertEquals("BO-007", result.orderNumber());
        assertEquals("Brick House", result.customerName());
        assertEquals(new BigDecimal("118.00"), result.invoiceAmount());
        assertEquals(new BigDecimal("18.00"), result.paidAmount());
        assertEquals(new BigDecimal("100.00"), result.outstandingAmount());
        assertEquals(InvoiceSettlementStatus.PARTIALLY_PAID, result.paymentStatus());
    }

    @Test
    void generateCreatesInvoiceForConfirmedOrderAndUpdatesCustomerBalance() {
        Customer customer = mock(Customer.class);
        when(customer.getId()).thenReturn(1L);
        when(customer.getCustomerName()).thenReturn("Brick House");
        when(customer.getLegacyOutstandingAmount()).thenReturn(BigDecimal.ZERO);
        SalesOrder order = mock(SalesOrder.class);
        when(order.getId()).thenReturn(11L);
        when(order.getStatus()).thenReturn(OrderStatus.CONFIRMED);
        when(order.getCustomer()).thenReturn(customer);
        when(order.getSubtotal()).thenReturn(new BigDecimal("5000.00"));
        when(order.getDiscountTotal()).thenReturn(BigDecimal.ZERO);
        when(order.getTaxTotal()).thenReturn(BigDecimal.ZERO);
        when(order.getTotalAmount()).thenReturn(new BigDecimal("5000.00"));
        when(orders.findByIdForUpdate(11L)).thenReturn(java.util.Optional.of(order));
        when(customers.findByIdForUpdate(1L)).thenReturn(java.util.Optional.of(customer));
        when(invoices.existsByOrderId(11L)).thenReturn(false);
        when(invoices.saveAndFlush(org.mockito.ArgumentMatchers.any(Invoice.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(payments.totalSuccessfulForInvoice(null)).thenReturn(BigDecimal.ZERO);
        when(customers.totalOpenInvoiceBalance(1L)).thenReturn(new BigDecimal("5000.00"));

        InvoiceView result = service.generate(new InvoiceRequest(11L));

        assertEquals(new BigDecimal("5000.00"), result.invoiceAmount());
        assertEquals(InvoiceSettlementStatus.UNPAID, result.paymentStatus());
        verify(customer).setOutstandingAmount(new BigDecimal("5000.00"));
    }

    @Test
    void generateRejectsDuplicateInvoice() {
        SalesOrder order = mock(SalesOrder.class);
        when(order.getId()).thenReturn(11L);
        when(order.getStatus()).thenReturn(OrderStatus.CONFIRMED);
        when(orders.findByIdForUpdate(11L)).thenReturn(java.util.Optional.of(order));
        when(invoices.existsByOrderId(11L)).thenReturn(true);

        org.junit.jupiter.api.Assertions.assertThrows(com.brickworks.common.ConflictException.class,
                () -> service.generate(new InvoiceRequest(11L)));
    }
}
