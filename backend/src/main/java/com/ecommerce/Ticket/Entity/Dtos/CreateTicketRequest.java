package com.ecommerce.Ticket.Entity.Dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTicketRequest(
        @NotBlank @Size(max = 120) String subject,
        @NotBlank @Size(max = 60)  String category,
        @NotBlank @Size(max = 4000) String message
) {}
