package pastractor.Rapha.Product.Entity.Dtos;

import java.math.BigDecimal;

import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import pastractor.Rapha.Product.Entity.ProductCategory;

@Data
@NoArgsConstructor
@Getter
public class ProductCategoryRequest {

    private String name;
    private String ref;
    private BigDecimal price;
    private Integer qnt;
    private String marca;
    private String category;
    private String image;

    public ProductCategory toEntity() {
        return new ProductCategory(this.name, this.ref, this.price, this.qnt, this.marca, this.category, this.image);
    }
}
