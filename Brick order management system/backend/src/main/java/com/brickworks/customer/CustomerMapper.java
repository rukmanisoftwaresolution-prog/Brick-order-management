package com.brickworks.customer;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper
public interface CustomerMapper {
    CustomerView toView(Customer customer);
    void update(CustomerRequest request, @MappingTarget Customer customer);
}
