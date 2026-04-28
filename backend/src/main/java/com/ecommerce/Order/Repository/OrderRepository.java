// ─────────────────────────────────────────────────────────────────
// OrderRepository.java — Repositório JPA para a entidade Order
//
// Fornece operações CRUD padrão (via JpaRepository) e consultas
// customizadas para listar pedidos com ordenação por data de criação
// (mais recente primeiro) e filtrar por usuário.
//
// Todas as queries retornam os pedidos em ordem decrescente de
// criação (OrderByCreatedAtDesc) para exibição mais intuitiva nas
// interfaces (pedidos recentes aparecem primeiro).
//
// Para adicionar novas consultas (ex.: pedidos por status):
//   - Use a convenção Spring Data: findByStatus(OrderStatus status)
//   - Para consultas mais complexas, use @Query com JPQL
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Order.Repository;

import com.ecommerce.Order.Entity.Order;
import com.ecommerce.Order.Entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

// @Repository — marca esta interface como repositório Spring Data,
// ativando tradução de exceções JPA para DataAccessException do Spring
@Repository
// JpaRepository<Order, UUID> — herda CRUD completo para Order com chave UUID
public interface OrderRepository extends JpaRepository<Order, UUID> {

    // Retorna todos os pedidos ordenados da data mais recente para a mais antiga.
    // Usado pelo endpoint administrativo GET /api/orders para listar todos os pedidos do sistema.
    List<Order> findAllByOrderByCreatedAtDesc();

    // Retorna todos os pedidos de um usuário específico, ordenados do mais recente para o mais antigo.
    // Parâmetro: userId — UUID do usuário autenticado
    // Usado pelo endpoint GET /api/orders (cliente) para listar apenas os pedidos do próprio usuário.
    List<Order> findByUserIdOrderByCreatedAtDesc(UUID userId);

    // Busca um pedido pelo ID e pelo ID do usuário simultaneamente.
    // Garante que um cliente só possa acessar seus próprios pedidos (segurança por propriedade).
    // Parâmetro: id     — UUID do pedido
    // Parâmetro: userId — UUID do usuário autenticado
    // Retorno: Optional<Order> — vazio se o pedido não existir ou não pertencer ao usuário
    Optional<Order> findByIdAndUserId(UUID id, UUID userId);

    // Paginação para admin — LEFT JOIN para incluir pedidos de convidados (sem user).
    // countQuery explícita é obrigatória: Hibernate 6 falha ao derivar automaticamente
    // a count query para queries customizadas com JOIN e ORDER BY.
    // O emailPattern deve chegar já formatado com % (ex: "%foo%") pelo service.
    @Query(value = """
        SELECT o FROM Order o LEFT JOIN o.user u
        WHERE (:status IS NULL OR o.status = :status)
          AND (:emailPattern IS NULL OR (u IS NOT NULL AND LOWER(u.email) LIKE :emailPattern))
        ORDER BY o.createdAt DESC
        """,
        countQuery = """
        SELECT COUNT(o) FROM Order o LEFT JOIN o.user u
        WHERE (:status IS NULL OR o.status = :status)
          AND (:emailPattern IS NULL OR (u IS NOT NULL AND LOWER(u.email) LIKE :emailPattern))
        """)
    Page<Order> findAllFiltered(
            @Param("status") OrderStatus status,
            @Param("emailPattern") String emailPattern,
            Pageable pageable);

    // ── Queries para relatório gerencial (A2) ─────────────────────

    // Receita total, total de pedidos e ticket médio para pedidos confirmados
    @Query(value = """
        SELECT COALESCE(SUM(total_amount), 0), COUNT(*), COALESCE(AVG(total_amount), 0)
        FROM orders
        WHERE status IN ('PAID','SHIPPED','PREPARING','DELIVERED')
          AND created_at >= :from AND created_at <= :to
        """, nativeQuery = true)
    Object[] findRevenueSummary(@Param("from") Instant from, @Param("to") Instant to);

    // Contagem de pedidos por status no período
    @Query(value = """
        SELECT status, COUNT(*)
        FROM orders
        WHERE created_at >= :from AND created_at <= :to
        GROUP BY status
        """, nativeQuery = true)
    List<Object[]> countByStatusInRange(@Param("from") Instant from, @Param("to") Instant to);

    // Receita diária (pedidos confirmados) agrupada por dia UTC
    @Query(value = """
        SELECT TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD'), SUM(total_amount)
        FROM orders
        WHERE status IN ('PAID','SHIPPED','PREPARING','DELIVERED')
          AND created_at >= :from AND created_at <= :to
        GROUP BY TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')
        ORDER BY 1
        """, nativeQuery = true)
    List<Object[]> findRevenueByDay(@Param("from") Instant from, @Param("to") Instant to);

    // Top 10 produtos mais vendidos (por quantidade) no período
    @Query(value = """
        SELECT CAST(oi.product_id AS TEXT), oi.product_name,
               SUM(oi.quantity), SUM(oi.unit_price * oi.quantity)
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('PAID','SHIPPED','PREPARING','DELIVERED')
          AND o.created_at >= :from AND o.created_at <= :to
        GROUP BY oi.product_id, oi.product_name
        ORDER BY SUM(oi.quantity) DESC
        LIMIT 10
        """, nativeQuery = true)
    List<Object[]> findTopProducts(@Param("from") Instant from, @Param("to") Instant to);

    // Retorna todos os pedidos PENDING_PAYMENT cujo prazo de pagamento já venceu.
    // O scheduler usa esta query para cancelar automaticamente os pedidos expirados.
    @Query("SELECT o FROM Order o WHERE o.status = com.ecommerce.Order.Entity.OrderStatus.PENDING_PAYMENT AND o.expiresAt IS NOT NULL AND o.expiresAt < :now")
    List<Order> findExpiredPendingPaymentOrders(@Param("now") Instant now);
}
