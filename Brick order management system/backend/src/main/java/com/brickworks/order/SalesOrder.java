package com.brickworks.order;

import com.brickworks.customer.Customer;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "orders")
public class SalesOrder {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "order_number", nullable = false, length = 30, unique = true)
    private String orderNumber;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;
    @Column(name = "required_delivery_date")
    private LocalDate requiredDeliveryDate;
    @Column(name = "delivery_address", nullable = false, length = 500)
    private String deliveryAddress;
    @Column(name = "transportation_mode", length = 40)
    private String transportationMode;
    @Column(length = 1000)
    private String remarks;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32)
    private OrderStatus status;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;
    @Column(name = "discount_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal discountTotal = BigDecimal.ZERO;
    @Column(name = "tax_total", nullable = false, precision = 14, scale = 2)
    private BigDecimal taxTotal = BigDecimal.ZERO;
    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<SalesOrderItem> items = new ArrayList<>();
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SalesOrder() { }
    void addItem(SalesOrderItem item) { items.add(item); item.setOrder(this); }
    public Long getId() { return id; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String value) { orderNumber = value; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer value) { customer = value; }
    public LocalDate getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDate value) { orderDate = value; }
    public LocalDate getRequiredDeliveryDate() { return requiredDeliveryDate; }
    public void setRequiredDeliveryDate(LocalDate value) { requiredDeliveryDate = value; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String value) { deliveryAddress = value; }
    public String getTransportationMode() { return transportationMode; }
    public void setTransportationMode(String value) { transportationMode = value; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String value) { remarks = value; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus value) { status = value; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal value) { subtotal = value; }
    public BigDecimal getDiscountTotal() { return discountTotal; }
    public void setDiscountTotal(BigDecimal value) { discountTotal = value; }
    public BigDecimal getTaxTotal() { return taxTotal; }
    public void setTaxTotal(BigDecimal value) { taxTotal = value; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal value) { totalAmount = value; }
    public List<SalesOrderItem> getItems() { return items; }
}
