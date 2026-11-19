package com.brickworks.payment;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    @EntityGraph(attributePaths = {"customer", "order", "invoice"})
    List<Payment> findByCustomer_IdOrderByCreatedAtDescIdDesc(Long customerId);

    @EntityGraph(attributePaths = {"customer", "order", "invoice"})
    @Query("select p from Payment p where lower(p.customer.customerName) like lower(concat('%', :term, '%')) or lower(coalesce(p.referenceNumber, '')) like lower(concat('%', :term, '%'))")
    Page<Payment> search(@Param("term") String term, Pageable pageable);

    @Query("select coalesce(sum(p.amount), 0) from Payment p where p.order.id = :orderId")
    BigDecimal totalForOrder(@Param("orderId") Long orderId);

    @Query("""
            select coalesce(sum(p.amount), 0) from Payment p
            where p.order.id = :orderId
              and p.paymentStatus = com.brickworks.payment.PaymentStatus.SUCCESSFUL
            """)
    BigDecimal totalSuccessfulForOrder(@Param("orderId") Long orderId);

    @Query("""
            select coalesce(sum(p.amount), 0) from Payment p
            where p.invoice.id = :invoiceId
              and p.paymentStatus = com.brickworks.payment.PaymentStatus.SUCCESSFUL
            """)
    BigDecimal totalSuccessfulForInvoice(@Param("invoiceId") Long invoiceId);

    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    Optional<Payment> findByDeduplicationKey(String deduplicationKey);

    @Query("""
            select count(p) > 0 from Payment p
            where p.paymentType = :paymentType
              and upper(trim(p.referenceNumber)) = :normalizedReference
            """)
    boolean existsByNormalizedReference(@Param("paymentType") PaymentType paymentType,
                                        @Param("normalizedReference") String normalizedReference);
}
