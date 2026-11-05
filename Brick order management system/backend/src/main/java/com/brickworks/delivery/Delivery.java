package com.brickworks.delivery;

import com.brickworks.order.SalesOrder;
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
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "deliveries")
public class Delivery {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "delivery_number", nullable = false, unique = true, length = 30)
    private String deliveryNumber;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_id", nullable = false)
    private SalesOrder order;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 24)
    private DeliveryStatus status;
    @Column(name = "delivery_address", nullable = false, length = 500)
    private String deliveryAddress;
    @Column(name = "challan_number", unique = true, length = 30)
    private String challanNumber;
    @Column(length = 1000)
    private String remarks;
    @OneToMany(mappedBy = "delivery", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<DeliveryItem> items = new ArrayList<>();
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Delivery() { }
    void addItem(DeliveryItem item) { items.add(item); item.setDelivery(this); }
    public Long getId() { return id; }
    public String getDeliveryNumber() { return deliveryNumber; }
    public void setDeliveryNumber(String value) { deliveryNumber = value; }
    public SalesOrder getOrder() { return order; }
    public void setOrder(SalesOrder value) { order = value; }
    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle value) { vehicle = value; }
    public DeliveryStatus getStatus() { return status; }
    public void setStatus(DeliveryStatus value) { status = value; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String value) { deliveryAddress = value; }
    public String getChallanNumber() { return challanNumber; }
    public void setChallanNumber(String value) { challanNumber = value; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String value) { remarks = value; }
    public List<DeliveryItem> getItems() { return items; }
}
