package com.brickworks.notification;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

import com.brickworks.common.IntegrationUnavailableException;
import com.brickworks.customer.Customer;
import com.brickworks.invoice.Invoice;
import com.brickworks.invoice.InvoiceRepository;
import com.brickworks.payment.PaymentRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class PaymentReminderServiceTest {
    @Test
    void reportsProviderUnavailableWithoutPretendingToSend() {
        InvoiceRepository invoices = mock(InvoiceRepository.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        Invoice invoice = mock(Invoice.class);
        Customer customer = mock(Customer.class);
        when(invoices.findById(7L)).thenReturn(Optional.of(invoice));
        when(invoice.getCustomer()).thenReturn(customer);
        when(customer.getId()).thenReturn(3L);
        when(customer.getCustomerName()).thenReturn("Brick House");
        when(customer.getMobileNumber()).thenReturn("+919000001234");
        when(invoice.getId()).thenReturn(7L);
        when(invoice.getInvoiceAmount()).thenReturn(new BigDecimal("5000.00"));
        when(payments.totalSuccessfulForInvoice(7L)).thenReturn(new BigDecimal("2000.00"));

        PaymentReminderService service = new PaymentReminderService(invoices, payments, List.of());

        assertThrows(IntegrationUnavailableException.class,
                () -> service.send(3L, new PaymentReminderRequest(7L, PaymentReminderChannel.WHATSAPP)));
    }

    @Test
    void sendsConfiguredProviderTheCompleteOutstandingInvoiceMessage() {
        InvoiceRepository invoices = mock(InvoiceRepository.class);
        PaymentRepository payments = mock(PaymentRepository.class);
        PaymentReminderProvider provider = mock(PaymentReminderProvider.class);
        Invoice invoice = mock(Invoice.class);
        Customer customer = mock(Customer.class);
        when(invoices.findById(7L)).thenReturn(Optional.of(invoice));
        when(invoice.getCustomer()).thenReturn(customer);
        when(customer.getId()).thenReturn(3L);
        when(customer.getCustomerName()).thenReturn("Brick House");
        when(customer.getMobileNumber()).thenReturn("+919000001234");
        when(invoice.getId()).thenReturn(7L);
        when(invoice.getInvoiceNumber()).thenReturn("INV-007");
        when(invoice.getInvoiceAmount()).thenReturn(new BigDecimal("5000.00"));
        when(payments.totalSuccessfulForInvoice(7L)).thenReturn(new BigDecimal("2000.00"));
        when(provider.supports(PaymentReminderChannel.SMS)).thenReturn(true);
        when(provider.isConfigured()).thenReturn(true);
        doAnswer(invocation -> {
            PaymentReminderMessage message = invocation.getArgument(0);
            assertEquals("Brick House", message.customerName());
            assertEquals("INV-007", message.invoiceNumber());
            assertEquals(new BigDecimal("5000.00"), message.invoiceAmount());
            assertEquals(new BigDecimal("2000.00"), message.paidAmount());
            assertEquals(new BigDecimal("3000.00"), message.outstandingAmount());
            org.junit.jupiter.api.Assertions.assertTrue(message.message().contains("payment instructions"));
            return null;
        }).when(provider).send(any(PaymentReminderMessage.class));

        new PaymentReminderService(invoices, payments, List.of(provider))
                .send(3L, new PaymentReminderRequest(7L, PaymentReminderChannel.SMS));

        verify(provider).send(any(PaymentReminderMessage.class));
    }
}
