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
    // Retorna todos os pedidos do usuário logado, ordenados do mais recente
    public List<OrderResponse> getMyOrders() {
        User user = getCurrentUser();
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toResponse).toList();
    }

    // ── DETALHE DE UM PEDIDO ──────────────────────────────────────
    // Retorna um pedido específico — verifica que o pedido pertence ao usuário logado
    // findByIdAndUserId impede que um usuário acesse pedidos de outro
    public OrderResponse getMyOrderById(UUID id) {
        User user = getCurrentUser();
        Order order = orderRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));
        return toResponse(order);
    }

    // ── CANCELAR PEDIDO ───────────────────────────────────────────
    // O cliente só pode cancelar se o status ainda for PENDING_PAYMENT
    // Pedidos já pagos, em separação ou enviados não podem ser cancelados pelo cliente
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
    // Retorna todos os pedidos do sistema, do mais recente ao mais antigo
    // Apenas ADMIN e MASTER têm acesso (controlado no SecurityConfig)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    // ── ADMIN: DETALHE DE QUALQUER PEDIDO ─────────────────────────
    // Retorna um pedido pelo ID sem verificar ownership (admin pode ver qualquer pedido)
    public OrderResponse getOrderById(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));
        return toResponse(order);
    }

    // ── ADMIN: ATUALIZAR STATUS ───────────────────────────────────
    // Altera o status de um pedido (ex: PAID → PREPARING → SHIPPED → DELIVERED)
    // Para adicionar validações de transição de status, implemente aqui
    public OrderResponse updateOrderStatus(UUID id, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));
        order.setStatus(request.status());
        return toResponse(orderRepository.save(order));
    }

    // ── MAPEAMENTO ────────────────────────────────────────────────
    // Converte a entidade Order (banco) para OrderResponse (JSON de resposta)
    // Esse padrão (DTO) evita expor campos internos como senha ou IDs internos
    private OrderResponse toResponse(Order order) {
        // Mapeia cada item do pedido para o DTO de resposta
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
                order.getUser().getEmail(), // e-mail do cliente (não o objeto User completo)
                order.getStatus(),
                order.getPaymentMethod(),
                order.getTotalAmount(),
                order.getTrackingCode(),    // código de rastreio (pode ser null)
                order.getDeliveryAddress(),
                items,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
