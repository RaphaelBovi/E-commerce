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
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.ecommerce.Product.Entity.ProductCategory;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {

    boolean existsByRefIgnoreCase(String ref);

    Optional<ProductCategory> findByRefIgnoreCase(String ref);

    // JOIN FETCH de variantes — usado apenas no endpoint de detalhe do produto.
    // Evita N+1: carrega produto + variantes em uma única query.
    @Query("SELECT p FROM ProductCategory p LEFT JOIN FETCH p.variants WHERE LOWER(p.ref) = LOWER(:ref)")
    Optional<ProductCategory> findByRefIgnoreCaseWithVariants(@Param("ref") String ref);

    @Query("SELECT p FROM ProductCategory p LEFT JOIN FETCH p.variants WHERE p.id = :id")
    Optional<ProductCategory> findByIdWithVariants(@Param("id") UUID id);

    void deleteByRefIgnoreCase(String ref);

    void deleteById(UUID id);
}
