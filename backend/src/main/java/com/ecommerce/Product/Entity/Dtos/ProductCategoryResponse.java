package com.ecommerce.Product.Entity.Dtos;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import com.ecommerce.Product.Entity.ProductCategory;

@Data
@NoArgsConstructor
@Getter
public class ProductCategoryResponse {

    private UUID id;
    private String name;
    private String ref;
    private BigDecimal price;

    // Promotional price. Null when there is no active promotion.
    private BigDecimal promotionalPrice;

    // True when promotionalPrice is set and lower than the regular price.
    // Computed here so frontend does not need to repeat the logic.
    // @JsonProperty forces the key to "isPromo" — without it, Lombok's isPromo() getter
    // causes Jackson to strip the "is" prefix and emit "promo" instead.
    @JsonProperty("isPromo")
    private boolean isPromo;

    private Integer qnt;
    private String marca;
    private String category;

    // Primary image: first entry from the images list, falling back to the legacy image field.
    private String image;

    // All product images in display order (max 5).
    private List<String> images;

    private Instant createdAt;

    // Review summary — populated by ProductService (not from the entity directly)
    private Double averageRating;
    private long reviewCount;

    // Shipping dimensions — nullable, returned to dashboard for editing
    private BigDecimal weightKg;
    private Integer widthCm;
    private Integer heightCm;
    private Integer lengthCm;

    // Product variants (sizes, colors, etc.)
    private List<ProductVariantDto> variants;

    public static ProductCategoryResponse from(ProductCategory p) {
        ProductCategoryResponse r = new ProductCategoryResponse();
        r.id    = p.getId();
        r.name  = p.getName();
        r.ref   = p.getRef();
        r.price = p.getPrice();
        r.promotionalPrice = p.getPromotionalPrice();
        r.isPromo = p.getPromotionalPrice() != null
                 && p.getPromotionalPrice().compareTo(p.getPrice()) < 0;
        r.qnt      = p.getQnt();
        r.marca    = p.getMarca();
        r.category = p.getCategory();

        // Build the images list, falling back to the legacy single image field
        List<String> imgs = new ArrayList<>(p.getImages());
        if (imgs.isEmpty() && p.getImage() != null && !p.getImage().isBlank()) {
            imgs.add(p.getImage());
        }
        r.images = imgs;

        // Primary image: first in list or legacy field
        r.image = imgs.isEmpty() ? p.getImage() : imgs.get(0);

        r.createdAt = p.getCreatedAt();

        r.weightKg = p.getWeightKg();
        r.widthCm  = p.getWidthCm();
        r.heightCm = p.getHeightCm();
        r.lengthCm = p.getLengthCm();

        r.variants = p.getVariants().stream().map(ProductVariantDto::from).toList();

        return r;
    }
}
