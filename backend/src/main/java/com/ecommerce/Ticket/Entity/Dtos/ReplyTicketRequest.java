package com.ecommerce.Ticket.Entity.Dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReplyTicketRequest(
        @NotBlank @Size(max = 4000) String message
) {}
