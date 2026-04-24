package com.ecommerce.Ticket.Entity.Dtos;

import com.ecommerce.Ticket.Entity.Ticket;
import com.ecommerce.Ticket.Entity.TicketStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TicketResponse(
        UUID id,
        String ticketNumber,
        String userEmail,
        String userName,
        String subject,
        String category,
        TicketStatus status,
        List<TicketMessageResponse> messages,
        Instant createdAt,
        Instant updatedAt
) {
    public static TicketResponse from(Ticket t) {
        return new TicketResponse(
                t.getId(),
                t.getTicketNumber(),
                t.getUser().getEmail(),
                t.getUser().getFullName(),
                t.getSubject(),
                t.getCategory(),
                t.getStatus(),
                t.getMessages().stream().map(TicketMessageResponse::from).toList(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
