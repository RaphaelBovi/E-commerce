package com.ecommerce.Config;

import com.ecommerce.Auth.Entity.Role;
import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminDataInitializer.class);

    @Value("${app.master.email:}")
    private String masterEmail;

    @Value("${app.master.password:}")
    private String masterPassword;

    @Value("${app.master.fullName:Master Admin}")
    private String masterFullName;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (masterEmail.isBlank() || masterPassword.isBlank()) {
            log.warn("APP_MASTER_EMAIL ou APP_MASTER_PASSWORD não configurados — usuário MASTER não será criado automaticamente.");
            return;
        }

        boolean masterExists = !userRepository.findByRole(Role.MASTER).isEmpty();
        if (masterExists) {
            log.info("Usuário MASTER já existe — nenhuma ação necessária.");
            return;
        }

        var master = User.builder()
                .email(masterEmail.trim())
                .password(passwordEncoder.encode(masterPassword))
                .role(Role.MASTER)
                .fullName(masterFullName.trim())
                .build();

        userRepository.save(master);
        log.info("Usuário MASTER criado com sucesso: {}", masterEmail);
    }
}
