package com.brickworks.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record OrderRequest(
        @NotNull Long customerId,
        LocalDate requiredDeliveryDate,
        @NotBlank @Size(max = 500) String deliveryAddress,
        @Size(max = 40) String transportationMode,
        @Size(max = 1000) String remarks,
        @NotEmpty List<@Valid OrderItemRequest> items
) { }
