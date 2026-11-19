package com.brickworks.notification;

import jakarta.validation.constraints.NotNull;

public record PaymentReminderRequest(@NotNull Long invoiceId, @NotNull PaymentReminderChannel channel) {
}
