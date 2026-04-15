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
import com.ecommerce.Order.Service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

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

    // ─────────────────────────────────────────────────────────────
    // ENDPOINTS ADMIN (ADMIN / MASTER)
    // Protegidos no SecurityConfig — clientes recebem 403 Forbidden
    // ─────────────────────────────────────────────────────────────

    // GET /api/orders
    // Retorna todos os pedidos do sistema (usado pelo dashboard admin)
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
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
}
