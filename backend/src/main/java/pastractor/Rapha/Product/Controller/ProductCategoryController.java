package pastractor.Rapha.Product.Controller;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import pastractor.Rapha.Product.Entity.Dtos.ProductCategoryRequest;
import pastractor.Rapha.Product.Entity.Dtos.ProductCategoryResponse;
import pastractor.Rapha.Product.Service.ProductService;

@RestController
@CrossOrigin
@RequestMapping("/api/product-category")
public class ProductCategoryController {

    @Autowired
    private ProductService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductCategoryResponse save(@RequestBody ProductCategoryRequest request) {
        return service.save(request);
    }

    @PostMapping("/save")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductCategoryResponse saveLegacy(@RequestBody ProductCategoryRequest request) {
        return service.save(request);
    }

    @GetMapping
    public List<ProductCategoryResponse> findProductDefault() {
        return this.service.findProduct();
    }

    @GetMapping("/all")
    public List<ProductCategoryResponse> findProduct() {
        return this.service.findProduct();
    }

    @GetMapping("/ref/{ref}")
    public ProductCategoryResponse findByRef(@PathVariable String ref) {
        return this.service.findByRef(ref);
    }

    @GetMapping("/findByRef/{ref}")
    public ProductCategoryResponse findByRefLegacy(@PathVariable String ref) {
        return this.service.findByRef(ref);
    }

    @PutMapping("/{ref}")
    public ProductCategoryResponse update(@PathVariable String ref, @RequestBody ProductCategoryRequest request) {
        return this.service.update(ref, request);
    }

    @PutMapping("/update/{ref}")
    public ProductCategoryResponse updateLegacy(@PathVariable String ref, @RequestBody ProductCategoryRequest request) {
        return this.service.update(ref, request);
    }

    @DeleteMapping("/ref/{ref}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String ref) {
        this.service.delete(ref);
    }

    @DeleteMapping("/delete/{ref}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLegacy(@PathVariable String ref) {
        this.service.delete(ref);
    }

    @DeleteMapping("/id/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteById(@PathVariable UUID id) {
        this.service.delete(id);
    }
}
