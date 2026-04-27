package com.ecommerce.Product.Entity.Dtos;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import com.ecommerce.Product.Entity.ProductCategory;

@Data
@NoArgsConstructor
@Getter
public class ProductCategoryRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
    private String name;

    @NotBlank(message = "Referência é obrigatória")
    @Size(max = 100, message = "Referência deve ter no máximo 100 caracteres")
    private String ref;

    @NotNull(message = "Preço é obrigatório")
    @DecimalMin(value = "0.01", message = "Preço deve ser maior que zero")
    private BigDecimal price;

    @DecimalMin(value = "0.01", message = "Preço promocional deve ser maior que zero")
    private BigDecimal promotionalPrice;

    @NotNull(message = "Quantidade é obrigatória")
    @Min(value = 0, message = "Quantidade não pode ser negativa")
    private Integer qnt;

    @NotBlank(message = "Marca é obrigatória")
    @Size(max = 100, message = "Marca deve ter no máximo 100 caracteres")
    private String marca;

    @NotBlank(message = "Categoria é obrigatória")
    @Size(max = 100, message = "Categoria deve ter no máximo 100 caracteres")
    private String category;

    private String image;

    @Size(max = 5, message = "Máximo de 5 imagens por produto")
    private List<String> images;

    // Shipping dimensions — optional, used by FreightService
    @DecimalMin(value = "0.001", message = "Peso deve ser maior que zero")
    private BigDecimal weightKg;

    @Min(value = 1, message = "Largura deve ser maior que zero")
    private Integer widthCm;

    @Min(value = 1, message = "Altura deve ser maior que zero")
    private Integer heightCm;

    @Min(value = 1, message = "Comprimento deve ser maior que zero")
    private Integer lengthCm;

    public ProductCategory toEntity() {
        return new ProductCategory(
            this.name, this.ref, this.price, this.qnt,
            this.marca, this.category, this.image,
            this.promotionalPrice, this.images,
            this.weightKg, this.widthCm, this.heightCm, this.lengthCm
        );
    }
}
