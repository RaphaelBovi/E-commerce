package com.ecommerce.Category;

import com.ecommerce.Category.Dto.CategoryResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<CategoryResponse>> listActive() {
        return ResponseEntity.ok(
                categoryRepository.findByActiveTrueOrderByNameAsc()
                        .stream().map(CategoryResponse::from).toList()
        );
    }
}
