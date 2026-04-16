// ─────────────────────────────────────────────────────────────────
// ProductService.java — Serviço de negócio para gerenciamento de produtos
//
// Contém toda a lógica de negócio para operações CRUD de produtos:
//   - Criação com validação de referência única
//   - Busca por referência ou listagem completa
//   - Atualização por referência
//   - Exclusão por UUID ou por referência
//
// Lança exceções tipadas (BusinessException, ResourceNotFoundException)
// que são capturadas pelo ApiExceptionHandler e convertidas em
// respostas HTTP adequadas (400, 404, etc.).
//
// Para adicionar uma nova operação de produto (ex.: busca por categoria):
//   1. Adicione a query em ProductCategoryRepository
//   2. Implemente o método aqui usando o repository
//   3. Exponha o novo método em ProductCategoryController
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Product.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ecommerce.Product.Entity.Dtos.ProductCategoryRequest;
import com.ecommerce.Product.Entity.Dtos.ProductCategoryResponse;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import com.ecommerce.Product.Repository.ProductCategoryRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

// @Service — registra esta classe como bean de serviço Spring,
// disponível para injeção no controller
@Service
public class ProductService {

    // Repositório JPA para persistência de produtos
    @Autowired
    private ProductCategoryRepository repository;

    // Cria e persiste um novo produto no banco de dados.
    // Antes de salvar, verifica se já existe um produto com o mesmo código de referência (insensível a maiúsculas).
    // Parâmetro: request — dados do novo produto vindos do controller (já validados pelo Bean Validation)
    // Retorno: ProductCategoryResponse com os dados do produto criado, incluindo o UUID gerado
    // Lança: BusinessException (HTTP 400) se o código de referência já existir
    public ProductCategoryResponse save(ProductCategoryRequest request) {
        if (repository.existsByRefIgnoreCase(request.getRef())) {
            throw new BusinessException("Código de referência já existe");
        }
        return ProductCategoryResponse.from(repository.save(request.toEntity()));
    }

    // Busca um produto pelo código de referência (insensível a maiúsculas).
    // Parâmetro: ref — código de referência do produto (ex.: "CAM-001")
    // Retorno: ProductCategoryResponse com os dados do produto encontrado
    // Lança: ResourceNotFoundException (HTTP 404) se nenhum produto for encontrado com a referência
    public ProductCategoryResponse findByRef(String ref) {
        return ProductCategoryResponse.from(
                repository.findByRefIgnoreCase(ref)
                        .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com ref: " + ref))
        );
    }

    // Retorna a lista completa de todos os produtos cadastrados.
    // Usa stream e map para converter cada entidade em ProductCategoryResponse.
    // Retorno: lista (possivelmente vazia) de todos os produtos
    public List<ProductCategoryResponse> findProduct() {
        return repository.findAll()
                .stream()
                .map(ProductCategoryResponse::from)
                .collect(Collectors.toList());
    }

    // Atualiza os dados de um produto existente identificado pelo código de referência.
    // Parâmetro: ref     — código de referência do produto a ser atualizado
    // Parâmetro: request — novos dados do produto
    // Retorno: ProductCategoryResponse com os dados atualizados
    // Lança: ResourceNotFoundException (HTTP 404) se o produto não for encontrado
    public ProductCategoryResponse update(String ref, ProductCategoryRequest request) {
        // Busca o produto ou lança 404 se não existir
        var productCategory = repository.findByRefIgnoreCase(ref)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com ref: " + ref));

        // Atualiza todos os campos editáveis via método update() da entidade
        productCategory.update(
                request.getName(),
                request.getRef(),
                request.getPrice(),
                request.getQnt(),
                request.getMarca(),
                request.getCategory(),
                request.getImage()
        );

        // Persiste as alterações e retorna o DTO com os dados atualizados
        return ProductCategoryResponse.from(repository.save(productCategory));
    }

    // Remove um produto do banco pelo seu UUID.
    // Parâmetro: id — identificador único (UUID) do produto a ser excluído
    // Lança: ResourceNotFoundException (HTTP 404) se nenhum produto existir com o UUID informado
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Produto não encontrado com id: " + id);
        }
        repository.deleteById(id);
    }

    // Remove um produto do banco pelo código de referência (insensível a maiúsculas).
    // Parâmetro: ref — código de referência do produto a ser excluído
    // Lança: ResourceNotFoundException (HTTP 404) se o produto não for encontrado
    public void delete(String ref) {
        var product = repository.findByRefIgnoreCase(ref)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com ref: " + ref));
        repository.delete(product);
    }
}
