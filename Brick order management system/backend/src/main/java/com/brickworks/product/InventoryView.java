package com.brickworks.product;

import java.time.Instant;

public record InventoryView(Long productId, String productCode, String productName, Long availableStock,
                            Long reservedStock, Long damagedStock, Long deliveredStock, Instant updatedAt) { }
