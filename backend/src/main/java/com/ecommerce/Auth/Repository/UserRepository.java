package com.ecommerce.Auth.Repository;

import com.ecommerce.Auth.Entity.Role;
import com.ecommerce.Auth.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByCpf(String cpf);
    List<User> findByRole(Role role);
    List<User> findByRoleIn(List<Role> roles);
}