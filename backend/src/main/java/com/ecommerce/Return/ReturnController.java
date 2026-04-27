package com.ecommerce.Return;

import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/returns")
public class ReturnController {

    @Autowired private ReturnService service;
    @Autowired private UserRepository userRepository;

    public record CreateReturnRequest(
            @NotNull UUID orderId,
            @NotNull ReturnReason reason,
            String itemsJson
    ) {}

    public record UpdateStatusRequest(
            @NotNull ReturnStatus status,
            String notes
    ) {}

    // POST /api/returns — customer submits a return request
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReturnDto create(@Valid @RequestBody CreateReturnRequest body) {
        return service.create(currentUser(), body.orderId(), body.reason(), body.itemsJson());
    }

    // GET /api/returns/my — customer sees their own returns
    @GetMapping("/my")
    public List<ReturnDto> myReturns() {
        return service.getMyReturns(currentUser());
    }

    // GET /api/returns/admin — admin list all returns
    @GetMapping("/admin")
    public List<ReturnDto> allReturns() {
        return service.getAll();
    }

    // PATCH /api/returns/admin/{id}/status — admin approves or rejects
    @PatchMapping("/admin/{id}/status")
    public ReturnDto updateStatus(@PathVariable UUID id, @Valid @RequestBody UpdateStatusRequest body) {
        return service.updateStatus(id, body.status(), body.notes());
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
    }
}
