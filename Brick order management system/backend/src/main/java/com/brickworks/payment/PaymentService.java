package com.brickworks.payment;

import com.brickworks.common.ConflictException;
import com.brickworks.common.ResourceNotFoundException;
import com.brickworks.customer.Customer;
import com.brickworks.customer.CustomerRepository;
import com.brickworks.order.SalesOrder;
import com.brickworks.order.SalesOrderRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
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

    public PaymentService(PaymentRepository payments, CustomerRepository customers, SalesOrderRepository orders) {
        this.payments = payments;
        this.customers = customers;
        this.orders = orders;
    }

    @Transactional(readOnly = true)
    public Page<PaymentView> search(String term, Pageable pageable) {
        return payments.search(term == null ? "" : term.trim(), pageable).map(this::toView);
    }

    public PaymentView collect(PaymentRequest request) {
        Customer customer = customers.findById(request.customerId())
                .filter(Customer::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Active customer " + request.customerId() + " was not found."));
        SalesOrder order = null;
        if (request.orderId() != null) {
            order = orders.findById(request.orderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order " + request.orderId() + " was not found."));
            if (!order.getCustomer().getId().equals(customer.getId())) {
                throw new ConflictException("Payment customer must match the selected order customer.");
            }
            BigDecimal paid = payments.totalForOrder(order.getId());
            if (paid.add(request.amount()).compareTo(order.getTotalAmount()) > 0) {
                throw new ConflictException("Payment amount exceeds the order's remaining balance.");
            }
        }
        Payment payment = new Payment();
        payment.setCustomer(customer);
        payment.setOrder(order);
        payment.setPaymentDate(LocalDate.now());
        payment.setAmount(request.amount());
        payment.setPaymentType(request.paymentType());
        payment.setReferenceNumber(normalize(request.referenceNumber()));
        payment.setRemarks(normalize(request.remarks()));
        return toView(payments.save(payment));
    }

    private String normalize(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    private PaymentView toView(Payment payment) {
        return new PaymentView(payment.getId(), payment.getCustomer().getCustomerCode(),
                payment.getCustomer().getCustomerName(), payment.getOrder() == null ? null : payment.getOrder().getOrderNumber(),
                payment.getPaymentDate(), payment.getAmount(), payment.getPaymentType(),
                payment.getReferenceNumber(), payment.getRemarks());
    }
}
