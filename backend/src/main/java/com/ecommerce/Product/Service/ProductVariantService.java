package com.ecommerce.Product.Service;

import com.ecommerce.Product.Entity.Dtos.ProductVariantDto;
import com.ecommerce.Product.Entity.Dtos.ProductVariantRequest;
import com.ecommerce.Product.Entity.ProductVariant;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import com.ecommerce.Product.Repository.ProductCategoryRepository;
import com.ecommerce.Product.Repository.ProductVariantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.UUID;

@Service
public class ProductVariantService {

    @Autowired private ProductVariantRepository variantRepository;
    @Autowired private ProductCategoryRepository productRepository;

    public List<ProductVariantDto> listByProduct(UUID productId) {
        return variantRepository.findByProductIdOrderByNameAsc(productId)
                .stream().map(ProductVariantDto::from).toList();
    }

    public ProductVariantDto create(UUID productId, ProductVariantRequest req) {
        var product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));
        var variant = ProductVariant.builder()
                .product(product)
                .name(req.name())
                .sku(req.sku())
                .price(req.price())
                .qnt(req.qnt())
                .attributes(req.attributes() != null ? req.attributes() : new HashMap<>())
                .build();
        return ProductVariantDto.from(variantRepository.save(variant));
    }

    public ProductVariantDto update(UUID productId, UUID variantId, ProductVariantRequest req) {
        var variant = variantRepository.findById(variantId)
                .filter(v -> v.getProduct().getId().equals(productId))
                .orElseThrow(() -> new ResourceNotFoundException("Variante não encontrada"));
        variant.setName(req.name());
        variant.setSku(req.sku());
        variant.setPrice(req.price());
        variant.setQnt(req.qnt());
        variant.setAttributes(req.attributes() != null ? req.attributes() : new HashMap<>());
        return ProductVariantDto.from(variantRepository.save(variant));
    }

    public void delete(UUID productId, UUID variantId) {
        variantRepository.findById(variantId)
                .filter(v -> v.getProduct().getId().equals(productId))
                .ifPresent(variantRepository::delete);
    }
}
