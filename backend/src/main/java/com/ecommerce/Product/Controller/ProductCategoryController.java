package com.ecommerce.Product.Controller;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ecommerce.Product.Entity.Dtos.ProductCategoryRequest;
import com.ecommerce.Product.Entity.Dtos.ProductCategoryResponse;
import com.ecommerce.Product.Service.ProductService;

@RestController
@RequestMapping("/api/product-category")
public class ProductCategoryController {

    @Autowired
    private ProductService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductCategoryResponse save(@Valid @RequestBody ProductCategoryRequest request) {
        return service.save(request);
    }

    @GetMapping
    public List<ProductCategoryResponse> findAll() {
        return this.service.findProduct();
    }

    @GetMapping("/ref/{ref}")
    public ProductCategoryResponse findByRef(@PathVariable String ref) {
        return this.service.findByRef(ref);
    }

    @PutMapping("/{ref}")
    public ProductCategoryResponse update(@PathVariable String ref, @Valid @RequestBody ProductCategoryRequest request) {
        return this.service.update(ref, request);
    }

    @DeleteMapping("/ref/{ref}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteByRef(@PathVariable String ref) {
        this.service.delete(ref);
    }

    @DeleteMapping("/id/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteById(@PathVariable UUID id) {
        this.service.delete(id);
    }
}
