package com.brickworks.delivery;

import com.brickworks.order.SalesOrderItem;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "delivery_items")
public class DeliveryItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "delivery_id", nullable = false)
    private Delivery delivery;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_item_id", nullable = false)
    private SalesOrderItem orderItem;
    @Column(nullable = false)
    private Long quantity;

    protected DeliveryItem() { }
    void setDelivery(Delivery value) { delivery = value; }
    public SalesOrderItem getOrderItem() { return orderItem; }
    public void setOrderItem(SalesOrderItem value) { orderItem = value; }
    public Long getQuantity() { return quantity; }
    public void setQuantity(Long value) { quantity = value; }
}
