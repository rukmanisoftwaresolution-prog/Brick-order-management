package com.brickworks.product;

import com.brickworks.common.ConflictException;
import com.brickworks.common.ResourceNotFoundException;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class InventoryService {
    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final ProductRepository productRepository;

    public InventoryService(InventoryRepository inventoryRepository, InventoryTransactionRepository transactionRepository,
                            ProductRepository productRepository) {
        this.inventoryRepository = inventoryRepository;
        this.transactionRepository = transactionRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public Page<InventoryView> list(Pageable pageable) {
        return inventoryRepository.findAll(pageable).map(this::toView);
    }

    public InventoryView adjust(InventoryAdjustmentRequest request) {
        if (request.transactionType() == InventoryTransactionType.PRODUCTION) {
            throw new ConflictException("Production transactions are created from production entries.");
        }
        Product product = productRepository.findById(request.productId())
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Active product " + request.productId() + " was not found."));
        Inventory inventory = getOrCreate(product);
        long quantity = request.quantity();
        switch (request.transactionType()) {
            case RECEIPT, STOCKTAKE_INCREASE -> inventory.setAvailableStock(Math.addExact(inventory.getAvailableStock(), quantity));
            case DAMAGE -> {
                requireAvailable(inventory, quantity);
                inventory.setAvailableStock(inventory.getAvailableStock() - quantity);
                inventory.setDamagedStock(Math.addExact(inventory.getDamagedStock(), quantity));
            }
            case STOCKTAKE_DECREASE -> {
                requireAvailable(inventory, quantity);
                inventory.setAvailableStock(inventory.getAvailableStock() - quantity);
            }
            default -> throw new ConflictException("Unsupported inventory adjustment type.");
        }
        inventoryRepository.save(inventory);
        transactionRepository.save(new InventoryTransaction(product, request.transactionType(), quantity,
                "ADJUSTMENT", null, request.remarks()));
        return toView(inventory);
    }

    public void initializeProduct(Product product) {
        Inventory inventory = inventoryRepository.findByProductIdForUpdate(product.getId())
                .orElseGet(() -> inventoryRepository.save(new Inventory(product, product.getOpeningStock())));
        if (product.getOpeningStock() > 0) {
            transactionRepository.save(new InventoryTransaction(product, InventoryTransactionType.OPENING_BALANCE,
                    product.getOpeningStock(), "PRODUCT", product.getId(), "Product opening stock"));
        }
    }

    public void addProduction(Product product, long acceptedQuantity, Long productionEntryId) {
        if (acceptedQuantity <= 0) return;
        Inventory inventory = getOrCreate(product);
        inventory.setAvailableStock(Math.addExact(inventory.getAvailableStock(), acceptedQuantity));
        inventoryRepository.save(inventory);
        transactionRepository.save(new InventoryTransaction(product, InventoryTransactionType.PRODUCTION,
                acceptedQuantity, "PRODUCTION_ENTRY", productionEntryId, "Accepted production output"));
    }

    private Inventory getOrCreate(Product product) {
        return inventoryRepository.findByProductIdForUpdate(product.getId())
                .orElseGet(() -> inventoryRepository.save(new Inventory(product, product.getOpeningStock())));
    }

    private void requireAvailable(Inventory inventory, long quantity) {
        if (inventory.getAvailableStock() < quantity) {
            throw new ConflictException("Adjustment quantity exceeds available stock.");
        }
    }

    private InventoryView toView(Inventory inventory) {
        Product product = inventory.getProduct();
        return new InventoryView(product.getId(), product.getProductCode(), product.getProductName(),
                inventory.getAvailableStock(), inventory.getReservedStock(), inventory.getDamagedStock(),
                inventory.getDeliveredStock(), inventory.getUpdatedAt());
    }
}
