package com.ecommerce.Return;

import java.time.Instant;
import java.util.UUID;

public record ReturnDto(
        UUID id,
        UUID orderId,
        UUID userId,
        ReturnReason reason,
        String itemsJson,
        ReturnStatus status,
        String adminNotes,
        Instant createdAt
) {
    public static ReturnDto from(ReturnRequest r) {
        return new ReturnDto(r.getId(), r.getOrderId(), r.getUserId(), r.getReason(),
                r.getItemsJson(), r.getStatus(), r.getAdminNotes(), r.getCreatedAt());
    }
}
