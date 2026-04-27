package com.ecommerce.Return;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ReturnRequestRepository extends JpaRepository<ReturnRequest, UUID> {
    List<ReturnRequest> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<ReturnRequest> findAllByOrderByCreatedAtDesc();
    boolean existsByOrderId(UUID orderId);
}
