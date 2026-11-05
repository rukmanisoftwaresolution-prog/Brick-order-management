package com.brickworks.product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "products", uniqueConstraints = @UniqueConstraint(name = "products_product_code_key", columnNames = "product_code"))
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank @Size(max = 30) @Column(name = "product_code", nullable = false, length = 30)
    private String productCode;
    @NotBlank @Size(max = 120) @Column(name = "product_name", nullable = false, length = 120)
    private String productName;
    @Size(max = 80) @Column(length = 80)
    private String size;
    @PositiveOrZero @Column(name = "weight_kg", precision = 10, scale = 3)
    private BigDecimal weightKg;
    @NotNull @PositiveOrZero @DecimalMax("100.00") @Column(name = "gst_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal gstPercentage;
    @NotNull @PositiveOrZero @Column(name = "current_rate", nullable = false, precision = 14, scale = 2)
    private BigDecimal currentRate;
    @NotNull @PositiveOrZero @Column(name = "opening_stock", nullable = false)
    private Long openingStock;
    @NotNull @PositiveOrZero @Column(name = "minimum_stock", nullable = false)
    private Long minimumStock;
    @Column(nullable = false)
    private boolean active = true;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Product() { }

    public Long getId() { return id; }
    public String getProductCode() { return productCode; }
    public void setProductCode(String value) { productCode = value; }
    public String getProductName() { return productName; }
    public void setProductName(String value) { productName = value; }
    public String getSize() { return size; }
    public void setSize(String value) { size = value; }
    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal value) { weightKg = value; }
    public BigDecimal getGstPercentage() { return gstPercentage; }
    public void setGstPercentage(BigDecimal value) { gstPercentage = value; }
    public BigDecimal getCurrentRate() { return currentRate; }
    public void setCurrentRate(BigDecimal value) { currentRate = value; }
    public Long getOpeningStock() { return openingStock; }
    public void setOpeningStock(Long value) { openingStock = value; }
    public Long getMinimumStock() { return minimumStock; }
    public void setMinimumStock(Long value) { minimumStock = value; }
    public boolean isActive() { return active; }
    public void setActive(boolean value) { active = value; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
