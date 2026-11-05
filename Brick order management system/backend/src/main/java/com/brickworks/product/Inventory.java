package com.brickworks.product;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "inventory")
public class Inventory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;
    @Column(name = "available_stock", nullable = false)
    private Long availableStock = 0L;
    @Column(name = "reserved_stock", nullable = false)
    private Long reservedStock = 0L;
    @Column(name = "damaged_stock", nullable = false)
    private Long damagedStock = 0L;
    @Column(name = "delivered_stock", nullable = false)
    private Long deliveredStock = 0L;
    @UpdateTimestamp @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Inventory() { }
    public Inventory(Product product, long availableStock) { this.product = product; this.availableStock = availableStock; }
    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public Long getAvailableStock() { return availableStock; }
    public void setAvailableStock(Long value) { availableStock = value; }
    public Long getReservedStock() { return reservedStock; }
    public void setReservedStock(Long value) { reservedStock = value; }
    public Long getDamagedStock() { return damagedStock; }
    public void setDamagedStock(Long value) { damagedStock = value; }
    public Long getDeliveredStock() { return deliveredStock; }
    public void setDeliveredStock(Long value) { deliveredStock = value; }
    public Instant getUpdatedAt() { return updatedAt; }
}
