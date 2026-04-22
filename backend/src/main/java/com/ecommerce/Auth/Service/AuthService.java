package com.ecommerce.Auth.Service;

import com.ecommerce.Auth.Entity.Dto.*;
import com.ecommerce.Auth.Entity.PendingRegistration;
import com.ecommerce.Auth.Entity.Role;
import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Repository.PendingRegistrationRepository;
import com.ecommerce.Auth.Repository.UserRepository;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import com.ecommerce.Security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Autowired private UserRepository userRepository;
    @Autowired private PendingRegistrationRepository pendingRepo;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private EmailService emailService;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    // ── INITIATE REGISTRATION ─────────────────────────────────────
    // Validates all data, stores pending registration and sends OTP.
    // Account is NOT created yet — only after confirmRegistration().
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
    // Verifies Google ID token, finds or creates user, returns JWT.
    public AuthResponse googleLogin(GoogleAuthRequest request) {
        Map<String, Object> claims = verifyGoogleToken(request.idToken());

        String email = String.valueOf(claims.get("email"));
        boolean emailVerified = Boolean.parseBoolean(String.valueOf(claims.getOrDefault("email_verified", "false")));

        if (!emailVerified) throw new BusinessException("E-mail do Google não verificado.");

        String name = String.valueOf(claims.getOrDefault("name", email.split("@")[0]));

        var user = userRepository.findByEmail(email).orElseGet(() -> {
            var newUser = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.CUSTOMER)
                    .fullName(name)
                    .googleAccount(true)
                    .build();
            userRepository.save(newUser);
            log.info("Novo usuário via Google: {}", email);
            return newUser;
        });

        log.info("Login via Google: {}", email);
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }

    // ── REGISTER (legacy — kept for backward compat / admin tooling) ──
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("Email já cadastrado");
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

        var user = User.builder()
                .email(request.email().trim())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.CUSTOMER)
                .fullName(request.fullName().trim())
                .cpf(cpfDigits)
                .birthDate(request.birthDate())
                .phone(phoneDigits)
                .address(request.address().trim())
                .city(request.city().trim())
                .state(stateUf)
                .zipCode(zipDigits)
                .build();

        userRepository.save(user);
        log.info("Novo usuário registrado: {}", request.email());

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

    private static String digitsOnly(String value) {
        if (value == null) return "";
        return value.replaceAll("\\D", "");
    }
}
