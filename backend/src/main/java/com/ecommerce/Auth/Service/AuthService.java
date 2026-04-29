package com.ecommerce.Auth.Service;

import com.ecommerce.Auth.Entity.Dto.*;
import com.ecommerce.Auth.Entity.PasswordResetToken;
import com.ecommerce.Auth.Entity.PendingGoogleSetup;
import com.ecommerce.Auth.Entity.PendingRegistration;
import com.ecommerce.Auth.Entity.Role;
import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Repository.PasswordResetTokenRepository;
import com.ecommerce.Auth.Repository.PendingGoogleSetupRepository;
import com.ecommerce.Auth.Repository.PendingRegistrationRepository;
import com.ecommerce.Auth.Repository.UserRepository;
import com.ecommerce.Favorite.Repository.FavoriteRepository;
import com.ecommerce.Order.Repository.OrderRepository;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import com.ecommerce.Review.ReviewRepository;
import com.ecommerce.Security.JwtUtil;
import com.ecommerce.Ticket.Repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PendingRegistrationRepository pendingRepo;
    private final PendingGoogleSetupRepository pendingGoogleSetupRepo;
    private final PasswordResetTokenRepository resetTokenRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    // Injetados via campo para não afetar o construtor (e o AuthServiceTest)
    @Autowired private OrderRepository orderRepository;
    @Autowired private FavoriteRepository favoriteRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private TicketRepository ticketRepository;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    // ── INITIATE REGISTRATION ─────────────────────────────────────
    // Validates all data, stores pending registration and sends OTP.
    // Account is NOT created yet — only after confirmRegistration().
    @Transactional
    public void initiateRegistration(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException("E-mail já cadastrado");
        }

        String cpfDigits = digitsOnly(request.cpf());
        if (cpfDigits.length() != 11) throw new BusinessException("CPF deve conter 11 dígitos");
        if (userRepository.existsByCpf(cpfDigits)) throw new BusinessException("CPF já cadastrado");

        String phoneDigits = digitsOnly(request.phone());
        if (phoneDigits.length() < 10 || phoneDigits.length() > 11) {
            throw new BusinessException("Telefone deve ter 10 ou 11 dígitos");
        }

        String zipDigits = digitsOnly(request.zipCode());
        if (zipDigits.length() != 8) throw new BusinessException("CEP deve conter 8 dígitos");

        String stateUf = request.state().trim().toUpperCase();
        if (!stateUf.matches("[A-Z]{2}")) throw new BusinessException("UF deve ter 2 letras");

        String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));

        var pending = PendingRegistration.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .otpHash(passwordEncoder.encode(otp))
                .expiresAt(Instant.now().plusSeconds(600))
                .attempts(0)
                .fullName(request.fullName().trim())
                .cpf(cpfDigits)
                .birthDate(request.birthDate())
                .phone(phoneDigits)
                .address(request.address().trim())
                .city(request.city().trim())
                .state(stateUf)
                .zipCode(zipDigits)
                .build();

        pendingRepo.save(pending);
        emailService.sendVerificationCode(email, otp);
        log.info("Registro iniciado para: {}", email);
    }

    // ── CONFIRM REGISTRATION ──────────────────────────────────────
    // Verifies OTP, creates the user account and returns JWT.
    @Transactional
    public AuthResponse confirmRegistration(ConfirmRegistrationRequest request) {
        String email = request.email().trim().toLowerCase();

        var pending = pendingRepo.findById(email)
                .orElseThrow(() -> new BusinessException(
                        "Nenhum cadastro pendente para este e-mail. Inicie o processo novamente."));

        if (Instant.now().isAfter(pending.getExpiresAt())) {
            pendingRepo.delete(pending);
            throw new BusinessException("Código expirado. Inicie o cadastro novamente.");
        }

        if (pending.getAttempts() >= 5) {
            pendingRepo.delete(pending);
            throw new BusinessException("Muitas tentativas incorretas. Inicie o cadastro novamente.");
        }

        if (!passwordEncoder.matches(request.code(), pending.getOtpHash())) {
            pending.setAttempts(pending.getAttempts() + 1);
            pendingRepo.save(pending);
            int remaining = 5 - pending.getAttempts();
            throw new BusinessException("Código incorreto. " + remaining + " tentativa(s) restante(s).");
        }

        if (userRepository.existsByEmail(email)) {
            pendingRepo.delete(pending);
            throw new BusinessException("E-mail já cadastrado.");
        }

        var user = User.builder()
                .email(pending.getEmail())
                .password(pending.getPasswordHash())
                .role(Role.CUSTOMER)
                .fullName(pending.getFullName())
                .cpf(pending.getCpf())
                .birthDate(pending.getBirthDate())
                .phone(pending.getPhone())
                .address(pending.getAddress())
                .city(pending.getCity())
                .state(pending.getState())
                .zipCode(pending.getZipCode())
                .build();

        userRepository.save(user);
        pendingRepo.delete(pending);
        log.info("Cadastro confirmado: {}", email);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }

    // ── GOOGLE LOGIN ──────────────────────────────────────────────
    // Verifies Google ID token.
    // Existing user → returns JWT immediately.
    // New user      → creates a PendingGoogleSetup and returns setupToken.
    @Transactional
    public GoogleAuthResponse googleLogin(GoogleAuthRequest request) {
        Map<String, Object> claims = verifyGoogleToken(request.idToken());

        String email = String.valueOf(claims.get("email"));
        boolean emailVerified = Boolean.parseBoolean(String.valueOf(claims.getOrDefault("email_verified", "false")));
        if (!emailVerified) throw new BusinessException("E-mail do Google não verificado.");

        String name = String.valueOf(claims.getOrDefault("name", email.split("@")[0]));

        var existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            var user = existing.get();
            log.info("Login via Google (conta existente): {}", email);
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
            return new GoogleAuthResponse(false, token, user.getEmail(), user.getRole().name(), null, null);
        }

        // First access with this Google account — create pending setup record
        String setupToken = UUID.randomUUID().toString();
        var pending = PendingGoogleSetup.builder()
                .email(email)
                .fullName(name)
                .setupToken(setupToken)
                .expiresAt(Instant.now().plusSeconds(600))
                .attempts(0)
                .build();
        pendingGoogleSetupRepo.save(pending);
        log.info("Novo usuário Google detectado, setup pendente: {}", email);
        return new GoogleAuthResponse(true, null, email, null, name, setupToken);
    }

    // ── GOOGLE SETUP — define senha e envia OTP ───────────────────
    @Transactional
    public void googleSetup(GoogleSetupRequest request) {
        String email = request.email().trim().toLowerCase();

        var pending = pendingGoogleSetupRepo.findById(email)
                .orElseThrow(() -> new BusinessException(
                        "Sessão expirada. Faça login com Google novamente."));

        if (Instant.now().isAfter(pending.getExpiresAt())) {
            pendingGoogleSetupRepo.delete(pending);
            throw new BusinessException("Sessão expirada. Faça login com Google novamente.");
        }

        if (!pending.getSetupToken().equals(request.setupToken())) {
            throw new BusinessException("Token inválido. Faça login com Google novamente.");
        }

        if (request.fullName() != null && !request.fullName().isBlank()) {
            pending.setFullName(request.fullName().trim());
        }

        String otp = String.format("%06d", new java.security.SecureRandom().nextInt(1_000_000));
        pending.setPasswordHash(passwordEncoder.encode(request.password()));
        pending.setOtpHash(passwordEncoder.encode(otp));
        pending.setExpiresAt(Instant.now().plusSeconds(600));
        pendingGoogleSetupRepo.save(pending);

        emailService.sendVerificationCode(email, otp);
        log.info("OTP de setup Google enviado para: {}", email);
    }

    // ── GOOGLE SETUP CONFIRM — verifica OTP e cria a conta ────────
    @Transactional
    public AuthResponse googleSetupConfirm(GoogleSetupConfirmRequest request) {
        String email = request.email().trim().toLowerCase();

        var pending = pendingGoogleSetupRepo.findById(email)
                .orElseThrow(() -> new BusinessException(
                        "Sessão expirada. Faça login com Google novamente."));

        if (Instant.now().isAfter(pending.getExpiresAt())) {
            pendingGoogleSetupRepo.delete(pending);
            throw new BusinessException("Código expirado. Inicie o processo novamente.");
        }

        if (!pending.getSetupToken().equals(request.setupToken())) {
            throw new BusinessException("Token inválido. Faça login com Google novamente.");
        }

        if (pending.getAttempts() >= 5) {
            pendingGoogleSetupRepo.delete(pending);
            throw new BusinessException("Muitas tentativas incorretas. Inicie o processo novamente.");
        }

        if (!passwordEncoder.matches(request.code(), pending.getOtpHash())) {
            pending.setAttempts(pending.getAttempts() + 1);
            pendingGoogleSetupRepo.save(pending);
            int remaining = 5 - pending.getAttempts();
            throw new BusinessException("Código incorreto. " + remaining + " tentativa(s) restante(s).");
        }

        // Race condition guard — e-mail already registered
        if (userRepository.existsByEmail(email)) {
            pendingGoogleSetupRepo.delete(pending);
            var user = userRepository.findByEmail(email).orElseThrow();
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
            return new AuthResponse(token, user.getEmail(), user.getRole().name());
        }

        var user = User.builder()
                .email(email)
                .password(pending.getPasswordHash())
                .role(Role.CUSTOMER)
                .fullName(pending.getFullName())
                .googleAccount(true)
                .build();

        userRepository.save(user);
        pendingGoogleSetupRepo.delete(pending);
        log.info("Conta criada via Google setup: {}", email);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }

    // ── PROFILE ───────────────────────────────────────────────────
    public UserProfileResponse getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        return toProfileResponse(user);
    }

    // ── UPDATE PROFILE ────────────────────────────────────────────
    public UserProfileResponse updateProfile(UpdateProfileRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        user.setFullName(request.fullName().trim());

        // CPF só pode ser definido se o usuário ainda não tiver um (conta Google sem CPF)
        if (request.cpf() != null && !request.cpf().isBlank() && user.getCpf() == null) {
            String cpfDigits = digitsOnly(request.cpf());
            if (cpfDigits.length() != 11) throw new BusinessException("CPF deve conter 11 dígitos");
            if (userRepository.existsByCpf(cpfDigits)) throw new BusinessException("CPF já cadastrado");
            user.setCpf(cpfDigits);
        }

        if (request.phone() != null && !request.phone().isBlank()) {
            String phoneDigits = digitsOnly(request.phone());
            if (phoneDigits.length() < 10 || phoneDigits.length() > 11) {
                throw new BusinessException("Telefone deve ter 10 ou 11 dígitos");
            }
            user.setPhone(phoneDigits);
        }
        if (request.birthDate() != null) user.setBirthDate(request.birthDate());
        if (request.address() != null) user.setAddress(request.address().trim());
        if (request.city() != null) user.setCity(request.city().trim());
        if (request.state() != null && !request.state().isBlank()) {
            String stateUf = request.state().trim().toUpperCase();
            if (!stateUf.matches("[A-Z]{2}")) throw new BusinessException("UF deve ter 2 letras");
            user.setState(stateUf);
        }
        if (request.zipCode() != null && !request.zipCode().isBlank()) {
            String zipDigits = digitsOnly(request.zipCode());
            if (zipDigits.length() != 8) throw new BusinessException("CEP deve conter 8 dígitos");
            user.setZipCode(zipDigits);
        }

        userRepository.save(user);
        log.info("Perfil atualizado: {}", email);
        return toProfileResponse(user);
    }

    // ── CHANGE PASSWORD ───────────────────────────────────────────
    public void changePassword(ChangePasswordRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (!user.isGoogleAccount()) {
            // Contas normais precisam confirmar a senha atual
            if (request.currentPassword() == null || request.currentPassword().isBlank()) {
                throw new BusinessException("Senha atual é obrigatória");
            }
            if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
                throw new BusinessException("Senha atual incorreta");
            }
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        log.info("Senha alterada: {}", email);
    }

    // ── LOGIN ─────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        } catch (BadCredentialsException e) {
            log.warn("Credenciais inválidas para: {}", request.email());
            throw e;
        }
        var user = userRepository.findByEmail(request.email()).orElseThrow();
        log.info("Login bem-sucedido: {}", request.email());
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }

    // ── FORGOT PASSWORD ───────────────────────────────────────────
    // Always returns silently even when email is not found (prevents enumeration).
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.email().trim().toLowerCase();

        // Silently ignore unknown emails — don't reveal whether email is registered
        if (!userRepository.existsByEmail(email)) {
            log.info("Solicitação de reset para e-mail não cadastrado: {}", email);
            return;
        }

        // Replace any existing token for this email
        resetTokenRepo.deleteById(email);

        String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));

        var token = PasswordResetToken.builder()
                .email(email)
                .tokenHash(passwordEncoder.encode(otp))
                .expiresAt(Instant.now().plusSeconds(900)) // 15 minutes
                .attempts(0)
                .build();

        resetTokenRepo.save(token);
        emailService.sendPasswordResetCode(email, otp);
        log.info("Código de redefinição enviado para: {}", email);
    }

    // ── RESET PASSWORD ────────────────────────────────────────────
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.email().trim().toLowerCase();

        var tokenEntry = resetTokenRepo.findById(email)
                .orElseThrow(() -> new BusinessException(
                        "Nenhuma solicitação de redefinição ativa para este e-mail. Solicite novamente."));

        if (Instant.now().isAfter(tokenEntry.getExpiresAt())) {
            resetTokenRepo.delete(tokenEntry);
            throw new BusinessException("Código expirado. Solicite a redefinição novamente.");
        }

        if (tokenEntry.getAttempts() >= 5) {
            resetTokenRepo.delete(tokenEntry);
            throw new BusinessException("Muitas tentativas incorretas. Solicite a redefinição novamente.");
        }

        if (!passwordEncoder.matches(request.token(), tokenEntry.getTokenHash())) {
            tokenEntry.setAttempts(tokenEntry.getAttempts() + 1);
            resetTokenRepo.save(tokenEntry);
            int remaining = 5 - tokenEntry.getAttempts();
            throw new BusinessException("Código incorreto. " + remaining + " tentativa(s) restante(s).");
        }

        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        resetTokenRepo.delete(tokenEntry);

        log.info("Senha redefinida com sucesso para: {}", email);

        // Fire-and-forget: failure here must not roll back the password change
        try {
            emailService.sendPasswordChangedNotification(email, user.getFullName());
        } catch (Exception e) {
            log.error("Falha ao enviar notificação de senha alterada para {}: {}", email, e.getMessage());
        }
    }

    // ── HELPERS ───────────────────────────────────────────────────

    private UserProfileResponse toProfileResponse(User user) {
        return new UserProfileResponse(
                user.getId(), user.getEmail(), user.getFullName(), user.getCpf(),
                user.getBirthDate(), user.getPhone(), user.getAddress(), user.getCity(),
                user.getState(), user.getZipCode(), user.getRole().name(), user.getCreatedAt(),
                user.isGoogleAccount());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> verifyGoogleToken(String idToken) {
        try {
            var client = HttpClient.newHttpClient();
            var req = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken))
                    .GET().build();
            var res = client.send(req, HttpResponse.BodyHandlers.ofString());

            if (res.statusCode() != 200) throw new BusinessException("Token Google inválido.");

            Map<String, Object> claims = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(res.body(), Map.class);

            if (!googleClientId.isBlank()) {
                Object aud = claims.get("aud");
                if (!googleClientId.equals(String.valueOf(aud))) {
                    throw new BusinessException("Token Google inválido.");
                }
            }
            return claims;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Falha na verificação do token Google: {}", e.getMessage());
            throw new BusinessException("Não foi possível autenticar com o Google. Tente novamente.");
        }
    }

    // ── DELETE ACCOUNT ────────────────────────────────────────────
    @Transactional
    public void deleteAccount() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
        UUID userId = user.getId();

        // Mantém pedidos mas remove a referência ao usuário (histórico preservado)
        orderRepository.disassociateUserFromOrders(userId, email);
        // Remove dados pessoais vinculados diretamente ao usuário
        favoriteRepository.deleteByUserId(userId);
        reviewRepository.deleteByUserId(userId);
        ticketRepository.deleteByUserId(userId);

        userRepository.delete(user);
    }

    private static String digitsOnly(String value) {
        if (value == null) return "";
        return value.replaceAll("\\D", "");
    }
}
