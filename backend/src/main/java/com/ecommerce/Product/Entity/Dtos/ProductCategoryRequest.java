// ─────────────────────────────────────────────────────────────────
// ProductCategoryRequest.java — DTO de entrada para criação e atualização de produto
//
// Recebido no corpo das requisições:
//   - POST /api/product-category         → criar novo produto
//   - PUT  /api/product-category/{ref}   → atualizar produto existente
//
// As anotações Bean Validation garantem que os dados sejam válidos
// antes de chegar ao ProductService. O método toEntity() converte
// este DTO na entidade ProductCategory para persistência.
//
// Para adicionar um novo campo ao produto:
//   1. Declare-o aqui com as validações adequadas
//   2. Inclua-o em toEntity() ao chamar o construtor de ProductCategory
//   3. Atualize ProductCategory, ProductCategoryResponse e ProductService
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Product.Entity.Dtos;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import com.ecommerce.Product.Entity.ProductCategory;

// @Data        — Lombok gera: getters, setters, equals, hashCode e toString
// @NoArgsConstructor — Lombok gera construtor sem argumentos (necessário para deserialização JSON)
// @Getter      — redundante com @Data, mas mantido para clareza explícita
@Data
@NoArgsConstructor
@Getter
public class ProductCategoryRequest {

    // Nome do produto — obrigatório, máximo de 255 caracteres
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 255, message = "Nome deve ter no máximo 255 caracteres")
    private String name;

    // Código de referência único — obrigatório, máximo de 100 caracteres
    // Usado como chave alternativa para busca/atualização/exclusão de produtos
    @NotBlank(message = "Referência é obrigatória")
    @Size(max = 100, message = "Referência deve ter no máximo 100 caracteres")
    private String ref;

    // Preço do produto — obrigatório, deve ser maior que zero
    // BigDecimal para evitar erros de precisão com ponto flutuante
    @NotNull(message = "Preço é obrigatório")
    @DecimalMin(value = "0.01", message = "Preço deve ser maior que zero")
    private BigDecimal price;

    // Quantidade em estoque — obrigatório, mínimo 0 (sem estoque é permitido)
    @NotNull(message = "Quantidade é obrigatória")
    @Min(value = 0, message = "Quantidade não pode ser negativa")
    private Integer qnt;

    // Marca/fabricante do produto — obrigatório, máximo de 100 caracteres
    @NotBlank(message = "Marca é obrigatória")
    @Size(max = 100, message = "Marca deve ter no máximo 100 caracteres")
    private String marca;

    // Categoria do produto — obrigatório, máximo de 100 caracteres
    @NotBlank(message = "Categoria é obrigatória")
    @Size(max = 100, message = "Categoria deve ter no máximo 100 caracteres")
    private String category;

    // URL ou base64 da imagem — opcional, máximo de 2048 caracteres
    // (URLs longas ou strings base64 pequenas cabem neste limite)
    @Size(max = 2048, message = "URL da imagem deve ter no máximo 2048 caracteres")
    private String image;

    // Converte este DTO em uma entidade ProductCategory pronta para ser persistida.
    // Chamado em ProductService.save() antes de chamar repository.save().
    // Retorno: nova instância de ProductCategory com os dados deste request
    public ProductCategory toEntity() {
        return new ProductCategory(this.name, this.ref, this.price, this.qnt, this.marca, this.category, this.image);
    }
}
