package com.brickworks.delivery;

import java.time.Instant;
import java.util.List;

public record DeliveryView(Long id, String deliveryNumber, String orderNumber, String customerName,
                           String vehicleNumber, String driverName, DeliveryStatus status,
                           String deliveryAddress, String challanNumber, Instant createdAt,
                           List<DeliveryLineView> items) {
    public record DeliveryLineView(Long orderItemId, String productCode, String productName, Long quantity) { }
}
