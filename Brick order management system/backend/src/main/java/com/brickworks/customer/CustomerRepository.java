package com.brickworks.customer;

import java.util.Optional;
import java.math.BigDecimal;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    boolean existsByCustomerCodeIgnoreCase(String customerCode);
    boolean existsByGstNumberIgnoreCase(String gstNumber);
    boolean existsByGstNumberIgnoreCaseAndIdNot(String gstNumber, Long id);
    Optional<Customer> findByCustomerCodeIgnoreCase(String customerCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Customer c where c.id = :id")
    Optional<Customer> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            select coalesce(sum(greatest(i.invoiceAmount - (
                select coalesce(sum(p.amount), 0) from Payment p
                where p.invoice = i and p.paymentStatus =
                    com.brickworks.payment.PaymentStatus.SUCCESSFUL
            ), 0)), 0)
            from Invoice i
            where i.customer.id = :customerId
            """)
    BigDecimal totalOpenInvoiceBalance(@Param("customerId") Long customerId);

    @Query("""
            select c from Customer c
          where (lower(c.customerCode) like lower(concat('%', :term, '%'))
                or lower(c.customerName) like lower(concat('%', :term, '%'))
                or lower(c.mobileNumber) like lower(concat('%', :term, '%')))
              and (:active is null or c.active = :active)
            """)
    Page<Customer> search(@Param("term") String term, @Param("active") Boolean active, Pageable pageable);
}
