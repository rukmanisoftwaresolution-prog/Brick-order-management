package com.brickworks.payment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.brickworks.common.ConflictException;
import com.brickworks.customer.Customer;
import com.brickworks.customer.CustomerRepository;
import com.brickworks.invoice.Invoice;
import com.brickworks.invoice.InvoiceRepository;
import com.brickworks.order.SalesOrder;
import com.brickworks.order.SalesOrderRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {
    @Mock
    private PaymentRepository payments;

    @Mock
    private CustomerRepository customers;

    @Mock
    private SalesOrderRepository orders;

    @Mock
    private InvoiceRepository invoices;

    @InjectMocks
    private PaymentService service;

    private Customer customer;
    private Invoice invoice;
    private SalesOrder order;

    @BeforeEach
    void setUp() {
        customer = mock(Customer.class);
        lenient().when(customer.getId()).thenReturn(1L);
        lenient().when(customer.getCustomerCode()).thenReturn("C-101");
        lenient().when(customer.getCustomerName()).thenReturn("Brick House");
        lenient().when(customer.isActive()).thenReturn(true);
        lenient().when(customer.getLegacyOutstandingAmount()).thenReturn(BigDecimal.ZERO);

        order = mock(SalesOrder.class);
        lenient().when(order.getId()).thenReturn(11L);
        lenient().when(order.getOrderNumber()).thenReturn("BO-011");
        lenient().when(order.getCustomer()).thenReturn(customer);
        lenient().when(order.getTotalAmount()).thenReturn(new BigDecimal("5000.00"));

        invoice = mock(Invoice.class);
        lenient().when(invoice.getId()).thenReturn(21L);
        lenient().when(invoice.getInvoiceNumber()).thenReturn("INV-021");
        lenient().when(invoice.getCustomer()).thenReturn(customer);
        lenient().when(invoice.getOrder()).thenReturn(order);
        lenient().when(invoice.getInvoiceAmount()).thenReturn(new BigDecimal("5000.00"));

        lenient().when(customers.findByIdForUpdate(1L)).thenReturn(Optional.of(customer));
        lenient().when(invoices.findByIdForUpdate(21L)).thenReturn(Optional.of(invoice));
        lenient().when(payments.saveAndFlush(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void recordsPartialPaymentAndRecalculatesCustomerBalance() {
        when(payments.totalSuccessfulForInvoice(21L)).thenReturn(BigDecimal.ZERO);
        when(customers.totalOpenInvoiceBalance(1L)).thenReturn(new BigDecimal("3000.00"));

        PaymentView result = service.collect(request("2000.00", "request-1"));

        assertEquals(new BigDecimal("2000.00"), result.amount());
        assertEquals("INV-021", result.invoiceNumber());
        assertEquals(PaymentStatus.SUCCESSFUL, result.paymentStatus());
        verify(customer).setOutstandingAmount(new BigDecimal("3000.00"));
    }

    @Test
    void recordsFinalPaymentAndSetsCustomerBalanceToZero() {
        when(payments.totalSuccessfulForInvoice(21L)).thenReturn(new BigDecimal("2000.00"));
        when(customers.totalOpenInvoiceBalance(1L)).thenReturn(BigDecimal.ZERO);

        PaymentView result = service.collect(request("3000.00", "request-2"));

        assertEquals(new BigDecimal("3000.00"), result.amount());
        verify(customer).setOutstandingAmount(BigDecimal.ZERO);
    }

    @Test
    void rejectsPaymentThatExceedsInvoiceBalance() {
        when(payments.totalSuccessfulForInvoice(21L)).thenReturn(new BigDecimal("4000.00"));

        assertThrows(ConflictException.class, () -> service.collect(request("1000.01", "request-3")));

        verify(payments, never()).saveAndFlush(any(Payment.class));
    }

    @Test
    void rejectsPaymentWhenCustomerDoesNotOwnInvoice() {
        Customer otherCustomer = mock(Customer.class);
        when(otherCustomer.getId()).thenReturn(2L);
        when(otherCustomer.isActive()).thenReturn(true);
        when(customers.findByIdForUpdate(1L)).thenReturn(Optional.of(otherCustomer));
        when(invoices.findByIdForUpdate(21L)).thenReturn(Optional.of(invoice));

        assertThrows(ConflictException.class, () -> service.collect(request("100.00", "request-4")));
        verify(payments, never()).saveAndFlush(any(Payment.class));
    }

    @Test
    void returnsExistingRecordForRepeatedIdempotencyKey() {
        Payment existing = mock(Payment.class);
        when(existing.getCustomer()).thenReturn(customer);
        when(existing.getInvoice()).thenReturn(invoice);
        when(existing.getAmount()).thenReturn(new BigDecimal("2000.00"));
        when(existing.getPaymentType()).thenReturn(PaymentType.CASH);
        when(existing.getPaymentDate()).thenReturn(LocalDate.of(2026, 11, 14));
        when(existing.getReferenceNumber()).thenReturn("TX-1");
        when(existing.getRemarks()).thenReturn(null);
        when(existing.getPaymentStatus()).thenReturn(PaymentStatus.SUCCESSFUL);
        when(payments.findByIdempotencyKey("request-5")).thenReturn(Optional.of(existing));

        PaymentView result = service.collect(request("2000.00", "request-5"));

        assertEquals(PaymentStatus.SUCCESSFUL, result.paymentStatus());
        verify(payments, never()).saveAndFlush(any(Payment.class));
    }

    @Test
    void rejectsTransactionReferenceAlreadyUsedByHistoricalPayment() {
        when(payments.existsByNormalizedReference(PaymentType.CASH, "TX-1")).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.collect(request("2000.00", "request-6")));

        verify(payments, never()).saveAndFlush(any(Payment.class));
    }

    @Test
    void paymentSearchContinuesToReturnHistoricalPaymentDetails() {
        Payment payment = mock(Payment.class);
        when(payment.getId()).thenReturn(9L);
        when(payment.getCreatedAt()).thenReturn(Instant.parse("2026-11-14T10:30:00Z"));
        when(payment.getCustomer()).thenReturn(customer);
        when(payment.getOrder()).thenReturn(order);
        when(payment.getPaymentDate()).thenReturn(LocalDate.of(2026, 11, 14));
        when(payment.getAmount()).thenReturn(new BigDecimal("250.00"));
        when(payment.getPaymentType()).thenReturn(PaymentType.CHEQUE);
        when(payment.getPaymentStatus()).thenReturn(PaymentStatus.SUCCESSFUL);
        when(payments.search("C-101", PageRequest.of(0, 20)))
                .thenReturn(new PageImpl<>(List.of(payment)));

        PaymentView result = service.search(" C-101 ", PageRequest.of(0, 20)).getContent().get(0);

        assertEquals(9L, result.id());
        assertEquals(1L, result.customerId());
        assertEquals(Instant.parse("2026-11-14T10:30:00Z"), result.createdAt());
        assertEquals("BO-011", result.orderNumber());
        assertEquals(PaymentType.CHEQUE, result.paymentType());
        assertEquals(PaymentStatus.SUCCESSFUL, result.paymentStatus());
    }

    @Test
    void customerHistoryReturnsOnlyRequestedCustomerInRepositoryTimestampOrder() {
        Payment newerPayment = mock(Payment.class);
        when(newerPayment.getId()).thenReturn(10L);
        when(newerPayment.getCustomer()).thenReturn(customer);
        when(newerPayment.getOrder()).thenReturn(order);
        when(newerPayment.getInvoice()).thenReturn(invoice);
        when(newerPayment.getPaymentDate()).thenReturn(LocalDate.of(2026, 11, 14));
        when(newerPayment.getCreatedAt()).thenReturn(Instant.parse("2026-11-14T10:30:00Z"));
        when(newerPayment.getAmount()).thenReturn(new BigDecimal("250.00"));
        when(newerPayment.getPaymentType()).thenReturn(PaymentType.CHEQUE);
        when(newerPayment.getReferenceNumber()).thenReturn("CHQ-10");
        when(newerPayment.getPaymentStatus()).thenReturn(PaymentStatus.SUCCESSFUL);
        Payment olderPayment = mock(Payment.class);
        when(olderPayment.getId()).thenReturn(9L);
        when(olderPayment.getCustomer()).thenReturn(customer);
        when(olderPayment.getOrder()).thenReturn(null);
        when(olderPayment.getInvoice()).thenReturn(null);
        when(olderPayment.getPaymentDate()).thenReturn(LocalDate.of(2026, 11, 13));
        when(olderPayment.getCreatedAt()).thenReturn(Instant.parse("2026-11-13T10:30:00Z"));
        when(olderPayment.getAmount()).thenReturn(new BigDecimal("500.00"));
        when(olderPayment.getPaymentType()).thenReturn(PaymentType.UPI);
        when(olderPayment.getReferenceNumber()).thenReturn("UPI-9");
        when(olderPayment.getPaymentStatus()).thenReturn(PaymentStatus.PENDING);
        when(payments.findByCustomer_IdOrderByCreatedAtDescIdDesc(1L))
                .thenReturn(List.of(newerPayment, olderPayment));

        List<PaymentView> history = service.customerHistory(1L);

        assertEquals(2, history.size());
        assertEquals(10L, history.get(0).id());
        assertEquals(Instant.parse("2026-11-14T10:30:00Z"), history.get(0).createdAt());
        assertEquals(PaymentType.CHEQUE, history.get(0).paymentType());
        assertEquals("CHQ-10", history.get(0).referenceNumber());
        assertEquals(PaymentStatus.PENDING, history.get(1).paymentStatus());
        verify(payments).findByCustomer_IdOrderByCreatedAtDescIdDesc(1L);
    }

    private PaymentRequest request(String amount, String idempotencyKey) {
        return new PaymentRequest(1L, null, 21L, new BigDecimal(amount), PaymentType.CASH,
                LocalDate.of(2026, 11, 14), "TX-1", idempotencyKey, null);
    }
}
