package com.ecommerce.Order.Entity.Dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record OrderSummaryResponse(
        BigDecimal totalRevenue,
        long totalOrders,
        BigDecimal avgOrderValue,
        Map<String, Long> ordersByStatus,
        List<RevenueByDay> revenueByDay,
        List<TopProduct> topProducts
) {
    public record RevenueByDay(String date, BigDecimal revenue) {}
    public record TopProduct(String productId, String name, long qtySold, BigDecimal revenue) {}
}
