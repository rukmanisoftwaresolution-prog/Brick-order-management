package com.brickworks.product;

import java.math.BigDecimal;

public record ProductView(Long id, String productCode, String productName, String size, BigDecimal weightKg,
                          BigDecimal gstPercentage, BigDecimal currentRate, Long openingStock,
                          Long minimumStock, boolean active) { }
