package com.brickworks.order;

import com.brickworks.invoice.Invoice;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    boolean existsByOrderNumber(String orderNumber);

    @Query("""
            select distinct o from SalesOrder o
            where lower(o.orderNumber) like lower(concat('%', :term, '%'))
                or lower(o.customer.customerName) like lower(concat('%', :term, '%'))
            """)
    Page<SalesOrder> search(@Param("term") String term, Pageable pageable);

    @Query("""
            select o from SalesOrder o
            where o.status <> com.brickworks.order.OrderStatus.DRAFT
              and o.status <> com.brickworks.order.OrderStatus.CANCELLED
              and not exists (select i.id from Invoice i where i.order.id = o.id)
            """)
    @EntityGraph(attributePaths = {"customer", "items", "items.product"})
    Page<SalesOrder> findEligibleForInvoicing(Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"customer", "items", "items.product"})
    @Query("select o from SalesOrder o where o.id = :id")
    java.util.Optional<SalesOrder> findByIdForUpdate(@Param("id") Long id);

    @Override
    @EntityGraph(attributePaths = {"customer", "items", "items.product"})
    java.util.Optional<SalesOrder> findById(Long id);
}
