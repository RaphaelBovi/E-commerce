package com.ecommerce.Product.Controller;

import com.ecommerce.Product.Entity.Dtos.ProductVariantDto;
import com.ecommerce.Product.Entity.Dtos.ProductVariantRequest;
import com.ecommerce.Product.Service.ProductVariantService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/product-category/{productId}/variants")
public class ProductVariantController {

    @Autowired private ProductVariantService service;

    @GetMapping
    public List<ProductVariantDto> list(@PathVariable UUID productId) {
        return service.listByProduct(productId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductVariantDto create(
            @PathVariable UUID productId,
            @Valid @RequestBody ProductVariantRequest req) {
        return service.create(productId, req);
    }

    @PutMapping("/{variantId}")
    public ProductVariantDto update(
            @PathVariable UUID productId,
            @PathVariable UUID variantId,
            @Valid @RequestBody ProductVariantRequest req) {
        return service.update(productId, variantId, req);
    }

    @DeleteMapping("/{variantId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID productId, @PathVariable UUID variantId) {
        service.delete(productId, variantId);
    }
}
