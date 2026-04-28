package com.ecommerce.Order.Controller;

// ─────────────────────────────────────────────────────────────────
// OrderController.java — Endpoints de pedidos
//
// Rota base: /api/orders
//
// Dois grupos de endpoints:
//   1. Endpoints do CLIENTE (qualquer usuário autenticado)
//      POST   /api/orders           — criar pedido
//      GET    /api/orders/my        — meus pedidos
//      GET    /api/orders/my/{id}   — detalhe de um pedido meu
//      PATCH  /api/orders/my/{id}/cancel — cancelar meu pedido
//
//   2. Endpoints do ADMIN (ADMIN ou MASTER apenas)
//      GET    /api/orders           — todos os pedidos
//      GET    /api/orders/{id}      — qualquer pedido por ID
//      PATCH  /api/orders/{id}/status — atualizar status
// ─────────────────────────────────────────────────────────────────

import com.ecommerce.Order.Entity.Dto.*;
import com.ecommerce.Order.Entity.OrderStatus;
import com.ecommerce.Order.Service.OrderService;
import com.ecommerce.Payment.Dto.CheckoutSessionResponse;
import com.ecommerce.Payment.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private PaymentService paymentService;

    // ─────────────────────────────────────────────────────────────
    // ENDPOINTS DO CLIENTE AUTENTICADO
    // ─────────────────────────────────────────────────────────────

    // POST /api/orders
    // Cria um novo pedido com os itens do carrinho
    // Retorna HTTP 201 (Created) com os dados do pedido criado
    // Para alterar os campos obrigatórios: edite CreateOrderRequest.java
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request));
    }

    // GET /api/orders/my
    // Lista todos os pedidos do usuário logado, do mais recente ao mais antigo
    @GetMapping("/my")
    public ResponseEntity<List<OrderResponse>> getMyOrders() {
        return ResponseEntity.ok(orderService.getMyOrders());
    }

    // GET /api/orders/my/{id}
    // Retorna os detalhes de um pedido específico do usuário logado
    // @PathVariable — captura o {id} da URL e passa para o método
    // Retorna 404 se o pedido não existir ou não pertencer ao usuário
    @GetMapping("/my/{id}")
    public ResponseEntity<OrderResponse> getMyOrderById(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getMyOrderById(id));
    }

    // PATCH /api/orders/my/{id}/cancel
    // Cancela um pedido do usuário — só funciona se o status for PENDING_PAYMENT
    // Para mudar a regra de cancelamento: edite OrderService.cancelOrder()
    @PatchMapping("/my/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }

    // GET /api/orders/my/{id}/tracking
    // Retorna os eventos de rastreio do Melhor Envio para o pedido do usuário logado.
    // Retorna lista vazia se o pedido não tem trackingCode ou o código não foi encontrado.
    @GetMapping("/my/{id}/tracking")
    public ResponseEntity<List<TrackingEventResponse>> getOrderTracking(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrderTracking(id));
    }

    // POST /api/orders/my/{id}/payment-link
    // Gera uma nova URL de pagamento para um pedido PENDING_PAYMENT ainda dentro do prazo.
    // Útil quando o usuário saiu da página do gateway sem concluir o pagamento.
    @PostMapping("/my/{id}/payment-link")
    public ResponseEntity<CheckoutSessionResponse> getPaymentLink(@PathVariable UUID id) {
        return ResponseEntity.ok(paymentService.generatePaymentLink(id));
    }

    // ─────────────────────────────────────────────────────────────
    // ENDPOINTS ADMIN (ADMIN / MASTER)
    // Protegidos no SecurityConfig — clientes recebem 403 Forbidden
    // ─────────────────────────────────────────────────────────────

    // GET /api/orders — todos os pedidos (sem paginação, retrocompatível)
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    // GET /api/orders/paginated?page=0&size=20&status=PAID&email=user@example.com
    @GetMapping("/paginated")
    public ResponseEntity<Page<OrderResponse>> getAllOrdersPaginated(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String email) {
        return ResponseEntity.ok(orderService.getAllOrdersPaginated(page, size, status, email));
    }

    // GET /api/orders/{id}
    // Retorna qualquer pedido pelo ID, sem verificar ownership
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    // PATCH /api/orders/{id}/status
    // Atualiza o status de um pedido (ex: PAID → PREPARING → SHIPPED → DELIVERED)
    // Corpo esperado: { "status": "SHIPPED" }
    // Para ver os valores válidos de status: edite OrderStatus.java
    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request));
    }

    // GET /api/orders/admin/summary?from=2025-01-01&to=2025-12-31
    // Retorna KPIs de receita, pedidos por status, receita por dia e top produtos
    @GetMapping("/admin/summary")
    public ResponseEntity<OrderSummaryResponse> getAdminSummary(
            @RequestParam(defaultValue = "2020-01-01") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(defaultValue = "2099-12-31") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(orderService.getAdminSummary(from, to));
    }
}
