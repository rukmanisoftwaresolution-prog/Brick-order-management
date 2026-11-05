package com.brickworks.product;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper
public interface ProductMapper {
    ProductView toView(Product product);
    void update(ProductRequest request, @MappingTarget Product product);
}
