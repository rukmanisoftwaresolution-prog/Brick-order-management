package com.brickworks.payment;

import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    @EntityGraph(attributePaths = {"customer", "order"})
    @Query("select p from Payment p where lower(p.customer.customerName) like lower(concat('%', :term, '%')) or lower(coalesce(p.referenceNumber, '')) like lower(concat('%', :term, '%'))")
    Page<Payment> search(@Param("term") String term, Pageable pageable);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.order.id = :orderId")
    BigDecimal totalForOrder(@Param("orderId") Long orderId);
}
