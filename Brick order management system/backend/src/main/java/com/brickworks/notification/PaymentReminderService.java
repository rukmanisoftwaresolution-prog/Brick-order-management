package com.brickworks.notification;

import com.brickworks.common.ConflictException;
import com.brickworks.common.IntegrationUnavailableException;
import com.brickworks.common.ResourceNotFoundException;
import com.brickworks.invoice.Invoice;
import com.brickworks.invoice.InvoiceRepository;
import com.brickworks.payment.PaymentRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PaymentReminderService {
    private final InvoiceRepository invoices;
    private final PaymentRepository payments;
    private final List<PaymentReminderProvider> providers;

    public PaymentReminderService(InvoiceRepository invoices, PaymentRepository payments,
                                  List<PaymentReminderProvider> providers) {
        this.invoices = invoices;
        this.payments = payments;
        this.providers = providers;
    }

    @Transactional
    public void send(long customerId, PaymentReminderRequest request) {
        Invoice invoice = invoices.findById(request.invoiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice " + request.invoiceId() + " was not found."));
        if (!invoice.getCustomer().getId().equals(customerId)) {
            throw new ConflictException("The selected invoice does not belong to this customer.");
        }
        String destination = invoice.getCustomer().getMobileNumber();
        if (destination == null || destination.isBlank()) {
            throw new ConflictException("The customer does not have a mobile number for reminders.");
        }

        BigDecimal paid = payments.totalSuccessfulForInvoice(invoice.getId());
        BigDecimal outstanding = invoice.getInvoiceAmount().subtract(paid).max(BigDecimal.ZERO);
        if (outstanding.signum() == 0) {
            throw new ConflictException("A payment reminder cannot be sent for a fully paid invoice.");
        }

        PaymentReminderProvider provider = providers.stream()
                .filter(candidate -> candidate.supports(request.channel()))
                .findFirst()
                .orElseThrow(() -> unavailable(request.channel()));
        if (!provider.isConfigured()) {
            throw unavailable(request.channel());
        }

        String message = "Dear " + invoice.getCustomer().getCustomerName()
                + ", invoice " + invoice.getInvoiceNumber()
                + " is for ₹" + invoice.getInvoiceAmount().toPlainString()
                + ". Paid: ₹" + paid.toPlainString()
                + ". Outstanding: ₹" + outstanding.toPlainString()
                + ". Please contact the Brickworks accounts team and quote the invoice number for payment instructions.";
        provider.send(new PaymentReminderMessage(request.channel(), invoice.getCustomer().getCustomerName(),
                invoice.getInvoiceNumber(), destination, invoice.getInvoiceAmount(), paid, outstanding, message));
    }

    private IntegrationUnavailableException unavailable(PaymentReminderChannel channel) {
        return new IntegrationUnavailableException(
                channel + " reminders are unavailable because no configured provider is available.");
    }
}
