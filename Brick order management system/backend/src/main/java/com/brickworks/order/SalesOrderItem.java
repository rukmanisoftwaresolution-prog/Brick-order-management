package com.brickworks.order;

import com.brickworks.product.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
public class SalesOrderItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_id", nullable = false)
    private SalesOrder order;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(nullable = false)
    private Long quantity;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal rate;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal discount;
    @Column(name = "gst_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal gstPercentage;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    protected SalesOrderItem() { }
    void setOrder(SalesOrder value) { order = value; }
    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public void setProduct(Product value) { product = value; }
    public Long getQuantity() { return quantity; }
    public void setQuantity(Long value) { quantity = value; }
    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal value) { rate = value; }
    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal value) { discount = value; }
    public BigDecimal getGstPercentage() { return gstPercentage; }
    public void setGstPercentage(BigDecimal value) { gstPercentage = value; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal value) { amount = value; }
}
