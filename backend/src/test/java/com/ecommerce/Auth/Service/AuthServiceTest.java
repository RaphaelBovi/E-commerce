package com.ecommerce.Auth.Service;

import com.ecommerce.Auth.Entity.Dto.*;
import com.ecommerce.Auth.Entity.PendingRegistration;
import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Repository.PasswordResetTokenRepository;
import com.ecommerce.Auth.Repository.PendingGoogleSetupRepository;
import com.ecommerce.Auth.Repository.PendingRegistrationRepository;
import com.ecommerce.Auth.Repository.UserRepository;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PendingRegistrationRepository pendingRepo;
    @Mock private PendingGoogleSetupRepository pendingGoogleSetupRepo;
    @Mock private PasswordResetTokenRepository resetTokenRepo;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtUtil jwtUtil;
    @Mock private EmailService emailService;

    // PasswordEncoder real — BCrypt é determinístico o suficiente para testes
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
            userRepository, pendingRepo, pendingGoogleSetupRepo, resetTokenRepo,
            passwordEncoder, authenticationManager, jwtUtil, emailService
        );
    }

    // ── initiateRegistration ──────────────────────────────────────

    @Test
    void initiateRegistration_duplicateEmail_throwsBusinessException() {
        when(userRepository.existsByEmail("dup@email.com")).thenReturn(true);

        var request = buildRegisterRequest("dup@email.com");

        assertThatThrownBy(() -> authService.initiateRegistration(request))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("E-mail já cadastrado");

        verify(pendingRepo, never()).save(any());
        verify(emailService, never()).sendVerificationCode(any(), any());
    }

    @Test
    void initiateRegistration_duplicateCpf_throwsBusinessException() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsByCpf("52998224725")).thenReturn(true);

        assertThatThrownBy(() -> authService.initiateRegistration(buildRegisterRequest("new@email.com")))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("CPF já cadastrado");
    }

    @Test
    void initiateRegistration_valid_savesPendingAndSendsEmail() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        when(userRepository.existsByCpf(any())).thenReturn(false);
        when(pendingRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        authService.initiateRegistration(buildRegisterRequest("new@email.com"));

        verify(pendingRepo).save(any(PendingRegistration.class));
        verify(emailService).sendVerificationCode(eq("new@email.com"), anyString());
    }

    // ── confirmRegistration ───────────────────────────────────────

    @Test
    void confirmRegistration_noPendingRecord_throwsBusinessException() {
        when(pendingRepo.findById("ghost@email.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.confirmRegistration(
            new ConfirmRegistrationRequest("ghost@email.com", "123456")))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Nenhum cadastro pendente");
    }

    @Test
    void confirmRegistration_expiredOtp_deletesAndThrows() {
        var pending = buildPendingRegistration("old@email.com", "123456");
        pending.setExpiresAt(Instant.now().minusSeconds(1)); // já expirou

        when(pendingRepo.findById("old@email.com")).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> authService.confirmRegistration(
            new ConfirmRegistrationRequest("old@email.com", "123456")))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("expirado");

        verify(pendingRepo).delete(pending);
        verify(userRepository, never()).save(any());
    }

    @Test
    void confirmRegistration_tooManyAttempts_deletesAndThrows() {
        var pending = buildPendingRegistration("locked@email.com", "654321");
        pending.setAttempts(5); // lockout

        when(pendingRepo.findById("locked@email.com")).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> authService.confirmRegistration(
            new ConfirmRegistrationRequest("locked@email.com", "654321")))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Muitas tentativas");

        verify(pendingRepo).delete(pending);
        verify(userRepository, never()).save(any());
    }

    @Test
    void confirmRegistration_wrongOtp_incrementsAttempts() {
        String realOtp = "111111";
        var pending = buildPendingRegistration("user@email.com", realOtp);

        when(pendingRepo.findById("user@email.com")).thenReturn(Optional.of(pending));
        when(pendingRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThatThrownBy(() -> authService.confirmRegistration(
            new ConfirmRegistrationRequest("user@email.com", "999999")))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("Código incorreto");

        // tentativas devem ter incrementado
        assertThat(pending.getAttempts()).isEqualTo(1);
    }

    @Test
    void confirmRegistration_validOtp_createsUserAndReturnsToken() {
        String otp = "123456";
        var pending = buildPendingRegistration("valid@email.com", otp);

        when(pendingRepo.findById("valid@email.com")).thenReturn(Optional.of(pending));
        when(userRepository.existsByEmail("valid@email.com")).thenReturn(false);
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return u;
        });
        when(jwtUtil.generateToken(any(), any())).thenReturn("jwt-token");

        // OTP correto precisa bater com o hash armazenado no pending
        // Aqui usamos o otp já encodado pelo BCrypt no buildPendingRegistration
        AuthResponse response = authService.confirmRegistration(
            new ConfirmRegistrationRequest("valid@email.com", otp));

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.email()).isEqualTo("valid@email.com");

        verify(userRepository).save(any(User.class));
        verify(pendingRepo).delete(pending);
    }

    // ── isAccountNonLocked ────────────────────────────────────────

    @Test
    void user_notLocked_isAccountNonLockedTrue() {
        var user = User.builder().email("u@test.com").locked(false).build();
        assertThat(user.isAccountNonLocked()).isTrue();
    }

    @Test
    void user_locked_isAccountNonLockedFalse() {
        var user = User.builder().email("u@test.com").locked(true).build();
        assertThat(user.isAccountNonLocked()).isFalse();
    }

    // ── helpers ───────────────────────────────────────────────────

    private RegisterRequest buildRegisterRequest(String email) {
        return new RegisterRequest(
            email, "Senha@12345", "Test User", "52998224725",
            LocalDate.of(1990, 1, 1), "11999999999",
            "Rua Teste 123", "São Paulo", "SP", "01310100"
        );
    }

    private PendingRegistration buildPendingRegistration(String email, String otp) {
        return PendingRegistration.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode("Senha@12345"))
            .otpHash(passwordEncoder.encode(otp))
            .expiresAt(Instant.now().plusSeconds(600))
            .attempts(0)
            .fullName("Test User")
            .cpf("52998224725")
            .phone("11999999999")
            .address("Rua Teste 123")
            .city("São Paulo")
            .state("SP")
            .zipCode("01310100")
            .build();
    }
}
