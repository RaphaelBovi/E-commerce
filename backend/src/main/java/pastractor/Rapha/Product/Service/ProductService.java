package pastractor.Rapha.Product.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pastractor.Rapha.Product.Entity.Dtos.ProductCategoryRequest;
import pastractor.Rapha.Product.Entity.Dtos.ProductCategoryResponse;
import pastractor.Rapha.Product.Exception.BusinessException;
import pastractor.Rapha.Product.Exception.ResourceNotFoundException;
import pastractor.Rapha.Product.Repository.ProductCategoryRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProductService {

    @Autowired
    private ProductCategoryRepository repository;

    public ProductCategoryResponse save(ProductCategoryRequest request) {
        if (repository.existsByRefIgnoreCase(request.getRef())) {
            throw new BusinessException("Código de referência já existe");
        }
        return ProductCategoryResponse.from(repository.save(request.toEntity()));
    }

    public ProductCategoryResponse findByRef(String ref) {
        return ProductCategoryResponse.from(
                repository.findByRefIgnoreCase(ref)
                        .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com ref: " + ref))
        );
    }

    public List<ProductCategoryResponse> findProduct() {
        return repository.findAll()
                .stream()
                .map(ProductCategoryResponse::from)
                .collect(Collectors.toList());
    }

    public ProductCategoryResponse update(String ref, ProductCategoryRequest request) {
        var productCategory = repository.findByRefIgnoreCase(ref)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com ref: " + ref));

        productCategory.update(
                request.getName(),
                request.getRef(),
                request.getPrice(),
                request.getQnt(),
                request.getMarca(),
                request.getCategory(),
                request.getImage()
        );

        return ProductCategoryResponse.from(repository.save(productCategory));
    }

    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Produto não encontrado com id: " + id);
        }
        repository.deleteById(id);
    }

    public void delete(String ref) {
        var product = repository.findByRefIgnoreCase(ref)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado com ref: " + ref));
        repository.delete(product);
    }
}