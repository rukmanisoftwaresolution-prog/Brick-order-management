package com.brickworks.order;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.brickworks.customer.Customer;
import com.brickworks.customer.CustomerRepository;
import com.brickworks.customer.CustomerType;
import com.brickworks.product.ProductRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class SalesOrderServiceTest {
    @Test
    void confirmsDraftOrderForInvoiceEligibility() {
        SalesOrderRepository orders = mock(SalesOrderRepository.class);
        CustomerRepository customers = mock(CustomerRepository.class);
        ProductRepository products = mock(ProductRepository.class);
        SalesOrder order = new SalesOrder();
        order.setOrderNumber("BO-005");
        order.setCustomer(new Customer("C-002", "Brick House", CustomerType.BUSINESS));
        order.setStatus(OrderStatus.DRAFT);
        when(orders.findByIdForUpdate(5L)).thenReturn(Optional.of(order));
        when(orders.save(order)).thenReturn(order);

        OrderView result = new SalesOrderService(orders, customers, products).confirm(5L);

        verify(orders).save(order);
        assertEquals("CONFIRMED", result.status());
    }
}
