package com.brickworks.product;

import com.brickworks.common.ConflictException;
import com.brickworks.common.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProductService {
    private final ProductRepository repository;
    private final ProductMapper mapper;
    private final InventoryService inventory;

    public ProductService(ProductRepository repository, ProductMapper mapper, InventoryService inventory) {
        this.repository = repository;
        this.mapper = mapper;
        this.inventory = inventory;
    }

    @Transactional(readOnly = true)
    public Page<ProductView> search(String term, Boolean active, Pageable pageable) {
        return repository.search(term == null ? "" : term.trim(), active, pageable).map(mapper::toView);
    }

    @Transactional(readOnly = true)
    public ProductView get(long id) {
        return mapper.toView(find(id));
    }

    public ProductView create(ProductRequest request) {
        if (repository.existsByProductCodeIgnoreCase(request.productCode().trim())) {
            throw new ConflictException("Product code is already in use.");
        }
        Product product = new Product();
        mapper.update(request, product);
        product.setProductCode(request.productCode().trim());
        product.setProductName(request.productName().trim());
        Product saved = repository.save(product);
        inventory.initializeProduct(saved);
        return mapper.toView(saved);
    }

    public ProductView update(long id, ProductRequest request) {
        Product product = find(id);
        if (repository.existsByProductCodeIgnoreCase(request.productCode().trim())
                && !product.getProductCode().equalsIgnoreCase(request.productCode().trim())) {
            throw new ConflictException("Product code is already in use.");
        }
        mapper.update(request, product);
        product.setProductCode(request.productCode().trim());
        product.setProductName(request.productName().trim());
        return mapper.toView(repository.save(product));
    }

    public void delete(long id) {
        Product product = find(id);
        product.setActive(false);
        repository.save(product);
    }

    private Product find(long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product " + id + " was not found."));
    }
}
