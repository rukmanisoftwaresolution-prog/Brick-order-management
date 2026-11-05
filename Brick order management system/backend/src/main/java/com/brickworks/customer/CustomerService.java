package com.brickworks.customer;

import com.brickworks.common.ConflictException;
import com.brickworks.common.ResourceNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class CustomerService {
    private final CustomerRepository repository;
    private final CustomerMapper mapper;

    public CustomerService(CustomerRepository repository, CustomerMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Page<CustomerView> search(String term, Boolean active, Pageable pageable) {
        String normalizedTerm = term == null ? "" : term.trim();
        return repository.search(normalizedTerm, active, pageable).map(mapper::toView);
    }

    public CustomerView get(long id) {
        return mapper.toView(find(id));
    }

    public CustomerView create(CustomerRequest request) {
        ensureUnique(request, null);
        Customer customer = new Customer(request.customerCode().trim(), request.customerName().trim(), request.customerType());
        mapper.update(request, customer);
        customer.setCustomerCode(request.customerCode().trim());
        customer.setCustomerName(request.customerName().trim());
        customer.setGstNumber(normalizeOptional(request.gstNumber()));
        return mapper.toView(repository.save(customer));
    }

    public CustomerView update(long id, CustomerRequest request) {
        Customer customer = find(id);
        ensureUnique(request, id);
        mapper.update(request, customer);
        customer.setCustomerCode(request.customerCode().trim());
        customer.setCustomerName(request.customerName().trim());
        customer.setGstNumber(normalizeOptional(request.gstNumber()));
        return mapper.toView(repository.save(customer));
    }

    public void delete(long id) {
        repository.delete(find(id));
    }

    private Customer find(long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer " + id + " was not found."));
    }

    private void ensureUnique(CustomerRequest request, Long currentId) {
        repository.findByCustomerCodeIgnoreCase(request.customerCode().trim())
            .filter(customer -> currentId == null || !currentId.equals(customer.getId()))
                .ifPresent(customer -> { throw new ConflictException("Customer code is already in use."); });
        if (request.gstNumber() != null && !request.gstNumber().isBlank()) {
            String gstNumber = request.gstNumber().trim();
            boolean exists = currentId == null
                ? repository.existsByGstNumberIgnoreCase(gstNumber)
                : repository.existsByGstNumberIgnoreCaseAndIdNot(gstNumber, currentId);
            if (exists) {
            throw new ConflictException("GST number is already in use.");
            }
        }
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
