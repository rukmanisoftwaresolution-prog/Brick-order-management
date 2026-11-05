package com.brickworks.customer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.brickworks.common.ConflictException;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {
    @Mock
    private CustomerRepository repository;

    @Mock
    private CustomerMapper mapper;

    @InjectMocks
    private CustomerService service;

    @Test
    void createTrimsCustomerCodeAndNameBeforeSaving() {
        CustomerRequest request = request(" C-101 ", "  Brick House  ", null);
        when(repository.findByCustomerCodeIgnoreCase("C-101")).thenReturn(Optional.empty());
        when(repository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mapper.toView(any(Customer.class))).thenReturn(null);

        service.create(request);

        ArgumentCaptor<Customer> captor = ArgumentCaptor.forClass(Customer.class);
        verify(repository).save(captor.capture());
        assertEquals("C-101", captor.getValue().getCustomerCode());
        assertEquals("Brick House", captor.getValue().getCustomerName());
    }

    @Test
    void createRejectsDuplicateCustomerCode() {
        Customer existing = new Customer("C-101", "Existing", CustomerType.BUSINESS);
        when(repository.findByCustomerCodeIgnoreCase("C-101")).thenReturn(Optional.of(existing));

        assertThrows(ConflictException.class, () -> service.create(request("C-101", "New", null)));
    }

    @Test
    void createRejectsDuplicateGstNumber() {
        when(repository.findByCustomerCodeIgnoreCase("C-102")).thenReturn(Optional.empty());
        when(repository.existsByGstNumberIgnoreCase("GST-101")).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.create(request("C-102", "New", "GST-101")));
    }

    private CustomerRequest request(String code, String name, String gstNumber) {
        return new CustomerRequest(code, name, CustomerType.BUSINESS, gstNumber, null, null, null, null, null,
                null, null, null, BigDecimal.ZERO, true);
    }
}
