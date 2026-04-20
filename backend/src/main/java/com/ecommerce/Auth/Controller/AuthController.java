package com.ecommerce.Auth.Controller;

import com.ecommerce.Auth.Entity.Dto.*;
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

    // ── POST /api/auth/register/initiate ──────────────────────────
    // Step 1: validates data, stores pending registration, sends OTP email.
    // Returns 202 Accepted — account not created yet.
    @PostMapping("/register/initiate")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void initiateRegistration(@Valid @RequestBody RegisterRequest request) {
        authService.initiateRegistration(request);
    }

    // ── POST /api/auth/register/confirm ───────────────────────────
    // Step 2: verifies OTP and creates the account. Returns JWT.
    @PostMapping("/register/confirm")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse confirmRegistration(@Valid @RequestBody ConfirmRegistrationRequest request) {
        return authService.confirmRegistration(request);
    }

    // ── POST /api/auth/google ─────────────────────────────────────
    // Google Sign-In: verifies Google ID token, finds/creates user, returns JWT.
    @PostMapping("/google")
    public AuthResponse googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        return authService.googleLogin(request);
    }

    // ── POST /api/auth/register (legacy) ─────────────────────────
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    // ── POST /api/auth/login ──────────────────────────────────────
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    // ── GET /api/auth/me ──────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getProfile() {
        return ResponseEntity.ok(authService.getProfile());
    }

    // ── PATCH /api/auth/me ────────────────────────────────────────
    @PatchMapping("/me")
    public ResponseEntity<UserProfileResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(request));
    }

    // ── PATCH /api/auth/me/password ───────────────────────────────
    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.noContent().build();
    }
}
