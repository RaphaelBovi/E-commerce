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

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;

    @PostMapping
    public ResponseEntity<UserAdminResponse> createAdmin(@Valid @RequestBody CreateAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminUserService.createAdmin(request));
    }

    @GetMapping
    public ResponseEntity<List<UserAdminResponse>> listAdmins() {
        return ResponseEntity.ok(adminUserService.listAdmins());
    }
}
