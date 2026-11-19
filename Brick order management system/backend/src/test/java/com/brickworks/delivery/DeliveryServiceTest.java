package com.brickworks.delivery;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.brickworks.common.ConflictException;
import com.brickworks.customer.Customer;
import com.brickworks.order.SalesOrder;
import com.brickworks.order.SalesOrderRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DeliveryServiceTest {
    @Mock
    private DeliveryRepository deliveries;
    @Mock
    private DeliveryItemRepository deliveryItems;
    @Mock
    private SalesOrderRepository orders;
    @Mock
    private VehicleRepository vehicles;

    private DeliveryService service;
    private Delivery delivery;

    @BeforeEach
    void setUp() {
        service = new DeliveryService(deliveries, deliveryItems, orders, vehicles);
        delivery = new Delivery();
        delivery.setDeliveryNumber("DL-001");
        delivery.setChallanNumber("CH-001");
        delivery.setDeliveryAddress("Snapshot address");
        delivery.setStatus(DeliveryStatus.PENDING);

        Customer customer = mock(Customer.class);
        lenient().when(customer.getCustomerName()).thenReturn("Brick House");
        SalesOrder order = mock(SalesOrder.class);
        lenient().when(order.getOrderNumber()).thenReturn("BO-001");
        lenient().when(order.getCustomer()).thenReturn(customer);
        delivery.setOrder(order);

        when(deliveries.findByIdForUpdate(1L)).thenAnswer(invocation -> Optional.of(delivery));
        lenient().when(deliveries.save(any(Delivery.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void allowsPendingToLoading() {
        assertStatusTransition(DeliveryStatus.PENDING, DeliveryStatus.LOADING);
    }

    @Test
    void allowsLoadingToInTransit() {
        assertStatusTransition(DeliveryStatus.LOADING, DeliveryStatus.IN_TRANSIT);
    }

    @Test
    void allowsInTransitToDelivered() {
        assertStatusTransition(DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED);
    }

    @Test
    void allowsLoadingToReturned() {
        assertStatusTransition(DeliveryStatus.LOADING, DeliveryStatus.RETURNED);
    }

    @Test
    void allowsInTransitToReturned() {
        assertStatusTransition(DeliveryStatus.IN_TRANSIT, DeliveryStatus.RETURNED);
    }

    @Test
    void rejectsTransitionsNotInTheLifecycle() {
        DeliveryStatus[][] invalidTransitions = {
                { DeliveryStatus.PENDING, DeliveryStatus.PENDING },
                { DeliveryStatus.PENDING, DeliveryStatus.IN_TRANSIT },
                { DeliveryStatus.PENDING, DeliveryStatus.DELIVERED },
                { DeliveryStatus.PENDING, DeliveryStatus.RETURNED },
                { DeliveryStatus.LOADING, DeliveryStatus.PENDING },
                { DeliveryStatus.LOADING, DeliveryStatus.LOADING },
                { DeliveryStatus.LOADING, DeliveryStatus.DELIVERED },
                { DeliveryStatus.IN_TRANSIT, DeliveryStatus.PENDING },
                { DeliveryStatus.IN_TRANSIT, DeliveryStatus.LOADING },
                { DeliveryStatus.IN_TRANSIT, DeliveryStatus.IN_TRANSIT },
                { DeliveryStatus.DELIVERED, DeliveryStatus.RETURNED },
                { DeliveryStatus.RETURNED, DeliveryStatus.DELIVERED }
        };
        for (DeliveryStatus[] transition : invalidTransitions) {
            delivery.setStatus(transition[0]);
            ConflictException exception = assertThrows(ConflictException.class,
                    () -> service.updateStatus(1L, transition[1]));
            if (transition[0] == DeliveryStatus.DELIVERED || transition[0] == DeliveryStatus.RETURNED) {
                assertEquals("Delivery status " + transition[0] + " is final and cannot be changed.", exception.getMessage());
            } else {
                assertEquals("Delivery status cannot change from " + transition[0] + " to " + transition[1] + ".", exception.getMessage());
            }
        }
    }

    @Test
    void deliveredAndReturnedAreFinal() {
        for (DeliveryStatus finalStatus : new DeliveryStatus[] { DeliveryStatus.DELIVERED, DeliveryStatus.RETURNED }) {
            delivery.setStatus(finalStatus);
            ConflictException exception = assertThrows(ConflictException.class,
                    () -> service.updateStatus(1L, DeliveryStatus.LOADING));
            assertEquals("Delivery status " + finalStatus + " is final and cannot be changed.", exception.getMessage());
        }
    }

    @Test
    void enteringInTransitSetsDispatchTimestamp() {
        delivery.setStatus(DeliveryStatus.LOADING);

        service.updateStatus(1L, DeliveryStatus.IN_TRANSIT);

        assertNotNull(delivery.getDispatchDate());
        assertNull(delivery.getDeliveredAt());
    }

    @Test
    void enteringDeliveredSetsDeliveredTimestampAndPreservesDispatchTimestamp() {
        Instant dispatchTime = Instant.parse("2026-11-16T10:00:00Z");
        delivery.setStatus(DeliveryStatus.IN_TRANSIT);
        delivery.setDispatchDate(dispatchTime);

        service.updateStatus(1L, DeliveryStatus.DELIVERED);

        assertEquals(dispatchTime, delivery.getDispatchDate());
        assertNotNull(delivery.getDeliveredAt());
    }

    @Test
    void statusUpdatesLockAndSaveTheDeliveryWithoutChangingItsAddress() {
        service.updateStatus(1L, DeliveryStatus.LOADING);

        verify(deliveries).findByIdForUpdate(1L);
        verify(deliveries).save(delivery);
        assertEquals("Snapshot address", delivery.getDeliveryAddress());
    }

    private void assertStatusTransition(DeliveryStatus current, DeliveryStatus requested) {
        delivery.setStatus(current);

        DeliveryView result = service.updateStatus(1L, requested);

        assertEquals(requested, result.status());
        assertEquals(requested, delivery.getStatus());
        verify(deliveries).save(delivery);
    }
}
