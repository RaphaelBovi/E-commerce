package com.ecommerce.Auth.Service;

// ─────────────────────────────────────────────────────────────────
// AuthService.java — Lógica de autenticação e cadastro
//
// Responsável por:
//   • Registrar novos clientes (validação + hash de senha + salvar no banco)
//   • Fazer login (verificar credenciais + gerar token JWT)
//   • Retornar o perfil do usuário autenticado
// ─────────────────────────────────────────────────────────────────

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

// @Service — marca esta classe como serviço Spring (camada de negócio)
// É injetada automaticamente nos Controllers que a referenciarem
@Service
public class AuthService {

    // Logger para registrar eventos importantes (logins, cadastros, erros)
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    // @Autowired — Spring injeta automaticamente as dependências abaixo
    @Autowired
    private UserRepository userRepository; // acesso ao banco de dados de usuários

    @Autowired
    private PasswordEncoder passwordEncoder; // BCrypt para hash de senhas

    @Autowired
    private AuthenticationManager authenticationManager; // gerencia autenticação do Spring Security

    @Autowired
    private JwtUtil jwtUtil; // utilitário para gerar e validar tokens JWT

    // ── CADASTRO ─────────────────────────────────────────────────
    // Cria um novo usuário com role CUSTOMER
    // Valida email único, CPF, telefone, CEP e estado antes de salvar
    public AuthResponse register(RegisterRequest request) {

        // Verifica se o e-mail já está em uso
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException("Email já cadastrado");
        }

        // Remove tudo que não é número do CPF (ex: "123.456.789-09" → "12345678909")
        String cpfDigits = digitsOnly(request.cpf());
        if (cpfDigits.length() != 11) {
            throw new BusinessException("CPF deve conter 11 dígitos");
        }

        // Verifica se o CPF já pertence a outro usuário
        if (userRepository.existsByCpf(cpfDigits)) {
            throw new BusinessException("CPF já cadastrado");
        }

        // Remove formatação do telefone e valida o tamanho
        String phoneDigits = digitsOnly(request.phone());
        if (phoneDigits.length() < 10 || phoneDigits.length() > 11) {
            throw new BusinessException("Telefone deve ter 10 ou 11 dígitos");
        }

        // Remove formatação do CEP e valida o tamanho
        String zipDigits = digitsOnly(request.zipCode());
        if (zipDigits.length() != 8) {
            throw new BusinessException("CEP deve conter 8 dígitos");
        }

        // Valida que o estado seja exatamente 2 letras maiúsculas (ex: "SP", "RJ")
        String stateUf = request.state().trim().toUpperCase();
        if (!stateUf.matches("[A-Z]{2}")) {
            throw new BusinessException("UF deve ter 2 letras");
        }

        // Constrói o objeto User com todos os campos validados
        // passwordEncoder.encode() aplica BCrypt — nunca salva a senha em texto puro
        // Role.CUSTOMER — todo cadastro via frontend é sempre cliente
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

        userRepository.save(user); // persiste no banco
        log.info("Novo usuário registrado: {}", request.email());

        // Gera o token JWT e retorna junto com o e-mail e papel do usuário
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }

    // ── PERFIL ────────────────────────────────────────────────────
    // Retorna os dados do usuário que está fazendo a requisição
    // O Spring Security já validou o token JWT antes de chegar aqui
    public UserProfileResponse getProfile() {
        // Recupera o e-mail do usuário autenticado a partir do contexto de segurança
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new com.ecommerce.Product.Exception.ResourceNotFoundException("Usuário não encontrado"));

        // Mapeia o User para o DTO de resposta (não expõe a senha)
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

    // ── LOGIN ─────────────────────────────────────────────────────
    // Verifica as credenciais e retorna um token JWT se válidas
    public AuthResponse login(LoginRequest request) {
        try {
            // O AuthenticationManager verifica e-mail e senha contra o banco
            // Lança BadCredentialsException se inválidos
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (BadCredentialsException e) {
            log.warn("Tentativa de login com credenciais inválidas para: {}", request.email());
            throw e;
        }

        // Busca o usuário para obter o papel (role) e gerar o token correto
        var user = userRepository.findByEmail(request.email()).orElseThrow();
        log.info("Login bem-sucedido: {}", request.email());

        // Gera o JWT com e-mail e papel do usuário (válido por N horas, definido em JwtUtil)
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }

    // ── UTILITÁRIO ────────────────────────────────────────────────
    // Remove todos os caracteres não numéricos de uma string
    // Ex: "123.456.789-09" → "12345678909" | "(11) 99999-9999" → "11999999999"
    private static String digitsOnly(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\D", ""); // \\D = qualquer caractere que não seja dígito
    }
}
