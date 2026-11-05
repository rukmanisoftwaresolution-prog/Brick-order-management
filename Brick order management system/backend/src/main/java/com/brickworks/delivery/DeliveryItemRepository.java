package com.brickworks.delivery;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeliveryItemRepository extends JpaRepository<DeliveryItem, Long> {
    @Query("select coalesce(sum(di.quantity), 0) from DeliveryItem di where di.orderItem.id = :orderItemId and di.delivery.status <> :returned")
    long sumActiveDeliveredQuantity(@Param("orderItemId") Long orderItemId, @Param("returned") DeliveryStatus returned);
}
