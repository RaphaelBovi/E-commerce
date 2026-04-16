// ─────────────────────────────────────────────────────────────────
// ProductCategoryController.java — Controller REST para gerenciamento de produtos
//
// Expõe os endpoints CRUD de produtos sob o prefixo /api/product-category.
// Delega toda a lógica de negócio para ProductService.
//
// Mapeamento de rotas:
//   POST   /api/product-category          → criar produto          (201 Created)
//   GET    /api/product-category          → listar todos           (200 OK)
//   GET    /api/product-category/ref/{ref}→ buscar por referência  (200 OK)
//   PUT    /api/product-category/{ref}    → atualizar por ref      (200 OK)
//   DELETE /api/product-category/ref/{ref}→ excluir por referência (204 No Content)
//   DELETE /api/product-category/id/{id} → excluir por UUID        (204 No Content)
//
// Para adicionar um novo endpoint (ex.: busca por categoria):
//   1. Implemente o método no ProductService
//   2. Adicione aqui um novo método com a anotação HTTP (@GetMapping, etc.)
// ─────────────────────────────────────────────────────────────────
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

// @RestController — indica que esta classe é um controller REST;
// todas as respostas são serializadas automaticamente em JSON
@RestController
// @RequestMapping — prefixo de URL aplicado a todos os endpoints desta classe
@RequestMapping("/api/product-category")
public class ProductCategoryController {

    // Serviço responsável pela lógica de negócio dos produtos
    @Autowired
    private ProductService service;

    // POST /api/product-category
    // Cria um novo produto no catálogo.
    // @Valid — aciona a validação dos campos de ProductCategoryRequest antes de processar
    // @RequestBody — desserializa o JSON da requisição para ProductCategoryRequest
    // @ResponseStatus(CREATED) — retorna HTTP 201 em caso de sucesso
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductCategoryResponse save(@Valid @RequestBody ProductCategoryRequest request) {
        return service.save(request);
    }

    // GET /api/product-category
    // Lista todos os produtos cadastrados.
    // Retorna HTTP 200 com a lista de ProductCategoryResponse (pode ser vazia)
    @GetMapping
    public List<ProductCategoryResponse> findAll() {
        return this.service.findProduct();
    }

    // GET /api/product-category/ref/{ref}
    // Busca um produto pelo código de referência.
    // @PathVariable — extrai o valor {ref} da URL
    // Retorna HTTP 200 com o produto encontrado, ou 404 se não existir
    @GetMapping("/ref/{ref}")
    public ProductCategoryResponse findByRef(@PathVariable String ref) {
        return this.service.findByRef(ref);
    }

    // PUT /api/product-category/{ref}
    // Atualiza todos os campos de um produto identificado pelo código de referência.
    // @PathVariable — extrai o {ref} da URL
    // @Valid + @RequestBody — valida e desserializa os novos dados do produto
    // Retorna HTTP 200 com os dados atualizados, ou 404 se o produto não existir
    @PutMapping("/{ref}")
    public ProductCategoryResponse update(@PathVariable String ref, @Valid @RequestBody ProductCategoryRequest request) {
        return this.service.update(ref, request);
    }

    // DELETE /api/product-category/ref/{ref}
    // Remove um produto pelo código de referência.
    // @ResponseStatus(NO_CONTENT) — retorna HTTP 204 (sem corpo) em caso de sucesso
    // Retorna 404 se o produto não for encontrado
    @DeleteMapping("/ref/{ref}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteByRef(@PathVariable String ref) {
        this.service.delete(ref);
    }

    // DELETE /api/product-category/id/{id}
    // Remove um produto pelo UUID.
    // @PathVariable UUID — o Spring converte automaticamente a string da URL para UUID
    // @ResponseStatus(NO_CONTENT) — retorna HTTP 204 em caso de sucesso
    // Retorna 404 se o produto não for encontrado
    @DeleteMapping("/id/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteById(@PathVariable UUID id) {
        this.service.delete(id);
    }
}
