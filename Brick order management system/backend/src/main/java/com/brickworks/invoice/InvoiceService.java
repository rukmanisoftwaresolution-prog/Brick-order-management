package com.brickworks.invoice;

import com.brickworks.common.ConflictException;
import com.brickworks.common.ResourceNotFoundException;
import com.brickworks.customer.Customer;
import com.brickworks.customer.CustomerRepository;
import com.brickworks.order.OrderStatus;
import com.brickworks.order.SalesOrder;
import com.brickworks.order.SalesOrderRepository;
import com.brickworks.order.SalesOrderService;
import com.brickworks.order.OrderView;
import com.brickworks.payment.PaymentRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class InvoiceService {
    private final InvoiceRepository invoices;
    private final SalesOrderRepository orders;
    private final CustomerRepository customers;
    private final PaymentRepository payments;
    private final SalesOrderService orderService;

    public InvoiceService(InvoiceRepository invoices, SalesOrderRepository orders, CustomerRepository customers,
                          PaymentRepository payments, SalesOrderService orderService) {
        this.invoices = invoices;
        this.orders = orders;
        this.customers = customers;
        this.payments = payments;
        this.orderService = orderService;
    }

    public Page<InvoiceView> search(String term, Long customerId, boolean openOnly, Pageable pageable) {
        return invoices.search(term == null ? "" : term.trim(), customerId, openOnly, pageable).map(this::toView);
    }

    public Page<OrderView> eligibleOrders(Pageable pageable) {
        return orderService.eligibleForInvoicing(pageable);
    }

    @Transactional
    public InvoiceView generate(InvoiceRequest request) {
        SalesOrder order = orders.findByIdForUpdate(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order " + request.orderId() + " was not found."));
        if (order.getStatus() == OrderStatus.DRAFT || order.getStatus() == OrderStatus.CANCELLED) {
            throw new ConflictException("Only confirmed, non-cancelled orders can be invoiced.");
        }
        if (invoices.existsByOrderId(order.getId())) {
            throw new ConflictException("An invoice already exists for this order.");
        }

        Customer customer = customers.findByIdForUpdate(order.getCustomer().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer " + order.getCustomer().getId() + " was not found."));
        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        invoice.setOrder(order);
        invoice.setCustomer(customer);
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setTaxableAmount(order.getSubtotal().subtract(order.getDiscountTotal()));

        // The current profile has no tax-jurisdiction field; use the existing intrastate convention.
        BigDecimal cgst = order.getTaxTotal().divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
        invoice.setCgst(cgst);
        invoice.setSgst(order.getTaxTotal().subtract(cgst));
        invoice.setIgst(BigDecimal.ZERO);
        invoice.setInvoiceAmount(order.getTotalAmount());
        Invoice saved = invoices.saveAndFlush(invoice);
        refreshCustomerOutstanding(customer);
        return toView(saved);
    }

    private InvoiceView toView(Invoice invoice) {
        BigDecimal paid = payments.totalSuccessfulForInvoice(invoice.getId());
        BigDecimal outstanding = invoice.getInvoiceAmount().subtract(paid).max(BigDecimal.ZERO);
        InvoiceSettlementStatus status = outstanding.signum() == 0
                ? InvoiceSettlementStatus.PAID
                : paid.signum() == 0 ? InvoiceSettlementStatus.UNPAID : InvoiceSettlementStatus.PARTIALLY_PAID;
        return new InvoiceView(invoice.getId(), invoice.getInvoiceNumber(), invoice.getOrder().getOrderNumber(),
                invoice.getCustomer().getCustomerName(), invoice.getInvoiceDate(), invoice.getTaxableAmount(),
                invoice.getCgst(), invoice.getSgst(), invoice.getIgst(), invoice.getInvoiceAmount(),
                invoice.getOrder().getId(), invoice.getCustomer().getId(), paid, outstanding, status);
    }

    private void refreshCustomerOutstanding(Customer customer) {
        customer.setOutstandingAmount(customer.getLegacyOutstandingAmount()
                .add(customers.totalOpenInvoiceBalance(customer.getId())));
        customers.save(customer);
    }
}
