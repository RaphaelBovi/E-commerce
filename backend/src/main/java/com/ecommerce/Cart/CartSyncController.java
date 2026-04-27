package com.ecommerce.Cart;

import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartSyncController {

    @Autowired private AbandonedCartService cartService;
    @Autowired private UserRepository userRepository;

    // POST /api/cart/sync — stores the current cart for the authenticated user
    @PostMapping("/sync")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sync(@RequestBody String itemsJson) {
        User user = currentUser();
        cartService.sync(user, itemsJson);
    }

    // DELETE /api/cart/sync — removes the stored cart (user completed purchase or cleared cart)
    @DeleteMapping("/sync")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear() {
        cartService.clear(currentUser());
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }
}
