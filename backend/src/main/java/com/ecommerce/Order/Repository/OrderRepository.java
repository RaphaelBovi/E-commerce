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
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
