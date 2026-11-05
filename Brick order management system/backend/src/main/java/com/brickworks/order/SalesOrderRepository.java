package com.brickworks.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
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

    @Override
    @EntityGraph(attributePaths = {"customer", "items", "items.product"})
    java.util.Optional<SalesOrder> findById(Long id);
}
