package com.brickworks.invoice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    @EntityGraph(attributePaths = {"customer", "order"})
    @Query("""
            select i from Invoice i
            where lower(i.invoiceNumber) like lower(concat('%', :term, '%'))
                or lower(i.order.orderNumber) like lower(concat('%', :term, '%'))
                or lower(i.customer.customerName) like lower(concat('%', :term, '%'))
            """)
    Page<Invoice> search(@Param("term") String term, Pageable pageable);
}
