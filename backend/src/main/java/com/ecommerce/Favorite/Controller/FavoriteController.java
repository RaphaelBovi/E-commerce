package com.ecommerce.Favorite.Controller;

import com.ecommerce.Favorite.Service.FavoriteService;
import com.ecommerce.Product.Entity.Dtos.ProductCategoryResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    @Autowired
    private FavoriteService favoriteService;

    @GetMapping
    public List<ProductCategoryResponse> getFavorites() {
        return favoriteService.getFavorites();
    }

    @PostMapping("/{productId}")
    public Map<String, Object> toggle(@PathVariable UUID productId) {
        return favoriteService.toggleFavorite(productId);
    }

    @PostMapping("/check")
    public Map<String, Boolean> check(@RequestBody List<UUID> productIds) {
        return favoriteService.checkFavorites(productIds);
    }
}
