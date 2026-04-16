// ─────────────────────────────────────────────────────────────────
// ProductCategoryResponse.java — DTO de saída para dados de produto
//
// Retornado como resposta JSON pelos endpoints:
//   - POST /api/product-category         → produto criado
//   - GET  /api/product-category         → lista de todos os produtos
//   - GET  /api/product-category/ref/{ref} → produto por referência
//   - PUT  /api/product-category/{ref}   → produto atualizado
//
// O método estático from() atua como factory: recebe a entidade
// ProductCategory do banco e projeta apenas os campos necessários
// para o frontend, omitindo timestamps internos (createdAt, updatedAt).
//
// Para expor novos campos na resposta (ex.: createdAt):
//   1. Declare o campo aqui
//   2. Preencha-o no método from() a partir da entidade
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Product.Entity.Dtos;

import java.math.BigDecimal;
import java.util.UUID;

import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import com.ecommerce.Product.Entity.ProductCategory;

// @Data        — Lombok gera getters, setters, equals, hashCode e toString
// @NoArgsConstructor — construtor sem argumentos necessário para from() instanciar e setar campos
// @Getter      — redundante com @Data, mantido por consistência com outras classes do pacote
@Data
@NoArgsConstructor
@Getter
public class ProductCategoryResponse {

    // Identificador único do produto (UUID)
    private UUID id;

    // Nome do produto
    private String name;

    // Código de referência do produto
    private String ref;

    // Preço unitário do produto
    private BigDecimal price;

    // Quantidade disponível em estoque
    private Integer qnt;

    // Marca/fabricante do produto
    private String marca;

    // Categoria à qual o produto pertence
    private String category;

    // URL ou representação da imagem do produto
    private String image;

    // Método factory estático que cria um ProductCategoryResponse a partir de uma entidade.
    // Uso do padrão factory estático evita a necessidade de um construtor com todos os campos,
    // deixando o código do service mais legível (ProductCategoryResponse.from(entity)).
    // Parâmetro: productCategory — entidade recuperada do banco de dados
    // Retorno: DTO pronto para ser serializado como resposta JSON
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
