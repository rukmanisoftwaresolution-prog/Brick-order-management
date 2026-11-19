package com.brickworks.invoice;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    boolean existsByOrderId(Long orderId);

    java.util.Optional<Invoice> findByOrderId(Long orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Invoice i where i.id = :id")
    java.util.Optional<Invoice> findByIdForUpdate(@Param("id") Long id);

    @EntityGraph(attributePaths = {"customer", "order"})
    @Query("""
            select i from Invoice i
            where lower(i.invoiceNumber) like lower(concat('%', :term, '%'))
                or lower(i.order.orderNumber) like lower(concat('%', :term, '%'))
                or lower(i.customer.customerName) like lower(concat('%', :term, '%'))
            """)
    Page<Invoice> search(@Param("term") String term, Pageable pageable);

    @EntityGraph(attributePaths = {"customer", "order"})
    @Query("""
            select i from Invoice i
            where (
                lower(i.invoiceNumber) like lower(concat('%', :term, '%'))
                or lower(i.order.orderNumber) like lower(concat('%', :term, '%'))
                or lower(i.customer.customerName) like lower(concat('%', :term, '%'))
            )
            and (:customerId is null or i.customer.id = :customerId)
            and (:openOnly = false or i.invoiceAmount > (
                select coalesce(sum(p.amount), 0) from Payment p
                where p.invoice = i
                  and p.paymentStatus = com.brickworks.payment.PaymentStatus.SUCCESSFUL
            ))
            """)
    Page<Invoice> search(@Param("term") String term, @Param("customerId") Long customerId,
                         @Param("openOnly") boolean openOnly, Pageable pageable);
}
