package com.ecommerce.Auth.Service;

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
    private PasswordEncoder passwordEncoder;

    public UserAdminResponse createAdmin(CreateAdminRequest request) {
        if (userRepository.existsByEmail(request.email().trim())) {
            throw new BusinessException("E-mail já cadastrado");
        }

        var user = User.builder()
                .email(request.email().trim())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.ADMIN)
                .fullName(request.fullName().trim())
                .build();

        userRepository.save(user);
        return toResponse(user);
    }

    public List<UserAdminResponse> listAdmins() {
        return userRepository.findByRoleIn(List.of(Role.ADMIN, Role.MASTER))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private UserAdminResponse toResponse(User user) {
        return new UserAdminResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name(),
                user.getCreatedAt()
        );
    }
}
