package com.brickworks.delivery;

import jakarta.validation.constraints.NotNull;

public record DeliveryStatusRequest(@NotNull DeliveryStatus status) { }
