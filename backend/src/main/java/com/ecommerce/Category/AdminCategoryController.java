package com.ecommerce.Category;

import com.ecommerce.Category.Dto.CategoryResponse;
import com.ecommerce.Category.Dto.CreateCategoryRequest;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/categories")
public class AdminCategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> listAll() {
        return ResponseEntity.ok(
                categoryRepository.findAllByOrderByNameAsc()
                        .stream().map(CategoryResponse::from).toList()
        );
    }

    @PostMapping
    public ResponseEntity<CategoryResponse> create(@Valid @RequestBody CreateCategoryRequest req) {
        if (categoryRepository.existsByNameIgnoreCase(req.name()))
            throw new BusinessException("Categoria \"" + req.name() + "\" já existe.");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(CategoryResponse.from(categoryRepository.save(new Category(req.name()))));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CategoryResponse> update(@PathVariable UUID id,
                                                   @Valid @RequestBody CreateCategoryRequest req) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        cat.update(req.name());
        return ResponseEntity.ok(CategoryResponse.from(categoryRepository.save(cat)));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<CategoryResponse> toggle(@PathVariable UUID id) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria não encontrada"));
        cat.setActive(!cat.isActive());
        return ResponseEntity.ok(CategoryResponse.from(categoryRepository.save(cat)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!categoryRepository.existsById(id))
            throw new ResourceNotFoundException("Categoria não encontrada");
        categoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
