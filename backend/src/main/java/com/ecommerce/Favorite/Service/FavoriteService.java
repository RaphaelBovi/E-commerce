package com.ecommerce.Favorite.Service;

import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Repository.UserRepository;
import com.ecommerce.Favorite.Entity.Favorite;
import com.ecommerce.Favorite.Repository.FavoriteRepository;
import com.ecommerce.Product.Entity.Dtos.ProductCategoryResponse;
import com.ecommerce.Product.Repository.ProductCategoryRepository;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class FavoriteService {

    @Autowired private FavoriteRepository favoriteRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private ProductCategoryRepository productRepo;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    public List<ProductCategoryResponse> getFavorites() {
        User user = getCurrentUser();
        return favoriteRepo.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(f -> productRepo.findById(f.getProductId()).map(ProductCategoryResponse::from).orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }

    @Transactional
    public Map<String, Object> toggleFavorite(UUID productId) {
        User user = getCurrentUser();
        productRepo.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado"));

        boolean isFav = favoriteRepo.existsByUserIdAndProductId(user.getId(), productId);
        if (isFav) {
            favoriteRepo.deleteByUserIdAndProductId(user.getId(), productId);
            return Map.of("favorited", false);
        }
        favoriteRepo.save(Favorite.builder()
                .userId(user.getId())
                .productId(productId)
                .build());
        return Map.of("favorited", true);
    }

    public Map<String, Boolean> checkFavorites(List<UUID> productIds) {
        User user = getCurrentUser();
        Map<String, Boolean> result = new HashMap<>();
        for (UUID pid : productIds) {
            result.put(pid.toString(), favoriteRepo.existsByUserIdAndProductId(user.getId(), pid));
        }
        return result;
    }
}
