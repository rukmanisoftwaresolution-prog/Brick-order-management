package com.brickworks.customer;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper
public interface CustomerMapper {
    CustomerView toView(Customer customer);

    @Mapping(target = "outstandingAmount", ignore = true)
    @Mapping(target = "legacyOutstandingAmount", ignore = true)
    void update(CustomerRequest request, @MappingTarget Customer customer);
}
