package com.brickworks.order;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record OrderView(Long id, String orderNumber, Long customerId, String customerName, LocalDate orderDate,
                        LocalDate requiredDeliveryDate, String deliveryAddress, String transportationMode,
                        String status, BigDecimal subtotal, BigDecimal discountTotal, BigDecimal taxTotal,
                        BigDecimal totalAmount, List<OrderLineView> items) {
    public record OrderLineView(Long orderItemId, Long productId, String productCode, String productName, Long quantity,
                                BigDecimal rate, BigDecimal discount, BigDecimal gstPercentage, BigDecimal amount) { }
}
