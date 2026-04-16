// ─────────────────────────────────────────────────────────────────
// UserRepository.java — Repositório JPA para a entidade User
//
// Interface que estende JpaRepository e fornece operações CRUD
// padrão (save, findById, findAll, delete, etc.) além de consultas
// customizadas declaradas como métodos de interface — o Spring Data JPA
// gera automaticamente a implementação SQL em tempo de execução.
//
// Para adicionar novas consultas:
//   - Siga a convenção de nomenclatura Spring Data (findBy<Campo>, existsBy<Campo>, etc.)
//   - Ou use @Query com JPQL/SQL nativo para consultas mais complexas
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Auth.Repository;

import com.ecommerce.Auth.Entity.Role;
import com.ecommerce.Auth.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

// JpaRepository<User, UUID> — fornece CRUD completo para a entidade User,
// cuja chave primária é do tipo UUID
public interface UserRepository extends JpaRepository<User, UUID> {

    // Busca um usuário pelo e-mail — retorna Optional para forçar tratamento do caso "não encontrado"
    // Usado em: UserDetailsServiceImpl (autenticação) e AuthService (verificação de duplicata)
    Optional<User> findByEmail(String email);

    // Verifica se já existe um usuário com o e-mail informado — usado no cadastro para evitar duplicatas
    boolean existsByEmail(String email);

    // Verifica se já existe um usuário com o CPF informado — garante unicidade do CPF no sistema
    boolean existsByCpf(String cpf);

    // Retorna todos os usuários que possuem exatamente a role informada
    // Usado para listar, por exemplo, apenas CLIENTEs
    List<User> findByRole(Role role);

    // Retorna todos os usuários cuja role está dentro da lista informada
    // Usado em AdminUserService para listar ADMIN e MASTER juntos: findByRoleIn(List.of(ADMIN, MASTER))
    List<User> findByRoleIn(List<Role> roles);
}
