package com.brickworks.order;

import com.brickworks.common.ConflictException;
import com.brickworks.common.ResourceNotFoundException;
import com.brickworks.customer.Customer;
import com.brickworks.customer.CustomerRepository;
import com.brickworks.product.Product;
import com.brickworks.product.ProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SalesOrderService {
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private final SalesOrderRepository orders;
    private final CustomerRepository customers;
    private final ProductRepository products;

    public SalesOrderService(SalesOrderRepository orders, CustomerRepository customers, ProductRepository products) {
        this.orders = orders;
        this.customers = customers;
        this.products = products;
    }

    @Transactional(readOnly = true)
    public Page<OrderView> search(String term, Pageable pageable) {
        return orders.search(term == null ? "" : term.trim(), pageable).map(this::toView);
    }

    @Transactional(readOnly = true)
    public OrderView get(long id) {
        return toView(orders.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + id + " was not found.")));
    }

    public OrderView create(OrderRequest request) {
        Customer customer = customers.findById(request.customerId())
                .filter(Customer::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Active customer " + request.customerId() + " was not found."));
        SalesOrder order = new SalesOrder();
        order.setOrderNumber(nextOrderNumber());
        order.setCustomer(customer);
        order.setOrderDate(LocalDate.now());
        order.setRequiredDeliveryDate(request.requiredDeliveryDate());
        order.setDeliveryAddress(request.deliveryAddress().trim());
        order.setTransportationMode(request.transportationMode());
        order.setRemarks(request.remarks());
        order.setStatus(OrderStatus.DRAFT);

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discounts = BigDecimal.ZERO;
        BigDecimal taxes = BigDecimal.ZERO;
        for (OrderItemRequest itemRequest : request.items()) {
            Product product = products.findById(itemRequest.productId())
                    .filter(Product::isActive)
                    .orElseThrow(() -> new ResourceNotFoundException("Active product " + itemRequest.productId() + " was not found."));
            BigDecimal gross = itemRequest.rate().multiply(BigDecimal.valueOf(itemRequest.quantity()));
            if (itemRequest.discount().compareTo(gross) > 0) {
                throw new ConflictException("An item discount cannot exceed its line value.");
            }
            BigDecimal taxable = gross.subtract(itemRequest.discount());
            BigDecimal tax = taxable.multiply(product.getGstPercentage()).divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP);
            SalesOrderItem item = new SalesOrderItem();
            item.setProduct(product);
            item.setQuantity(itemRequest.quantity());
            item.setRate(itemRequest.rate());
            item.setDiscount(itemRequest.discount());
            item.setGstPercentage(product.getGstPercentage());
            item.setAmount(taxable.add(tax));
            order.addItem(item);
            subtotal = subtotal.add(gross);
            discounts = discounts.add(itemRequest.discount());
            taxes = taxes.add(tax);
        }
        order.setSubtotal(subtotal);
        order.setDiscountTotal(discounts);
        order.setTaxTotal(taxes);
        order.setTotalAmount(subtotal.subtract(discounts).add(taxes));
        return toView(orders.save(order));
    }

    public void deleteDraft(long id) {
        SalesOrder order = orders.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + id + " was not found."));
        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new ConflictException("Only draft orders can be deleted.");
        }
        orders.delete(order);
    }

    private String nextOrderNumber() {
        String orderNumber;
        do {
            orderNumber = "BO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (orders.existsByOrderNumber(orderNumber));
        return orderNumber;
    }

    private OrderView toView(SalesOrder order) {
        var lines = order.getItems().stream().map(item -> new OrderView.OrderLineView(
            item.getId(), item.getProduct().getId(), item.getProduct().getProductCode(), item.getProduct().getProductName(),
                item.getQuantity(), item.getRate(), item.getDiscount(), item.getGstPercentage(), item.getAmount())).toList();
        return new OrderView(order.getId(), order.getOrderNumber(), order.getCustomer().getId(),
                order.getCustomer().getCustomerName(), order.getOrderDate(), order.getRequiredDeliveryDate(),
                order.getDeliveryAddress(), order.getTransportationMode(), order.getStatus().name(), order.getSubtotal(),
                order.getDiscountTotal(), order.getTaxTotal(), order.getTotalAmount(), lines);
    }
}
