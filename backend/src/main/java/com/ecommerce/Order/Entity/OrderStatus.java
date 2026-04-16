// ─────────────────────────────────────────────────────────────────
// OrderStatus.java — Enum que representa os possíveis status de um pedido
//
// Define o ciclo de vida de um pedido desde a criação até a entrega
// ou cancelamento. Armazenado como STRING no banco de dados via
// @Enumerated(EnumType.STRING) na entidade Order.
//
// Fluxo típico de status:
//   PENDING_PAYMENT → PAID → PREPARING → SHIPPED → DELIVERED
//                                    ↘ CANCELLED (a qualquer momento antes de DELIVERED)
//
// Para adicionar um novo status (ex.: RETURNED):
//   1. Insira o valor aqui
//   2. Atualize a lógica de transição de status em OrderService (se houver)
//   3. Comunique o frontend sobre o novo valor possível
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Order.Entity;

public enum OrderStatus {
    // Pedido criado, aguardando confirmação do pagamento
    PENDING_PAYMENT,

    // Pagamento confirmado — o pedido pode seguir para preparação
    PAID,

    // Pedido em preparação/separação no estoque
    PREPARING,

    // Pedido enviado para entrega — código de rastreio disponível
    SHIPPED,

    // Pedido entregue ao cliente — status final positivo
    DELIVERED,

    // Pedido cancelado — status final negativo
    CANCELLED
}
