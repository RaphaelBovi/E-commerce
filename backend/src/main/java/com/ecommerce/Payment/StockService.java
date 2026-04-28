package com.ecommerce.Payment;

import com.ecommerce.Order.Entity.Dto.OrderItemRequest;
import com.ecommerce.Order.Entity.OrderItem;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Repository.ProductCategoryRepository;
import com.ecommerce.Product.Repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Responsável exclusivamente por validar e movimentar estoque.
 * Separado do PaymentService para respeitar responsabilidade única
 * e facilitar testes isolados.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StockService {

    private final ProductCategoryRepository productRepository;
    private final ProductVariantRepository variantRepository;

    /**
     * Valida estoque antes de criar o pedido.
     * Lança BusinessException se algum item estiver sem estoque suficiente.
     */
    public void validateStock(List<OrderItemRequest> items) {
        for (var item : items) {
            if (item.productId() == null) continue;

            if (item.variantId() != null) {
                variantRepository.findById(item.variantId()).ifPresent(variant -> {
                    if (variant.getQnt() < item.quantity()) {
                        throw new BusinessException(
                            "Estoque insuficiente para \"" + variant.getName() + "\". " +
                            "Disponível: " + variant.getQnt() + ", solicitado: " + item.quantity());
                    }
                });
            } else {
                productRepository.findById(item.productId()).ifPresent(product -> {
                    if (product.getQnt() < item.quantity()) {
                        throw new BusinessException(
                            "Estoque insuficiente para \"" + product.getName() + "\". " +
                            "Disponível: " + product.getQnt() + ", solicitado: " + item.quantity());
                    }
                });
            }
        }
    }

    /**
     * Decrementa estoque após pagamento confirmado.
     * Suporta variantes e produtos sem variante.
     */
    public void decrementStock(List<OrderItem> items) {
        for (var item : items) {
            if (item.getProductId() == null) continue;

            if (item.getVariantId() != null) {
                variantRepository.findById(item.getVariantId()).ifPresent(variant -> {
                    variant.decrementStock(item.getQuantity());
                    variantRepository.save(variant);
                    log.debug("Estoque variante {} decrementado: -{}", variant.getId(), item.getQuantity());
                });
            } else {
                productRepository.findById(item.getProductId()).ifPresent(product -> {
                    product.decrementStock(item.getQuantity());
                    productRepository.save(product);
                    log.debug("Estoque produto {} decrementado: -{}", product.getId(), item.getQuantity());
                });
            }
        }
    }

    /**
     * Restaura estoque em caso de cancelamento de pedido.
     */
    public void restoreStock(List<OrderItem> items) {
        for (var item : items) {
            if (item.getProductId() == null) continue;

            if (item.getVariantId() != null) {
                variantRepository.findById(item.getVariantId()).ifPresent(variant -> {
                    variant.incrementStock(item.getQuantity());
                    variantRepository.save(variant);
                    log.debug("Estoque variante {} restaurado: +{}", variant.getId(), item.getQuantity());
                });
            } else {
                productRepository.findById(item.getProductId()).ifPresent(product -> {
                    product.incrementStock(item.getQuantity());
                    productRepository.save(product);
                    log.debug("Estoque produto {} restaurado: +{}", product.getId(), item.getQuantity());
                });
            }
        }
    }
}
