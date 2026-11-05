package com.brickworks.order;

public enum OrderStatus {
    DRAFT,
    CONFIRMED,
    PRODUCTION_PLANNED,
    IN_PRODUCTION,
    READY_FOR_DISPATCH,
    DISPATCHED,
    PARTIALLY_DELIVERED,
    DELIVERED,
    COMPLETED,
    CANCELLED
}
