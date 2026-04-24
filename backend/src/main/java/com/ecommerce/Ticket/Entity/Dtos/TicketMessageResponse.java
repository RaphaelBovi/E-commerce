package com.ecommerce.Ticket.Entity.Dtos;

import com.ecommerce.Ticket.Entity.TicketMessage;

import java.time.Instant;
import java.util.UUID;

public record TicketMessageResponse(
        UUID id,
        UUID authorId,
        String authorName,
        String authorRole,
        String content,
        Instant createdAt
) {
    public static TicketMessageResponse from(TicketMessage m) {
        return new TicketMessageResponse(
                m.getId(),
                m.getAuthorId(),
                m.getAuthorName(),
                m.getAuthorRole(),
                m.getContent(),
                m.getCreatedAt()
        );
    }
}
