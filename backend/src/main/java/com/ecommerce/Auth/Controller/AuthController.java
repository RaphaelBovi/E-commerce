package com.ecommerce.Auth.Controller;

import com.ecommerce.Auth.Entity.Dto.AuthResponse;
import com.ecommerce.Auth.Entity.Dto.LoginRequest;
import com.ecommerce.Auth.Entity.Dto.RegisterRequest;
import com.ecommerce.Auth.Entity.Dto.UserProfileResponse;
import com.ecommerce.Auth.Service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getProfile() {
        return ResponseEntity.ok(authService.getProfile());
    }
}