package com.ecommerce.Auth.Service;

// ─────────────────────────────────────────────────────────────────
// AdminUserService.java — Lógica de gerenciamento de admins
//
// Usado exclusivamente pelo painel MASTER.
// Permite criar contas ADMIN e listar todos os usuários administrativos.
//
// Diferença do AuthService.register():
//   - Não exige CPF, endereço, telefone etc.
//   - Atribui sempre Role.ADMIN (nunca CUSTOMER ou MASTER)
// ─────────────────────────────────────────────────────────────────

import com.ecommerce.Auth.Entity.Dto.CreateAdminRequest;
import com.ecommerce.Auth.Entity.Dto.UserAdminResponse;
import com.ecommerce.Auth.Entity.Role;
import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Repository.UserRepository;
import com.ecommerce.Product.Exception.BusinessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder; // BCrypt para hash da senha

    // ── CRIAR ADMIN ───────────────────────────────────────────────
    // Cria uma nova conta com Role.ADMIN (acesso ao painel, sem poder criar outros admins)
    // Campos obrigatórios: fullName, email, password
    // Para adicionar mais campos obrigatórios: edite CreateAdminRequest.java e User.java
    public UserAdminResponse createAdmin(CreateAdminRequest request) {

        // Impede e-mails duplicados no sistema
        if (userRepository.existsByEmail(request.email().trim())) {
            throw new BusinessException("E-mail já cadastrado");
        }

        // Cria o usuário sem dados de cliente (CPF, endereço etc. são opcionais no User)
        var user = User.builder()
                .email(request.email().trim())
                .password(passwordEncoder.encode(request.password())) // nunca salva em texto puro
                .role(Role.ADMIN) // sempre ADMIN — nunca MASTER nem CUSTOMER
                .fullName(request.fullName().trim())
                .build();

        userRepository.save(user);
        return toResponse(user);
    }

    // ── LISTAR ADMINS ─────────────────────────────────────────────
    // Retorna todos os usuários com papel ADMIN ou MASTER
    // Usado pelo dashboard na página de Usuários para exibir a tabela de contas
    public List<UserAdminResponse> listAdmins() {
        return userRepository.findByRoleIn(List.of(Role.ADMIN, Role.MASTER))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── MAPEAMENTO ────────────────────────────────────────────────
    // Converte User (entidade) → UserAdminResponse (DTO sem senha)
    private UserAdminResponse toResponse(User user) {
        return new UserAdminResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name(), // "ADMIN" ou "MASTER" como string
                user.getCreatedAt()
        );
    }
}
