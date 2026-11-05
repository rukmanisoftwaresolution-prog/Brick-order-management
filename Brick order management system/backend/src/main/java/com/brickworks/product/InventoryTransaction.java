package com.brickworks.product;

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
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "inventory_transactions")
public class InventoryTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "product_id", nullable = false)
    private Product product;
    @Enumerated(EnumType.STRING) @Column(name = "transaction_type", nullable = false, length = 32)
    private InventoryTransactionType transactionType;
    @Column(nullable = false)
    private Long quantity;
    @Column(name = "reference_type", length = 40)
    private String referenceType;
    @Column(name = "reference_id")
    private Long referenceId;
    @Column(length = 500)
    private String remarks;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected InventoryTransaction() { }
    public InventoryTransaction(Product product, InventoryTransactionType type, long quantity, String referenceType, Long referenceId, String remarks) {
        this.product = product; this.transactionType = type; this.quantity = quantity;
        this.referenceType = referenceType; this.referenceId = referenceId; this.remarks = remarks;
    }
}
