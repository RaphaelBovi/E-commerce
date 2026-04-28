package com.ecommerce.Cart;

import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class SharedCartController {

    private final SharedCartRepository sharedCartRepository;

    // POST /api/cart/share — salva snapshot do carrinho e retorna token (autenticado)
    @PostMapping("/share")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> share(@RequestBody String itemsJson) {
        if (itemsJson == null || itemsJson.isBlank() || itemsJson.equals("[]")) {
            throw new BusinessException("Carrinho vazio não pode ser compartilhado.");
        }
        String token = UUID.randomUUID().toString();
        sharedCartRepository.save(new SharedCart(token, itemsJson));
        return Map.of("token", token);
    }

    // GET /api/cart/share/{token} — retorna itens do carrinho (público, sem auth)
    @GetMapping("/share/{token}")
    public Map<String, String> getShared(@PathVariable String token) {
        SharedCart cart = sharedCartRepository.findById(token)
                .orElseThrow(() -> new ResourceNotFoundException("Carrinho não encontrado ou link expirado."));

        if (cart.isExpired()) {
            sharedCartRepository.delete(cart);
            throw new ResourceNotFoundException("Este link de carrinho expirou.");
        }

        return Map.of("itemsJson", cart.getItemsJson());
    }
}
