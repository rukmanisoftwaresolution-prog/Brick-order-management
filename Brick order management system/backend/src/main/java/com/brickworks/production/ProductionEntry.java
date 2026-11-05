package com.brickworks.production;

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
import java.time.Instant;
import java.time.LocalDate;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "production_entries")
public class ProductionEntry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Column(name = "production_date", nullable = false)
    private LocalDate productionDate;
    @Column(name = "target_quantity", nullable = false)
    private Long targetQuantity;
    @Column(name = "actual_quantity", nullable = false)
    private Long actualQuantity;
    @Column(name = "rejected_quantity", nullable = false)
    private Long rejectedQuantity;
    @Column(name = "raw_material_consumption", nullable = false, precision = 14, scale = 3)
    private BigDecimal rawMaterialConsumption;
    @Column(name = "kiln_name", length = 100)
    private String kilnName;
    @Column(name = "machine_name", length = 100)
    private String machineName;
    @Column(length = 1000)
    private String remarks;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ProductionEntry() { }
    public Long getId() { return id; }
    public Product getProduct() { return product; }
    public void setProduct(Product value) { product = value; }
    public LocalDate getProductionDate() { return productionDate; }
    public void setProductionDate(LocalDate value) { productionDate = value; }
    public Long getTargetQuantity() { return targetQuantity; }
    public void setTargetQuantity(Long value) { targetQuantity = value; }
    public Long getActualQuantity() { return actualQuantity; }
    public void setActualQuantity(Long value) { actualQuantity = value; }
    public Long getRejectedQuantity() { return rejectedQuantity; }
    public void setRejectedQuantity(Long value) { rejectedQuantity = value; }
    public BigDecimal getRawMaterialConsumption() { return rawMaterialConsumption; }
    public void setRawMaterialConsumption(BigDecimal value) { rawMaterialConsumption = value; }
    public String getKilnName() { return kilnName; }
    public void setKilnName(String value) { kilnName = value; }
    public String getMachineName() { return machineName; }
    public void setMachineName(String value) { machineName = value; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String value) { remarks = value; }
}
