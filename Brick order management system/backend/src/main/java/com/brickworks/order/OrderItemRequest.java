package com.brickworks.order;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record OrderItemRequest(@NotNull Long productId, @NotNull @Positive Long quantity,
                               @NotNull @PositiveOrZero BigDecimal rate,
                               @NotNull @PositiveOrZero BigDecimal discount) { }
