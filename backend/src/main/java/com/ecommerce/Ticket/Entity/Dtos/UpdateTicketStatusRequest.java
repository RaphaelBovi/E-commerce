package com.ecommerce.Ticket.Entity.Dtos;

import com.ecommerce.Ticket.Entity.TicketStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTicketStatusRequest(
        @NotNull TicketStatus status
) {}
