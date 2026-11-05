package com.brickworks.product;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record InventoryAdjustmentRequest(@NotNull Long productId, @NotNull InventoryTransactionType transactionType,
                                         @NotNull @Positive Long quantity, @Size(max = 500) String remarks) { }
