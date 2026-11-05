package com.brickworks.production;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductionEntryRepository extends JpaRepository<ProductionEntry, Long> {
    @EntityGraph(attributePaths = "product")
    @Query("select p from ProductionEntry p where (:productId is null or p.product.id = :productId)")
    Page<ProductionEntry> search(@Param("productId") Long productId, Pageable pageable);
}
