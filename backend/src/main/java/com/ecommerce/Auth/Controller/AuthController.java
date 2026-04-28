package com.ecommerce.Auth.Controller;

import com.ecommerce.Auth.Entity.Dto.*;
import com.ecommerce.Auth.Service.AuthService;
import com.ecommerce.Config.RecaptchaService;
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

    @Autowired
    private RecaptchaService recaptchaService;

    // ── POST /api/auth/register/initiate ──────────────────────────
    // Step 1: validates data, stores pending registration, sends OTP email.
    // Returns 202 Accepted — account not created yet.
    @PostMapping("/register/initiate")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void initiateRegistration(
            @Valid @RequestBody RegisterRequest request,
            @RequestHeader(value = "X-Captcha-Token", required = false) String captchaToken) {
        recaptchaService.verify(captchaToken);
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
    // Existing user → { newUser:false, token, email, role }
    // New user      → { newUser:true, email, fullName, setupToken }
    @PostMapping("/google")
    public GoogleAuthResponse googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        return authService.googleLogin(request);
    }

    // ── POST /api/auth/google/setup ───────────────────────────────
    // Sets password for a pending Google account and sends OTP.
    @PostMapping("/google/setup")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void googleSetup(@Valid @RequestBody GoogleSetupRequest request) {
        authService.googleSetup(request);
    }

    // ── POST /api/auth/google/setup/confirm ───────────────────────
    // Verifies OTP, creates the account and returns JWT.
    @PostMapping("/google/setup/confirm")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse googleSetupConfirm(@Valid @RequestBody GoogleSetupConfirmRequest request) {
        return authService.googleSetupConfirm(request);
    }

    // ── POST /api/auth/login ──────────────────────────────────────
    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request,
            @RequestHeader(value = "X-Captcha-Token", required = false) String captchaToken) {
        recaptchaService.verify(captchaToken);
        return authService.login(request);
    }

    // ── POST /api/auth/admin/login ────────────────────────────────
    // Endpoint exclusivo do dashboard administrativo — sem reCAPTCHA.
    // O CAPTCHA protege o login público da loja contra bots.
    // O dashboard já é uma área restrita não exposta a usuários comuns.
    @PostMapping("/admin/login")
    public AuthResponse adminLogin(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    // ── POST /api/auth/forgot-password ────────────────────────────
    // Always responds 202 regardless of whether email exists (prevents enumeration).
    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
    }

    // ── POST /api/auth/reset-password ─────────────────────────────
    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
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

    // ── DELETE /api/auth/me ───────────────────────────────────────
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount() {
        authService.deleteAccount();
        return ResponseEntity.noContent().build();
    }
}
