package com.brickworks.payment;

import com.brickworks.common.ConflictException;
import com.brickworks.common.ResourceNotFoundException;
import com.brickworks.customer.Customer;
import com.brickworks.customer.CustomerRepository;
import com.brickworks.invoice.Invoice;
import com.brickworks.invoice.InvoiceRepository;
import com.brickworks.order.SalesOrder;
import com.brickworks.order.SalesOrderRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PaymentService {
    private final PaymentRepository payments;
    private final CustomerRepository customers;
    private final SalesOrderRepository orders;
    private final InvoiceRepository invoices;

    public PaymentService(PaymentRepository payments, CustomerRepository customers, SalesOrderRepository orders,
                          InvoiceRepository invoices) {
        this.payments = payments;
        this.customers = customers;
        this.orders = orders;
        this.invoices = invoices;
    }

    @Transactional(readOnly = true)
    public Page<PaymentView> search(String term, Pageable pageable) {
        return payments.search(term == null ? "" : term.trim(), pageable).map(this::toView);
    }

    @Transactional(readOnly = true)
    public List<PaymentView> customerHistory(Long customerId) {
        return payments.findByCustomer_IdOrderByCreatedAtDescIdDesc(customerId).stream()
                .map(this::toView)
                .toList();
    }

    public PaymentView collect(PaymentRequest request) {
        String deduplicationKey = deduplicationKey(request);
        Payment existing = request.idempotencyKey() == null || request.idempotencyKey().isBlank()
                ? null : payments.findByIdempotencyKey(request.idempotencyKey().trim()).orElse(null);
        if (existing == null && deduplicationKey != null) {
            existing = payments.findByDeduplicationKey(deduplicationKey).orElse(null);
        }
        if (existing != null) {
            ensureSameRequest(existing, request);
            return toView(existing);
        }
        String normalizedReference = normalize(request.referenceNumber());
        if (normalizedReference != null && payments.existsByNormalizedReference(
                request.paymentType(), normalizedReference.toUpperCase(Locale.ROOT))) {
            throw new ConflictException("This payment method and transaction reference already exist.");
        }

        if (request.invoiceId() != null && (request.idempotencyKey() == null || request.idempotencyKey().isBlank())) {
            throw new ConflictException("Invoice payments require an idempotency key.");
        }

        Customer customer;
        Invoice invoice = null;
        SalesOrder order = null;
        if (request.invoiceId() != null) {
            invoice = invoices.findByIdForUpdate(request.invoiceId())
                    .orElseThrow(() -> new ResourceNotFoundException("Invoice " + request.invoiceId() + " was not found."));
            order = invoice.getOrder();
            if (request.orderId() != null && !request.orderId().equals(order.getId())) {
                throw new ConflictException("The selected order does not belong to the selected invoice.");
            }
            customer = customers.findByIdForUpdate(request.customerId())
                    .filter(Customer::isActive)
                    .orElseThrow(() -> new ResourceNotFoundException("Active customer " + request.customerId() + " was not found."));
            if (!invoice.getCustomer().getId().equals(customer.getId())) {
                throw new ConflictException("Payment customer must match the selected invoice customer.");
            }
            BigDecimal paid = payments.totalSuccessfulForInvoice(invoice.getId());
            BigDecimal outstanding = invoice.getInvoiceAmount().subtract(paid).max(BigDecimal.ZERO);
            if (request.amount().compareTo(outstanding) > 0) {
                throw new ConflictException("Payment amount exceeds the invoice's remaining balance.");
            }
        } else {
            if (request.orderId() != null) {
                order = orders.findByIdForUpdate(request.orderId())
                        .orElseThrow(() -> new ResourceNotFoundException("Order " + request.orderId() + " was not found."));
                customer = customers.findByIdForUpdate(request.customerId())
                        .filter(Customer::isActive)
                        .orElseThrow(() -> new ResourceNotFoundException("Active customer " + request.customerId() + " was not found."));
                if (!order.getCustomer().getId().equals(customer.getId())) {
                    throw new ConflictException("Payment customer must match the selected order customer.");
                }
                if (invoices.existsByOrderId(order.getId())) {
                    throw new ConflictException("Select the invoice for this order when recording a payment.");
                }
                BigDecimal paid = payments.totalSuccessfulForOrder(order.getId());
                if (paid.add(request.amount()).compareTo(order.getTotalAmount()) > 0) {
                    throw new ConflictException("Payment amount exceeds the order's remaining balance.");
                }
            } else {
                customer = customers.findByIdForUpdate(request.customerId())
                        .filter(Customer::isActive)
                        .orElseThrow(() -> new ResourceNotFoundException("Active customer " + request.customerId() + " was not found."));
            }
        }

        Payment payment = new Payment();
        payment.setCustomer(customer);
        payment.setOrder(order);
        payment.setInvoice(invoice);
        payment.setPaymentDate(request.paymentDate() == null ? LocalDate.now() : request.paymentDate());
        payment.setAmount(request.amount());
        payment.setPaymentType(request.paymentType());
        payment.setReferenceNumber(normalize(request.referenceNumber()));
        payment.setPaymentStatus(PaymentStatus.SUCCESSFUL);
        payment.setIdempotencyKey(normalize(request.idempotencyKey()));
        payment.setDeduplicationKey(deduplicationKey);
        payment.setRemarks(normalize(request.remarks()));
        try {
            Payment saved = payments.saveAndFlush(payment);
            if (invoice != null) {
                customer.setOutstandingAmount(customer.getLegacyOutstandingAmount()
                        .add(customers.totalOpenInvoiceBalance(customer.getId())));
                customers.save(customer);
            }
            return toView(saved);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("A payment with this idempotency key or transaction reference already exists.");
        }
    }

    private String normalize(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    private String deduplicationKey(PaymentRequest request) {
        String reference = normalize(request.referenceNumber());
        return reference == null ? null : request.paymentType().name() + ":" + reference.toUpperCase(Locale.ROOT);
    }

    private void ensureSameRequest(Payment existing, PaymentRequest request) {
        boolean invoiceMatches = request.invoiceId() != null
                ? existing.getInvoice() != null && existing.getInvoice().getId().equals(request.invoiceId())
                    && (request.orderId() == null || existing.getOrder().getId().equals(request.orderId()))
                : existing.getInvoice() == null
                    && Objects.equals(existing.getOrder() == null ? null : existing.getOrder().getId(), request.orderId());
        boolean matches = existing.getCustomer().getId().equals(request.customerId())
                && invoiceMatches
                && existing.getAmount().compareTo(request.amount()) == 0
                && existing.getPaymentType() == request.paymentType()
                && Objects.equals(normalize(existing.getReferenceNumber()), normalize(request.referenceNumber()))
                && Objects.equals(normalize(existing.getRemarks()), normalize(request.remarks()))
                && (request.paymentDate() == null || existing.getPaymentDate().equals(request.paymentDate()));
        if (!matches) {
            throw new ConflictException("The idempotency key or transaction reference was already used for a different payment.");
        }
    }

    private PaymentView toView(Payment payment) {
        return new PaymentView(payment.getId(), payment.getCustomer().getId(), payment.getCustomer().getCustomerCode(),
                payment.getCustomer().getCustomerName(), payment.getOrder() == null ? null : payment.getOrder().getOrderNumber(),
                payment.getPaymentDate(), payment.getCreatedAt(), payment.getAmount(), payment.getPaymentType(),
                payment.getReferenceNumber(), payment.getRemarks(),
                payment.getInvoice() == null ? null : payment.getInvoice().getInvoiceNumber(),
                payment.getPaymentStatus());
    }
}
