package pastractor.Rapha.Product.Entity.Dtos;

import java.math.BigDecimal;
import java.util.UUID;

import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import pastractor.Rapha.Product.Entity.ProductCategory;

@Data
@NoArgsConstructor
@Getter
public class ProductCategoryResponse {

    private UUID id;
    private String name;
    private String ref;
    private BigDecimal price;
    private Integer qnt;
    private String marca;
    private String category;
    private String image;

    public static ProductCategoryResponse from(ProductCategory productCategory) {
        ProductCategoryResponse response = new ProductCategoryResponse();
        response.id = productCategory.getId();
        response.name = productCategory.getName();
        response.ref = productCategory.getRef();
        response.price = productCategory.getPrice();
        response.qnt = productCategory.getQnt();
        response.marca = productCategory.getMarca();
        response.category = productCategory.getCategory();
        response.image = productCategory.getImage();
        return response;
    }
}
