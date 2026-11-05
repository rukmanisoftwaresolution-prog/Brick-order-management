package com.brickworks.delivery;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record DeliveryItemRequest(@NotNull Long orderItemId, @NotNull @Positive Long quantity) { }
