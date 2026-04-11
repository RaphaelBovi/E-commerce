package pastractor.Rapha.Product.Repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import pastractor.Rapha.Product.Entity.ProductCategory;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {

    boolean existsByRefIgnoreCase(String ref);

    Optional<ProductCategory> findByRefIgnoreCase(String ref);

    void deleteByRefIgnoreCase(String ref);

    void deleteById(UUID id);
}
