package com.ecommerce.Payment;

import com.ecommerce.Order.Entity.OrderItem;
import com.ecommerce.Order.Entity.Dto.OrderItemRequest;
import com.ecommerce.Product.Entity.ProductCategory;
import com.ecommerce.Product.Entity.ProductVariant;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Repository.ProductCategoryRepository;
import com.ecommerce.Product.Repository.ProductVariantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockServiceTest {

    @Mock private ProductCategoryRepository productRepository;
    @Mock private ProductVariantRepository variantRepository;
    @InjectMocks private StockService stockService;

    // ── validateStock — produto sem variante ─────────────────────

    @Test
    void validateStock_sufficientProductStock_noException() {
        UUID productId = UUID.randomUUID();
        var product = buildProduct("Camiseta", 10);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        assertThatNoException().isThrownBy(
            () -> stockService.validateStock(List.of(buildItem(productId, null, 5))));
    }

    @Test
    void validateStock_insufficientProductStock_throwsBusinessException() {
        UUID productId = UUID.randomUUID();
        var product = buildProduct("Camiseta", 2);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        assertThatThrownBy(() -> stockService.validateStock(List.of(buildItem(productId, null, 5))))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Estoque insuficiente")
            .hasMessageContaining("Camiseta");
    }

    @Test
    void validateStock_exactProductStock_noException() {
        UUID productId = UUID.randomUUID();
        var product = buildProduct("Tênis", 3);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        assertThatNoException().isThrownBy(
            () -> stockService.validateStock(List.of(buildItem(productId, null, 3))));
    }

    // ── validateStock — variante ──────────────────────────────────

    @Test
    void validateStock_sufficientVariantStock_noException() {
        UUID productId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();
        var variant = ProductVariant.builder().id(variantId).name("Tamanho 40").qnt(5).build();
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(variant));

        assertThatNoException().isThrownBy(
            () -> stockService.validateStock(List.of(buildItem(productId, variantId, 3))));
    }

    @Test
    void validateStock_insufficientVariantStock_throwsBusinessException() {
        UUID productId = UUID.randomUUID();
        UUID variantId = UUID.randomUUID();
        var variant = ProductVariant.builder().id(variantId).name("Tamanho 40").qnt(1).build();
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(variant));

        assertThatThrownBy(() -> stockService.validateStock(List.of(buildItem(productId, variantId, 3))))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Estoque insuficiente")
            .hasMessageContaining("Tamanho 40");
    }

    // ── validateStock — casos especiais ──────────────────────────

    @Test
    void validateStock_nullProductId_skipsItem() {
        assertThatNoException().isThrownBy(
            () -> stockService.validateStock(List.of(buildItem(null, null, 2))));

        verifyNoInteractions(productRepository, variantRepository);
    }

    @Test
    void validateStock_productNotFound_noException() {
        UUID productId = UUID.randomUUID();
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThatNoException().isThrownBy(
            () -> stockService.validateStock(List.of(buildItem(productId, null, 99))));
    }

    // ── decrementStock ────────────────────────────────────────────

    @Test
    void decrementStock_product_savesWithReducedQty() {
        UUID productId = UUID.randomUUID();
        var product = buildProduct("Bolsa", 10);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        stockService.decrementStock(List.of(buildOrderItem(productId, null, 4)));

        assertThat(product.getQnt()).isEqualTo(6);
        verify(productRepository).save(product);
    }

    @Test
    void decrementStock_variant_savesWithReducedQty() {
        UUID variantId = UUID.randomUUID();
        var variant = ProductVariant.builder().id(variantId).name("G").qnt(8).build();
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(variantRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        stockService.decrementStock(List.of(buildOrderItem(UUID.randomUUID(), variantId, 3)));

        assertThat(variant.getQnt()).isEqualTo(5);
        verify(variantRepository).save(variant);
    }

    // ── restoreStock ──────────────────────────────────────────────

    @Test
    void restoreStock_product_savesWithIncreasedQty() {
        UUID productId = UUID.randomUUID();
        var product = buildProduct("Mochila", 4);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        stockService.restoreStock(List.of(buildOrderItem(productId, null, 2)));

        assertThat(product.getQnt()).isEqualTo(6);
        verify(productRepository).save(product);
    }

    @Test
    void restoreStock_variant_savesWithIncreasedQty() {
        UUID variantId = UUID.randomUUID();
        var variant = ProductVariant.builder().id(variantId).name("P").qnt(2).build();
        when(variantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(variantRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        stockService.restoreStock(List.of(buildOrderItem(UUID.randomUUID(), variantId, 3)));

        assertThat(variant.getQnt()).isEqualTo(5);
        verify(variantRepository).save(variant);
    }

    // ── helpers ───────────────────────────────────────────────────

    private ProductCategory buildProduct(String name, int qty) {
        return new ProductCategory(name, "ref-" + name.toLowerCase(), BigDecimal.TEN, qty,
            "Marca", "categoria", "", null, null, null, null, null, null);
    }

    private OrderItemRequest buildItem(UUID productId, UUID variantId, int qty) {
        return new OrderItemRequest(productId, "Produto Teste", null, BigDecimal.TEN, qty, variantId, null);
    }

    private OrderItem buildOrderItem(UUID productId, UUID variantId, int qty) {
        return OrderItem.builder()
            .productId(productId)
            .variantId(variantId)
            .quantity(qty)
            .productName("Produto Teste")
            .unitPrice(BigDecimal.TEN)
            .build();
    }
}
