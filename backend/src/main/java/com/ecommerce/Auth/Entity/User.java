package com.ecommerce.Auth.Entity;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.validator.constraints.br.CPF;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true, length = 11)
    @CPF
    private String cpf;

    private LocalDate birthDate;

    @Column(length = 11)
    private String phone;

    private String address;
    private String city;

    @Column(length = 2)
    private String state;

    @Column(length = 8)
    private String zipCode;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean NOT NULL DEFAULT false")
    private boolean googleAccount = false;

    // Suspensão de conta — controlada via dashboard (MASTER/ADMIN)
    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean NOT NULL DEFAULT false")
    private boolean locked = false;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !locked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    // equals/hashCode baseados apenas no id — evita LazyInitializationException
    // ao comparar entidades em coleções ou sets.
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User other)) return false;
        return id != null && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
