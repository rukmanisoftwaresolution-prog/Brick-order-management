package com.brickworks.production;

import com.brickworks.common.ConflictException;
import com.brickworks.common.ResourceNotFoundException;
import com.brickworks.product.InventoryService;
import com.brickworks.product.Product;
import com.brickworks.product.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProductionService {
    private final ProductionEntryRepository entries;
    private final ProductRepository products;
    private final InventoryService inventory;

    public ProductionService(ProductionEntryRepository entries, ProductRepository products, InventoryService inventory) {
        this.entries = entries;
        this.products = products;
        this.inventory = inventory;
    }

    @Transactional(readOnly = true)
    public Page<ProductionView> list(Long productId, Pageable pageable) {
        return entries.search(productId, pageable).map(this::toView);
    }

    public ProductionView create(ProductionRequest request) {
        Product product = products.findById(request.productId())
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Active product " + request.productId() + " was not found."));
        if (request.rejectedQuantity() > request.actualQuantity()) {
            throw new ConflictException("Rejected quantity cannot exceed actual production.");
        }
        ProductionEntry entry = new ProductionEntry();
        entry.setProduct(product);
        entry.setProductionDate(request.productionDate());
        entry.setTargetQuantity(request.targetQuantity());
        entry.setActualQuantity(request.actualQuantity());
        entry.setRejectedQuantity(request.rejectedQuantity());
        entry.setRawMaterialConsumption(request.rawMaterialConsumption());
        entry.setKilnName(request.kilnName());
        entry.setMachineName(request.machineName());
        entry.setRemarks(request.remarks());
        ProductionEntry saved = entries.save(entry);
        inventory.addProduction(product, request.actualQuantity() - request.rejectedQuantity(), saved.getId());
        return toView(saved);
    }

    private ProductionView toView(ProductionEntry entry) {
        return new ProductionView(entry.getId(), entry.getProduct().getId(), entry.getProduct().getProductCode(),
                entry.getProduct().getProductName(), entry.getProductionDate(), entry.getTargetQuantity(),
                entry.getActualQuantity(), entry.getRejectedQuantity(), entry.getActualQuantity() - entry.getRejectedQuantity(),
                entry.getRawMaterialConsumption(), entry.getKilnName(), entry.getMachineName(), entry.getRemarks());
    }
}
