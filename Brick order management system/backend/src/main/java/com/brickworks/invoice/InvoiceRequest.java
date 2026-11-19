package com.brickworks.invoice;

import jakarta.validation.constraints.NotNull;

public record InvoiceRequest(@NotNull Long orderId) {
}
