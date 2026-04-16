// ─────────────────────────────────────────────────────────────────
// ProductCategoryRepository.java — Repositório JPA para a entidade ProductCategory
//
// Fornece operações CRUD padrão (via JpaRepository) e consultas
// customizadas para manipulação de produtos por código de referência (ref).
//
// O uso de "IgnoreCase" nos métodos garante que buscas e exclusões
// por referência sejam insensíveis a maiúsculas/minúsculas
// (ex.: "CAM-001" e "cam-001" localizam o mesmo produto).
//
// Para adicionar novas consultas:
//   - Use a convenção Spring Data (findBy<Campo>, existsBy<Campo>, etc.)
//   - Para consultas complexas, use @Query com JPQL ou SQL nativo
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Product.Repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.ecommerce.Product.Entity.ProductCategory;

// @Repository — marca esta interface como repositório Spring Data,
// ativando tradução de exceções JPA para exceções Spring (DataAccessException)
@Repository
// JpaRepository<ProductCategory, UUID> — herda CRUD completo para ProductCategory com chave UUID
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {

    // Verifica se existe algum produto com o código de referência informado (insensível a maiúsculas).
    // Usado em ProductService.save() para impedir duplicatas de referência.
    boolean existsByRefIgnoreCase(String ref);

    // Busca um produto pelo código de referência (insensível a maiúsculas).
    // Retorna Optional para forçar tratamento do caso "não encontrado" no service.
    Optional<ProductCategory> findByRefIgnoreCase(String ref);

    // Exclui o produto com o código de referência informado (insensível a maiúsculas).
    // Atenção: requer @Transactional no método do service que o chama.
    void deleteByRefIgnoreCase(String ref);

    // Exclui o produto pelo seu UUID — sobrescreve o deleteById do JpaRepository
    // para deixar explícita a operação neste repositório.
    void deleteById(UUID id);
}
