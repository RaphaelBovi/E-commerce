package com.ecommerce.Product.Repository;

import com.ecommerce.Product.Entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {
    List<ProductVariant> findByProductIdOrderByNameAsc(UUID productId);
}
