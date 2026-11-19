package com.brickworks.delivery;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    boolean existsByDeliveryNumber(String deliveryNumber);

    @Query("select distinct d from Delivery d where lower(d.deliveryNumber) like lower(concat('%', :term, '%')) or lower(d.order.orderNumber) like lower(concat('%', :term, '%'))")
    Page<Delivery> search(@Param("term") String term, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Delivery d where d.id = :id")
    java.util.Optional<Delivery> findByIdForUpdate(@Param("id") Long id);
}
