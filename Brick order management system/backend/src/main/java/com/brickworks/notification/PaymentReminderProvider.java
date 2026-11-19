package com.brickworks.notification;

public interface PaymentReminderProvider {
    boolean supports(PaymentReminderChannel channel);

    boolean isConfigured();

    void send(PaymentReminderMessage message);
}
