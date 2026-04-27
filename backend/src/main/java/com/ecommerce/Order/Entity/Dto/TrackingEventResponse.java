package com.ecommerce.Order.Entity.Dto;

public record TrackingEventResponse(
        String status,
        String description,
        String location,
        String occurredAt
) {}
