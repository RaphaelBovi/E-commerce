package com.ecommerce.Shipping.Dto;

import java.math.BigDecimal;

public record FreightOption(String carrier, String service, BigDecimal price, Integer deliveryDays) {}
