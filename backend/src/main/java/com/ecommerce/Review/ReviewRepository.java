package com.ecommerce.Review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByProductIdOrderByCreatedAtDesc(UUID productId);
    boolean existsByUserIdAndProductId(UUID userId, UUID productId);
    Optional<Review> findByUserIdAndProductId(UUID userId, UUID productId);
    List<Review> findAllByOrderByCreatedAtDesc();

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productId = :productId")
    Double avgRatingByProductId(@Param("productId") UUID productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.productId = :productId")
    long countByProductId(@Param("productId") UUID productId);

    // Returns [productId, avgRating, count] rows for all products that have reviews
    @Query("SELECT r.productId, AVG(r.rating), COUNT(r) FROM Review r GROUP BY r.productId")
    List<Object[]> findRatingSummaryForAllProducts();
}
