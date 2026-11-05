package com.brickworks.delivery;

import com.brickworks.common.ConflictException;
import com.brickworks.common.ResourceNotFoundException;
import com.brickworks.order.SalesOrder;
import com.brickworks.order.SalesOrderItem;
import com.brickworks.order.SalesOrderRepository;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DeliveryService {
    private final DeliveryRepository deliveries;
    private final DeliveryItemRepository deliveryItems;
    private final SalesOrderRepository orders;
    private final VehicleRepository vehicles;

    public DeliveryService(DeliveryRepository deliveries, DeliveryItemRepository deliveryItems,
                           SalesOrderRepository orders, VehicleRepository vehicles) {
        this.deliveries = deliveries;
        this.deliveryItems = deliveryItems;
        this.orders = orders;
        this.vehicles = vehicles;
    }

    @Transactional(readOnly = true)
    public Page<DeliveryView> search(String term, Pageable pageable) {
        return deliveries.search(term == null ? "" : term.trim(), pageable).map(this::toView);
    }

    public DeliveryView create(DeliveryRequest request) {
        SalesOrder order = orders.findById(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order " + request.orderId() + " was not found."));
        if (order.getStatus() == com.brickworks.order.OrderStatus.DRAFT || order.getStatus() == com.brickworks.order.OrderStatus.CANCELLED) {
            throw new ConflictException("Only active, confirmed orders can be dispatched.");
        }
        Delivery delivery = new Delivery();
        delivery.setDeliveryNumber(nextDeliveryNumber());
        delivery.setChallanNumber("CH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        delivery.setOrder(order);
        delivery.setDeliveryAddress(request.deliveryAddress().trim());
        delivery.setStatus(DeliveryStatus.PENDING);
        delivery.setRemarks(request.remarks());
        if (request.vehicleId() != null) {
            delivery.setVehicle(vehicles.findById(request.vehicleId())
                    .filter(Vehicle::isActive)
                    .orElseThrow(() -> new ResourceNotFoundException("Active vehicle " + request.vehicleId() + " was not found.")));
        }
        Set<Long> includedItems = new HashSet<>();
        for (DeliveryItemRequest itemRequest : request.items()) {
            if (!includedItems.add(itemRequest.orderItemId())) {
                throw new ConflictException("Each order item can appear only once in a delivery.");
            }
            SalesOrderItem orderItem = order.getItems().stream()
                    .filter(item -> item.getId().equals(itemRequest.orderItemId()))
                    .findFirst()
                    .orElseThrow(() -> new ConflictException("Delivery line must belong to the selected order."));
            long alreadyAssigned = deliveryItems.sumActiveDeliveredQuantity(orderItem.getId(), DeliveryStatus.RETURNED);
            long remaining = orderItem.getQuantity() - alreadyAssigned;
            if (itemRequest.quantity() > remaining) {
                throw new ConflictException("Delivery quantity exceeds the order item's remaining quantity.");
            }
            DeliveryItem deliveryItem = new DeliveryItem();
            deliveryItem.setOrderItem(orderItem);
            deliveryItem.setQuantity(itemRequest.quantity());
            delivery.addItem(deliveryItem);
        }
        return toView(deliveries.save(delivery));
    }

    private String nextDeliveryNumber() {
        String number;
        do { number = "DL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(); }
        while (deliveries.existsByDeliveryNumber(number));
        return number;
    }

    private DeliveryView toView(Delivery delivery) {
        var lines = delivery.getItems().stream().map(item -> new DeliveryView.DeliveryLineView(
                item.getOrderItem().getId(), item.getOrderItem().getProduct().getProductCode(),
                item.getOrderItem().getProduct().getProductName(), item.getQuantity())).toList();
        return new DeliveryView(delivery.getId(), delivery.getDeliveryNumber(), delivery.getOrder().getOrderNumber(),
                delivery.getOrder().getCustomer().getCustomerName(),
                delivery.getVehicle() == null ? null : delivery.getVehicle().getVehicleNumber(),
                delivery.getVehicle() == null ? null : delivery.getVehicle().getDriverName(), delivery.getStatus(),
                delivery.getDeliveryAddress(), delivery.getChallanNumber(), null, lines);
    }
}
