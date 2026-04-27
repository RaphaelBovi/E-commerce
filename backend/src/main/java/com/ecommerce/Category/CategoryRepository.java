package com.ecommerce.Category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByActiveTrueOrderByNameAsc();
    List<Category> findAllByOrderByNameAsc();
    Optional<Category> findBySlug(String slug);
    boolean existsByNameIgnoreCase(String name);
}
