// ─────────────────────────────────────────────────────────────────
// AdminUserController.java — Controller REST para gerenciamento de administradores
//
// Expõe endpoints protegidos sob /api/admin/users que permitem ao
// MASTER criar novos admins e listar todos os usuários com perfil
// administrativo. O acesso a esta rota deve ser restringido na
// SecurityConfig apenas para a role MASTER.
//
// Para adicionar novos endpoints (ex.: deletar admin, promover usuário):
//   1. Crie o método correspondente em AdminUserService
//   2. Adicione o método aqui com a anotação HTTP adequada (@DeleteMapping, etc.)
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Auth.Controller;

import com.ecommerce.Auth.Entity.Dto.CreateAdminRequest;
import com.ecommerce.Auth.Entity.Dto.UserAdminResponse;
import com.ecommerce.Auth.Service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// @RestController — indica que esta classe é um controller REST;
// combina @Controller + @ResponseBody, serializando as respostas em JSON automaticamente
@RestController
// @RequestMapping — define o prefixo de URL para todos os endpoints desta classe
@RequestMapping("/api/admin/users")
public class AdminUserController {

    // Injeção de dependência do serviço que contém a lógica de negócio para admins
    @Autowired
    private AdminUserService adminUserService;

    // POST /api/admin/users
    // Cria um novo usuário com role ADMIN.
    // @Valid — aciona a validação dos campos anotados em CreateAdminRequest antes de processar.
    // @RequestBody — desserializa o JSON da requisição para o record CreateAdminRequest.
    // Retorna 201 CREATED com os dados do admin recém-criado.
    @PostMapping
    public ResponseEntity<UserAdminResponse> createAdmin(@Valid @RequestBody CreateAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminUserService.createAdmin(request));
    }

    // GET /api/admin/users
    // Retorna a lista de todos os usuários com roles ADMIN e MASTER.
    // Retorna 200 OK com a lista de UserAdminResponse.
    @GetMapping
    public ResponseEntity<List<UserAdminResponse>> listAdmins() {
        return ResponseEntity.ok(adminUserService.listAdmins());
    }
}
