package com.ecommerce.Order.Service;

// ─────────────────────────────────────────────────────────────────
// OrderService.java — Lógica de negócio dos pedidos
//
// Responsável por:
//   • Criar pedidos a partir do carrinho do cliente
//   • Listar e cancelar pedidos do usuário logado
//   • Disponibilizar todos os pedidos para o painel admin
//   • Atualizar o status de um pedido (função exclusiva de admin)
// ─────────────────────────────────────────────────────────────────

import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Repository.UserRepository;
import com.ecommerce.Auth.Service.EmailService;
import com.ecommerce.Order.Entity.Dto.*;
import com.ecommerce.Order.Entity.Order;
import com.ecommerce.Order.Entity.OrderItem;
import com.ecommerce.Order.Entity.OrderStatus;
import com.ecommerce.Order.Repository.OrderRepository;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import com.ecommerce.Product.Repository.ProductCategoryRepository;
import com.ecommerce.Shipping.MelhorEnvioTrackingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductCategoryRepository productCategoryRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private MelhorEnvioTrackingService trackingService;

    // ── UTILITÁRIO INTERNO ────────────────────────────────────────
    // Recupera o usuário autenticado a partir do contexto de segurança do Spring
    // O JWT já foi validado pelo filtro antes de chegar aqui
    // O SecurityContextHolder armazena o e-mail do usuário logado
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    // ── CRIAR PEDIDO ──────────────────────────────────────────────
    // Chamado pelo cliente ao finalizar a compra
    // Recebe: método de pagamento, endereço e lista de itens do carrinho
    // O total é calculado aqui no backend (nunca confiar no total enviado pelo frontend)
    public OrderResponse createOrder(CreateOrderRequest request) {
        User user = getCurrentUser();

        // Cria o pedido base com status inicial PENDING_PAYMENT (aguardando pagamento)
        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING_PAYMENT)
                .paymentMethod(request.paymentMethod())
                .totalAmount(BigDecimal.ZERO) // calculado abaixo
                .deliveryAddress(request.deliveryAddress())
                .build();

        // Converte cada item do request em um OrderItem
        // Snapshot: salva nome, imagem e preço atual do produto — protege contra alterações futuras
        List<OrderItem> items = request.items().stream().map(i -> OrderItem.builder()
                .order(order)            // vincula ao pedido pai
                .productId(i.productId())
                .productName(i.productName())
                .productImage(i.productImage())
                .unitPrice(i.unitPrice())
                .quantity(i.quantity())
                .build()
        ).toList();

        // Calcula o total somando (preço unitário × quantidade) de cada item
        BigDecimal total = items.stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Atualiza o total no pedido e adiciona os itens (cascade ALL salva automaticamente)
        order.setTotalAmount(total);
        order.getItems().addAll(items);

        return toResponse(orderRepository.save(order));
    }

    // ── MEUS PEDIDOS ──────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders() {
        User user = getCurrentUser();
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toResponse).toList();
    }

    // ── DETALHE DE UM PEDIDO ──────────────────────────────────────
    @Transactional(readOnly = true)
    public OrderResponse getMyOrderById(UUID id) {
        User user = getCurrentUser();
        Order order = orderRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));
        return toResponse(order);
    }

    // ── CANCELAR PEDIDO ───────────────────────────────────────────
    // O cliente só pode cancelar se o status ainda for PENDING_PAYMENT
    @Transactional
    public OrderResponse cancelOrder(UUID id) {
        User user = getCurrentUser();
        Order order = orderRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));

        // Regra de negócio: só cancela se ainda não foi pago
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BusinessException("Apenas pedidos com pagamento pendente podem ser cancelados");
        }

        order.setStatus(OrderStatus.CANCELLED);
        return toResponse(orderRepository.save(order));
    }

    // ── ADMIN: TODOS OS PEDIDOS ───────────────────────────────────
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    // ── ADMIN: PEDIDOS PAGINADOS ──────────────────────────────────
    // emailPattern é pré-formatado com % aqui para simplificar a query JPQL
    // e evitar uso de CONCAT no lado do banco (problemático no Hibernate 6).
    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrdersPaginated(int page, int size, OrderStatus status, String email) {
        String emailPattern = (email != null && !email.isBlank())
                ? "%" + email.trim().toLowerCase() + "%"
                : null;
        return orderRepository.findAllFiltered(status, emailPattern, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ── ADMIN: DETALHE DE QUALQUER PEDIDO ─────────────────────────
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));
        return toResponse(order);
    }

    // ── ADMIN: ATUALIZAR STATUS ───────────────────────────────────
    // Altera o status de um pedido (ex: PAID → PREPARING → SHIPPED → DELIVERED)
    // Restaura estoque automaticamente ao cancelar pedidos já pagos ou em preparo
    @Transactional
    public OrderResponse updateOrderStatus(UUID id, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(request.status());

        if (request.status() == OrderStatus.SHIPPED) {
            if (request.trackingCode() != null) order.setTrackingCode(request.trackingCode());
            if (request.trackingUrl() != null) order.setTrackingUrl(request.trackingUrl());
        }

        if (request.status() == OrderStatus.CANCELLED
                && (previousStatus == OrderStatus.PAID || previousStatus == OrderStatus.PREPARING)) {
            restoreOrderStock(order.getItems());
        }

        Order saved = orderRepository.save(order);

        if (request.status() == OrderStatus.SHIPPED || request.status() == OrderStatus.DELIVERED
                || request.status() == OrderStatus.CANCELLED) {
            try { emailService.sendStatusUpdate(saved); } catch (Exception e) {
                log.warn("Falha ao enviar e-mail de status: {}", e.getMessage());
            }
        }

        return toResponse(saved);
    }

    private void restoreOrderStock(List<OrderItem> items) {
        for (OrderItem item : items) {
            if (item.getProductId() == null) continue;
            productCategoryRepository.findById(item.getProductId()).ifPresent(product -> {
                product.incrementStock(item.getQuantity());
                productCategoryRepository.save(product);
            });
        }
    }

    // ── RASTREIO VIA MELHOR ENVIO ─────────────────────────────────
    @Transactional(readOnly = true)
    public List<TrackingEventResponse> getOrderTracking(UUID id) {
        User user = getCurrentUser();
        Order order = orderRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));
        if (order.getTrackingCode() == null || order.getTrackingCode().isBlank()) {
            return List.of();
        }
        return trackingService.getTrackingEvents(order.getTrackingCode());
    }

    // ── RELATÓRIO GERENCIAL ───────────────────────────────────────
    @Transactional(readOnly = true)
    public OrderSummaryResponse getAdminSummary(LocalDate from, LocalDate to) {
        var fromInstant = from.atStartOfDay(ZoneOffset.UTC).toInstant();
        var toInstant   = to.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();

        // Receita, total de pedidos e ticket médio
        Object[] rev = orderRepository.findRevenueSummary(fromInstant, toInstant);
        BigDecimal totalRevenue   = (BigDecimal) rev[0];
        long       totalOrders    = ((Number) rev[1]).longValue();
        BigDecimal avgOrderValue  = (BigDecimal) rev[2];

        // Contagem por status
        Map<String, Long> ordersByStatus = orderRepository
                .countByStatusInRange(fromInstant, toInstant)
                .stream()
                .collect(Collectors.toMap(
                        r -> (String) r[0],
                        r -> ((Number) r[1]).longValue(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        // Receita por dia
        List<OrderSummaryResponse.RevenueByDay> revenueByDay = orderRepository
                .findRevenueByDay(fromInstant, toInstant)
                .stream()
                .map(r -> new OrderSummaryResponse.RevenueByDay((String) r[0], (BigDecimal) r[1]))
                .toList();

        // Top produtos
        List<OrderSummaryResponse.TopProduct> topProducts = orderRepository
                .findTopProducts(fromInstant, toInstant)
                .stream()
                .map(r -> new OrderSummaryResponse.TopProduct(
                        r[0] != null ? r[0].toString() : null,
                        (String) r[1],
                        ((Number) r[2]).longValue(),
                        (BigDecimal) r[3]
                ))
                .toList();

        return new OrderSummaryResponse(totalRevenue, totalOrders, avgOrderValue,
                ordersByStatus, revenueByDay, topProducts);
    }

    // ── MAPEAMENTO ────────────────────────────────────────────────
    // Suporta pedidos de convidados (user == null): usa guestEmail como fallback
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

        String email = order.getUser() != null
                ? order.getUser().getEmail()
                : order.getGuestEmail();

        return new OrderResponse(
                order.getId(),
                email,
                order.getStatus(),
                order.getPaymentMethod(),
                order.getTotalAmount(),
                order.getTrackingCode(),
                order.getTrackingUrl(),
                order.getDeliveryAddress(),
                items,
                order.getCreatedAt(),
                order.getUpdatedAt(),
                order.getExpiresAt()
        );
    }
}
