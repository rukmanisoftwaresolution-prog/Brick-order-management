package com.brickworks.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {
    boolean existsByProductCodeIgnoreCase(String productCode);

    @Query("""
            select p from Product p
            where (lower(p.productCode) like lower(concat('%', :term, '%'))
                or lower(p.productName) like lower(concat('%', :term, '%')))
              and (:active is null or p.active = :active)
            """)
    Page<Product> search(@Param("term") String term, @Param("active") Boolean active, Pageable pageable);
}
