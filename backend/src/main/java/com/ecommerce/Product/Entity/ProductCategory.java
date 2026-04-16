// ─────────────────────────────────────────────────────────────────
// ProductCategory.java — Entidade JPA que representa um produto no catálogo
//
// Apesar do nome "ProductCategory", esta entidade armazena dados
// de um produto individual (nome, preço, estoque, marca, etc.),
// incluindo a qual categoria ele pertence (campo "category").
// Mapeada para a tabela "product_category" no banco de dados.
//
// Padrão de design adotado:
//   - Construtores explícitos no lugar de @AllArgsConstructor/@Setter do Lombok,
//     garantindo que a entidade seja criada e atualizada apenas por métodos
//     controlados (construtor e update()), evitando estado inválido.
//   - @Getter do Lombok gera apenas os métodos de leitura.
//   - @PrePersist e @PreUpdate preenchem os timestamps automaticamente.
//
// Para adicionar um novo campo ao produto (ex.: descrição):
//   1. Declare o campo aqui com as anotações JPA necessárias
//   2. Adicione-o ao construtor público e ao método update()
//   3. Adicione-o ao construtor protegido (valor padrão vazio)
//   4. Atualize ProductCategoryRequest, ProductCategoryResponse e ProductService
//   5. Gere ou aplique a migration de banco correspondente
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Product.Entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;

// @Entity — marca esta classe como entidade JPA, mapeada para uma tabela no banco de dados
@Entity
// @Table(name = "product_category") — define o nome exato da tabela no banco
@Table(name = "product_category")
// @Getter — Lombok gera automaticamente os métodos get para todos os campos da classe
@Getter
public class ProductCategory {

    // Construtor protegido exigido pelo JPA para instanciar entidades ao carregar do banco.
    // Define valores padrão para campos não-nulos, evitando NullPointerException.
    // Não deve ser usado diretamente pelo código da aplicação.
    protected ProductCategory() {
        this.name = "";
        this.ref = "";
        this.price = BigDecimal.ZERO;
        this.qnt = 0;
        this.marca = "";
        this.category = "";
        this.image = "";
    }

    // Construtor público usado pelo método ProductCategoryRequest.toEntity() para criar um novo produto.
    // Parâmetros correspondem a todos os campos editáveis do produto.
    public ProductCategory(String name, String ref, BigDecimal price, Integer qnt, String marca, String category,
            String image) {
        this.name = name;
        this.ref = ref;
        this.price = price;
        this.qnt = qnt;
        this.marca = marca;
        this.category = category;
        this.image = image;
    }

    // Atualiza todos os campos editáveis do produto em uma única operação.
    // Chamado por ProductService.update() após localizar o produto no banco.
    // Parâmetros: os novos valores para cada campo do produto
    public void update(String name, String ref, BigDecimal price, Integer qnt, String marca, String category,
            String image) {
        this.name = name;
        this.ref = ref;
        this.price = price;
        this.qnt = qnt;
        this.marca = marca;
        this.category = category;
        this.image = image;
    }

    // @Id — define este campo como chave primária da tabela
    // @GeneratedValue(strategy = UUID) — o banco gera automaticamente um UUID único ao inserir
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Nome do produto exibido no catálogo (ex.: "Camiseta Polo Masculina")
    private String name;

    // Código de referência único do produto (ex.: "CAM-001") — usado como identificador alternativo
    private String ref;

    // Preço unitário do produto — BigDecimal para precisão monetária (evita erros de ponto flutuante)
    private BigDecimal price;

    // Quantidade em estoque — não pode ser negativa (validado em ProductCategoryRequest)
    private Integer qnt;

    // Marca/fabricante do produto (ex.: "Nike", "Samsung")
    private String marca;

    // Categoria à qual o produto pertence (ex.: "Roupas", "Eletrônicos")
    private String category;

    // URL ou base64 da imagem do produto
    // @Column(columnDefinition = "TEXT") — permite strings longas (URLs ou dados de imagem em base64)
    @Column(columnDefinition = "TEXT")
    private String image;

    // Data e hora de criação do registro — preenchida automaticamente em prePersist()
    // nullable = false → obrigatório no banco
    // updatable = false → nunca alterado após a inserção inicial
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    // Data e hora da última atualização — atualizada automaticamente em preUpdate()
    @Column(nullable = false)
    private Instant updatedAt;

    // @PrePersist — executado automaticamente pelo JPA antes de inserir o registro no banco.
    // Preenche createdAt e updatedAt com o momento atual (fuso UTC).
    @PrePersist
    public void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    // @PreUpdate — executado automaticamente pelo JPA antes de atualizar o registro no banco.
    // Mantém updatedAt sempre com o momento da última modificação.
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
