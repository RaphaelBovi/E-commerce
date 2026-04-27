package com.ecommerce.Cart;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface AbandonedCartRepository extends JpaRepository<AbandonedCart, UUID> {

    // Carts abandoned for more than `since` that haven't had a recovery email sent yet
    @Query("SELECT c FROM AbandonedCart c WHERE c.updatedAt < :since AND c.emailSentAt IS NULL")
    List<AbandonedCart> findAbandoned(@Param("since") Instant since);
}
