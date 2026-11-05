package com.brickworks.payment;

import com.brickworks.customer.Customer;
import com.brickworks.order.SalesOrder;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "payments")
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "order_id")
    private SalesOrder order;
    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;
    @Enumerated(EnumType.STRING) @Column(name = "payment_type", nullable = false, length = 24)
    private PaymentType paymentType;
    @Column(name = "reference_number", length = 80)
    private String referenceNumber;
    @Column(length = 500)
    private String remarks;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Payment() { }
    public Long getId() { return id; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer value) { customer = value; }
    public SalesOrder getOrder() { return order; }
    public void setOrder(SalesOrder value) { order = value; }
    public LocalDate getPaymentDate() { return paymentDate; }
    public void setPaymentDate(LocalDate value) { paymentDate = value; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal value) { amount = value; }
    public PaymentType getPaymentType() { return paymentType; }
    public void setPaymentType(PaymentType value) { paymentType = value; }
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String value) { referenceNumber = value; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String value) { remarks = value; }
}
