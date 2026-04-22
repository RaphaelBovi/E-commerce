package com.ecommerce.Auth.Entity;

// ─────────────────────────────────────────────────────────────────
// User.java — Entidade principal de usuário
//
// Representa a tabela "users" no banco de dados.
// Todo usuário do sistema (cliente, admin ou master) é armazenado aqui.
// Implementa UserDetails do Spring Security para integrar com autenticação JWT.
// ─────────────────────────────────────────────────────────────────

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.validator.constraints.br.CPF;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

// @Entity — avisa ao Hibernate que esta classe é uma tabela no banco
// @Table(name = "users") — nome explícito da tabela (evita conflito com palavra reservada SQL "user")
// @Data — Lombok: gera getters, setters, equals, hashCode e toString automaticamente
// @Builder — Lombok: permite criar objetos via User.builder().campo(valor).build()
// @NoArgsConstructor / @AllArgsConstructor — Lombok: construtores necessários para JPA e Builder
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    // Identificador único gerado automaticamente (UUID = string longa aleatória)
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // E-mail único por usuário — usado como login
    @Column(nullable = false, unique = true)
    private String email;

    // Senha sempre armazenada com hash BCrypt (nunca em texto puro)
    @Column(nullable = false)
    private String password;

    // Papel do usuário: CUSTOMER, ADMIN ou MASTER
    // Determina o nível de acesso em todo o sistema
    @Enumerated(EnumType.STRING) // salva "CUSTOMER", "ADMIN" ou "MASTER" como texto no banco
    @Column(nullable = false)
    private Role role;

    // Data/hora de criação — definida automaticamente pelo @PrePersist
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    // Nome completo do usuário
    @Column(nullable = false)
    private String fullName;

    // CPF — nullable para que contas admin/master não precisem de CPF de cliente
    // @CPF do Hibernate Validator valida o formato quando o valor estiver presente
    @Column(unique = true, length = 11)
    @CPF
    private String cpf;

    // Data de nascimento — opcional para contas administrativas
    private LocalDate birthDate;

    // Telefone — opcional para contas administrativas
    @Column(length = 11)
    private String phone;

    // Endereço de entrega — opcional para contas administrativas
    private String address;

    // Cidade — opcional para contas administrativas
    private String city;

    // Estado (UF, ex: "SP") — opcional para contas administrativas
    @Column(length = 2)
    private String state;

    // CEP — opcional para contas administrativas
    @Column(length = 8)
    private String zipCode;

    // true quando a conta foi criada via Google OAuth (sem senha própria no cadastro)
    @Builder.Default
    @Column(nullable = false)
    private boolean googleAccount = false;

    // @PrePersist — executado automaticamente pelo JPA antes de salvar o registro pela primeira vez
    // Define a data de criação com o horário atual
    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }

    // ── Métodos do Spring Security ────────────────────────────────
    // O Spring Security usa esses métodos para saber as permissões e o estado do usuário

    // Retorna a lista de papéis/permissões do usuário
    // O prefixo "ROLE_" é obrigatório pelo Spring Security (ex: "ROLE_ADMIN")
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    // O Spring Security usa o e-mail como "nome de usuário" (username)
    @Override
    public String getUsername() {
        return email;
    }

    // Conta válida (não expirada)
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // Conta não bloqueada
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    // Credenciais não expiradas
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // Conta ativa
    @Override
    public boolean isEnabled() {
        return true;
    }
}
