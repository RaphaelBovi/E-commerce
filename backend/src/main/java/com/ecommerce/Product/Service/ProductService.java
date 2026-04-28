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

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.ecommerce.Config.CloudinaryService;
import com.ecommerce.Product.Entity.ProductCategory;
import com.ecommerce.Product.Entity.Dtos.CsvImportResult;
import com.ecommerce.Product.Entity.Dtos.CsvImportResult.CsvRowError;
import com.ecommerce.Product.Entity.Dtos.ProductCategoryRequest;
import com.ecommerce.Product.Entity.Dtos.ProductCategoryResponse;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import com.ecommerce.Product.Repository.ProductCategoryRepository;
import com.ecommerce.Review.ReviewRepository;

import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

// @Service — registra esta classe como bean de serviço Spring,
// disponível para injeção no controller
@Service
public class ProductService {

    @Autowired
    private ProductCategoryRepository repository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    // Cria e persiste um novo produto no banco de dados.
    // Antes de salvar, verifica se já existe um produto com o mesmo código de referência (insensível a maiúsculas).
    // Parâmetro: request — dados do novo produto vindos do controller (já validados pelo Bean Validation)
    // Retorno: ProductCategoryResponse com os dados do produto criado, incluindo o UUID gerado
    // Lança: BusinessException (HTTP 400) se o código de referência já existir
    public ProductCategoryResponse save(ProductCategoryRequest request) {
        if (repository.existsByRefIgnoreCase(request.getRef())) {
            throw new BusinessException("Código de referência já existe");
        }
        String image        = cloudinaryService.uploadIfBase64(request.getImage(), "products");
        List<String> images = cloudinaryService.uploadListIfBase64(request.getImages(), "products");
        var entity = new ProductCategory(
            request.getName(), request.getRef(), request.getPrice(), request.getQnt(),
            request.getMarca(), request.getCategory(), image,
            request.getPromotionalPrice(), images,
            request.getWeightKg(), request.getWidthCm(), request.getHeightCm(), request.getLengthCm()
        );
        return ProductCategoryResponse.from(repository.save(entity));
    }

    // Busca um produto pelo código de referência (insensível a maiúsculas).
    // Parâmetro: ref — código de referência do produto (ex.: "CAM-001")
    // Retorno: ProductCategoryResponse com os dados do produto encontrado
    // Lança: ResourceNotFoundException (HTTP 404) se nenhum produto for encontrado com a referência
    public ProductCategoryResponse findByRef(String ref) {
        return ProductCategoryResponse.from(
                repository.findByRefIgnoreCaseWithVariants(ref)
                        .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com ref: " + ref))
        );
    }

    // Retorna a lista completa de todos os produtos com variantes.
    // @Transactional(readOnly = true) mantém a sessão Hibernate aberta durante o
    // mapeamento, evitando LazyInitializationException ao acessar variants.
    // findAllWithVariants() usa JOIN FETCH + DISTINCT para carregar produtos e
    // variantes em uma única query, eliminando o problema N+1.
    @Transactional(readOnly = true)
    public List<ProductCategoryResponse> findProduct() {
        Map<UUID, double[]> ratingMap = new HashMap<>();
        for (Object[] row : reviewRepository.findRatingSummaryForAllProducts()) {
            UUID pid   = (UUID) row[0];
            double avg = row[1] instanceof Number ? ((Number) row[1]).doubleValue() : 0.0;
            long cnt   = row[2] instanceof Number ? ((Number) row[2]).longValue() : 0L;
            ratingMap.put(pid, new double[]{ avg, cnt });
        }

        return repository.findAllWithVariants().stream().map(p -> {
            ProductCategoryResponse r = ProductCategoryResponse.from(p);
            double[] rd = ratingMap.get(p.getId());
            if (rd != null) {
                r.setAverageRating(rd[0]);
                r.setReviewCount((long) rd[1]);
            }
            return r;
        }).collect(Collectors.toList());
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

        String image        = cloudinaryService.uploadIfBase64(request.getImage(), "products");
        List<String> images = cloudinaryService.uploadListIfBase64(request.getImages(), "products");
        productCategory.update(
                request.getName(),
                request.getRef(),
                request.getPrice(),
                request.getQnt(),
                request.getMarca(),
                request.getCategory(),
                image,
                request.getPromotionalPrice(),
                images,
                request.getWeightKg(),
                request.getWidthCm(),
                request.getHeightCm(),
                request.getLengthCm()
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

    // Importa produtos em lote a partir de um arquivo CSV.
    // Colunas esperadas (com cabeçalho): name, ref, price, promotionalPrice, qnt, marca, category,
    //   weightKg, widthCm, heightCm, lengthCm  (as últimas 5 são opcionais)
    // Linhas com erros de validação são puladas e registradas no resultado.
    public CsvImportResult importFromCsv(MultipartFile file) {
        List<CsvRowError> errors = new ArrayList<>();
        int imported = 0;
        int rowNum = 1;

        try (var reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             var parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setTrim(true)
                     .setIgnoreEmptyLines(true)
                     .build()
                     .parse(reader)) {

            for (CSVRecord record : parser) {
                rowNum++;
                try {
                    String name     = record.get("name");
                    String ref      = record.get("ref");
                    String priceStr = record.get("price");
                    String qntStr   = record.get("qnt");
                    String marca    = record.get("marca");
                    String category = record.get("category");

                    if (name.isBlank() || ref.isBlank() || priceStr.isBlank() || qntStr.isBlank()
                            || marca.isBlank() || category.isBlank()) {
                        errors.add(new CsvRowError(rowNum, "Campos obrigatórios ausentes (name, ref, price, qnt, marca, category)"));
                        continue;
                    }

                    if (repository.existsByRefIgnoreCase(ref)) {
                        errors.add(new CsvRowError(rowNum, "Referência já cadastrada: " + ref));
                        continue;
                    }

                    BigDecimal price = new BigDecimal(priceStr);
                    int qnt = Integer.parseInt(qntStr);

                    String promoStr = safeGet(record, "promotionalPrice");
                    BigDecimal promo = (promoStr != null && !promoStr.isBlank())
                            ? new BigDecimal(promoStr) : null;

                    String wkStr = safeGet(record, "weightKg");
                    BigDecimal wk = (wkStr != null && !wkStr.isBlank()) ? new BigDecimal(wkStr) : null;

                    String wcStr = safeGet(record, "widthCm");
                    Integer wc = (wcStr != null && !wcStr.isBlank()) ? Integer.parseInt(wcStr) : null;

                    String hcStr = safeGet(record, "heightCm");
                    Integer hc = (hcStr != null && !hcStr.isBlank()) ? Integer.parseInt(hcStr) : null;

                    String lcStr = safeGet(record, "lengthCm");
                    Integer lc = (lcStr != null && !lcStr.isBlank()) ? Integer.parseInt(lcStr) : null;

                    var entity = new ProductCategory(name, ref, price, qnt, marca, category,
                            null, promo, null, wk, wc, hc, lc);
                    repository.save(entity);
                    imported++;
                } catch (Exception e) {
                    errors.add(new CsvRowError(rowNum, "Erro ao processar linha: " + e.getMessage()));
                }
            }
        } catch (Exception e) {
            throw new BusinessException("Erro ao ler o arquivo CSV: " + e.getMessage());
        }

        return new CsvImportResult(imported, errors);
    }

    private String safeGet(CSVRecord record, String column) {
        try { return record.get(column); } catch (Exception e) { return null; }
    }
}
