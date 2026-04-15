package com.ecommerce.Order.Service;

import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Repository.UserRepository;
import com.ecommerce.Order.Entity.Dto.*;
import com.ecommerce.Order.Entity.Order;
import com.ecommerce.Order.Entity.OrderItem;
import com.ecommerce.Order.Entity.OrderStatus;
import com.ecommerce.Order.Repository.OrderRepository;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    public OrderResponse createOrder(CreateOrderRequest request) {
        User user = getCurrentUser();

        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING_PAYMENT)
                .paymentMethod(request.paymentMethod())
                .totalAmount(BigDecimal.ZERO)
                .deliveryAddress(request.deliveryAddress())
                .build();

        List<OrderItem> items = request.items().stream().map(i -> OrderItem.builder()
                .order(order)
                .productId(i.productId())
                .productName(i.productName())
                .productImage(i.productImage())
                .unitPrice(i.unitPrice())
                .quantity(i.quantity())
                .build()
        ).toList();

        BigDecimal total = items.stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setTotalAmount(total);
        order.getItems().addAll(items);

        return toResponse(orderRepository.save(order));
    }

    public List<OrderResponse> getMyOrders() {
        User user = getCurrentUser();
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toResponse).toList();
    }

    public OrderResponse getMyOrderById(UUID id) {
        User user = getCurrentUser();
        Order order = orderRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));
        return toResponse(order);
    }

    public OrderResponse cancelOrder(UUID id) {
        User user = getCurrentUser();
        Order order = orderRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BusinessException("Apenas pedidos com pagamento pendente podem ser cancelados");
        }
        order.setStatus(OrderStatus.CANCELLED);
        return toResponse(orderRepository.save(order));
    }

    // ── Admin ──────────────────────────────────────────────

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    public OrderResponse getOrderById(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));
        return toResponse(order);
    }

    public OrderResponse updateOrderStatus(UUID id, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));
        order.setStatus(request.status());
        return toResponse(orderRepository.save(order));
    }

    // ── Mapeamento ─────────────────────────────────────────

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream().map(i ->
                new OrderItemResponse(
                        i.getId(),
                        i.getProductId(),
                        i.getProductName(),
                        i.getProductImage(),
                        i.getUnitPrice(),
                        i.getQuantity()
                )
        ).toList();

        return new OrderResponse(
                order.getId(),
                order.getUser().getEmail(),
                order.getStatus(),
                order.getPaymentMethod(),
                order.getTotalAmount(),
                order.getTrackingCode(),
                order.getDeliveryAddress(),
                items,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
