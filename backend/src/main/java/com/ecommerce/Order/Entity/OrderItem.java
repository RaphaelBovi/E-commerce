// ─────────────────────────────────────────────────────────────────
// OrderItem.java — Entidade JPA que representa um item dentro de um pedido
//
// Mapeada para a tabela "order_items". Cada registro representa
// um produto específico adicionado a um pedido, com o preço unitário
// fixado no momento da compra e a quantidade solicitada.
//
// Decisão de design: o preço unitário é armazenado no item (e não
// referenciado do produto) para preservar o histórico de preços —
// se o preço do produto mudar no futuro, pedidos antigos mantêm
// o valor correto que foi cobrado.
//
// Da mesma forma, productName e productImage são copiados do produto
// no momento do pedido, garantindo que o histórico seja consistente
// mesmo que o produto seja editado ou excluído posteriormente.
//
// Para adicionar campos extras ao item (ex.: desconto aplicado):
//   1. Declare o campo aqui com as anotações JPA necessárias
//   2. Adicione-o em OrderItemRequest e OrderItemResponse
//   3. Mapeie-o em OrderService ao construir o OrderItem
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Order.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

// @Entity — entidade JPA mapeada para a tabela "order_items"
@Entity
@Table(name = "order_items")
// @Data — Lombok gera getters, setters, equals, hashCode e toString
@Data
// @Builder — permite construção via padrão builder
@Builder
// @NoArgsConstructor — exigido pelo JPA
@NoArgsConstructor
// @AllArgsConstructor — exigido pelo @Builder
@AllArgsConstructor
public class OrderItem {

    // Chave primária do item — UUID gerado automaticamente pelo banco
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Referência ao pedido ao qual este item pertence.
    // @ManyToOne(LAZY) — muitos itens podem pertencer a um pedido; carregado sob demanda
    // @JoinColumn(order_id) — FK na tabela order_items apontando para a tabela orders
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // UUID do produto original no catálogo — referência "fraca" (sem FK real),
    // pois o produto pode ser excluído sem invalidar o histórico de pedidos
    private UUID productId;

    // Nome do produto no momento da compra — copiado do catálogo para preservar histórico
    @Column(nullable = false)
    private String productName;

    // URL ou base64 da imagem do produto no momento da compra
    // @Column(columnDefinition = "TEXT") — suporta URLs longas ou base64
    @Column(columnDefinition = "TEXT")
    private String productImage;

    // Preço unitário do produto no momento da compra.
    // Fixado aqui para que variações futuras de preço não afetem pedidos já realizados.
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    // Quantidade do produto solicitada neste item — mínimo 1 (validado em OrderItemRequest)
    @Column(nullable = false)
    private int quantity;

    // Referência à variante selecionada (cor, tamanho, etc.) — null se o produto não tem variantes
    private UUID variantId;

    // Nome da variante no momento da compra (ex.: "M / Azul") — preservado no histórico
    private String variantName;
}
