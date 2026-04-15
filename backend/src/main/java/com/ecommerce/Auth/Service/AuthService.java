package com.ecommerce.Auth.Service;

import com.ecommerce.Auth.Entity.Dto.AuthResponse;
import com.ecommerce.Auth.Entity.Dto.LoginRequest;
import com.ecommerce.Auth.Entity.Dto.RegisterRequest;
import com.ecommerce.Auth.Entity.Dto.UserProfileResponse;
import com.ecommerce.Auth.Entity.Role;
import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Repository.UserRepository;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("Email já cadastrado");
        }

        String cpfDigits = digitsOnly(request.cpf());
        if (cpfDigits.length() != 11) {
            throw new BusinessException("CPF deve conter 11 dígitos");
        }
        if (userRepository.existsByCpf(cpfDigits)) {
            throw new BusinessException("CPF já cadastrado");
        }

        String phoneDigits = digitsOnly(request.phone());
        if (phoneDigits.length() < 10 || phoneDigits.length() > 11) {
            throw new BusinessException("Telefone deve ter 10 ou 11 dígitos");
        }

        String zipDigits = digitsOnly(request.zipCode());
        if (zipDigits.length() != 8) {
            throw new BusinessException("CEP deve conter 8 dígitos");
        }

        String stateUf = request.state().trim().toUpperCase();
        if (!stateUf.matches("[A-Z]{2}")) {
            throw new BusinessException("UF deve ter 2 letras");
        }

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

    public UserProfileResponse getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new com.ecommerce.Product.Exception.ResourceNotFoundException("Usuário não encontrado"));
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getCpf(),
                user.getBirthDate(),
                user.getPhone(),
                user.getAddress(),
                user.getCity(),
                user.getState(),
                user.getZipCode(),
                user.getRole().name(),
                user.getCreatedAt()
        );
    }

    private static String digitsOnly(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\D", "");
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (BadCredentialsException e) {
            log.warn("Tentativa de login com credenciais inválidas para: {}", request.email());
            throw e;
        }

        var user = userRepository.findByEmail(request.email()).orElseThrow();
        log.info("Login bem-sucedido: {}", request.email());

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }
}
