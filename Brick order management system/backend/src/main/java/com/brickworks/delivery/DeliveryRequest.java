package com.brickworks.delivery;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record DeliveryRequest(@NotNull Long orderId, Long vehicleId,
                              @NotBlank @Size(max = 500) String deliveryAddress,
                              @Size(max = 1000) String remarks,
                              @NotEmpty List<@Valid DeliveryItemRequest> items) { }
