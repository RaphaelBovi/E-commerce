package com.ecommerce.Payment.Dto;

import com.ecommerce.Order.Entity.Dto.OrderItemRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public record CreateCheckoutSessionRequest(

        // Método escolhido: CREDIT_CARD, BOLETO, PIX
        @NotBlank String paymentMethod,

        // Dados do destinatário
        @NotBlank String recipientName,
        String recipientCpf,
        String recipientPhone,
        String recipientPhone2,

        // Endereço de entrega (campos individuais para envio ao PagSeguro)
        @NotBlank String street,
        @NotBlank String streetNumber,
        String complement,
        String neighborhood,
        @NotBlank String city,
        @NotBlank @Size(min = 2, max = 2) String state,
        @NotBlank String zipCode,

        @NotEmpty @Valid List<OrderItemRequest> items
) {}
