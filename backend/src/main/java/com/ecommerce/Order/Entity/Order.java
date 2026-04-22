// ─────────────────────────────────────────────────────────────────
// Order.java — Entidade JPA que representa um pedido no sistema
//
// Mapeada para a tabela "orders" no banco de dados.
// Um pedido pertence a um usuário (User) e contém uma lista de itens
// (OrderItem). O relacionamento com OrderItem usa CascadeType.ALL e
// orphanRemoval=true, garantindo que os itens sejam criados e excluídos
// automaticamente junto com o pedido.
//
// Lombok (@Data, @Builder, @NoArgsConstructor, @AllArgsConstructor)
// elimina boilerplate de getters, setters, construtores e equals/hashCode.
//
// Para adicionar novos campos ao pedido (ex.: número de rastreio detalhado):
//   1. Declare o campo aqui com as anotações JPA necessárias
//   2. Inclua-o em CreateOrderRequest e/ou OrderResponse conforme necessário
//   3. Atualize OrderService para preencher o novo campo
//   4. Gere ou aplique a migration de banco correspondente
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Order.Entity;

import com.ecommerce.Auth.Entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

// @Entity — marca esta classe como entidade JPA mapeada para uma tabela do banco
@Entity
// @Table(name = "orders") — nome da tabela; "orders" evita conflito com a palavra reservada ORDER do SQL
@Table(name = "orders")
// @Data — Lombok gera: getters, setters, toString, equals e hashCode para todos os campos
@Data
// @Builder — Lombok permite construir instâncias com o padrão builder (Order.builder().campo(v).build())
@Builder
// @NoArgsConstructor — construtor sem argumentos exigido pelo JPA
@NoArgsConstructor
// @AllArgsConstructor — construtor com todos os campos exigido pelo @Builder
@AllArgsConstructor
public class Order {

    // Chave primária do pedido — UUID gerado automaticamente pelo banco
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Referência ao usuário que realizou o pedido.
    // @ManyToOne — muitos pedidos podem pertencer a um único usuário
    // FetchType.LAZY — o usuário só é carregado do banco quando acessado (evita N+1 query)
    // @JoinColumn(name = "user_id") — coluna de FK na tabela orders referenciando a tabela de usuários
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Status atual do pedido — armazenado como texto (ex.: "PENDING_PAYMENT", "DELIVERED")
    // @Enumerated(EnumType.STRING) — persiste o nome do enum, não o ordinal, tornando o banco legível
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    // Método de pagamento selecionado pelo cliente (PIX, CREDIT_CARD, etc.)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    // Valor total do pedido calculado a partir da soma dos itens (quantidade × preço unitário)
    // precision=10, scale=2 → até 99.999.999,99 com 2 casas decimais
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    // Código de rastreio da entrega — opcional, preenchido quando o pedido é enviado (status SHIPPED)
    private String trackingCode;

    // Endereço de entrega informado pelo cliente no momento do pedido
    // @Column(columnDefinition = "TEXT") — permite endereços longos
    @Column(columnDefinition = "TEXT")
    private String deliveryAddress;

    // Lista de itens que compõem o pedido.
    // @OneToMany(mappedBy = "order") — OrderItem possui a FK; "order" é o campo em OrderItem
    // CascadeType.ALL — operações (persist, merge, remove) propagam para os itens automaticamente
    // orphanRemoval = true — itens removidos da lista são automaticamente excluídos do banco
    // @Builder.Default — garante que o builder inicialize o campo com ArrayList vazio (não null)
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    // Data e hora de criação do pedido — preenchida automaticamente pelo Hibernate na inserção
    // @CreationTimestamp — equivalente ao @PrePersist, mas gerenciado pelo Hibernate
    // updatable = false — nunca alterado após a criação
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    // Data e hora da última atualização — atualizada automaticamente pelo Hibernate a cada modificação
    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

    // ID da cobrança gerada no PagSeguro — preenchido após processamento do pagamento
    @Column
    private String pagseguroChargeId;
}
