package com.ecommerce.Config;

// ─────────────────────────────────────────────────────────────────
// AdminDataInitializer.java — Criação automática do usuário MASTER
//
// Executado uma única vez quando o servidor sobe (CommandLineRunner).
// Cria o primeiro usuário MASTER a partir de variáveis de ambiente.
//
// Variáveis de ambiente necessárias (configurar no Render):
//   APP_MASTER_EMAIL     — e-mail de login do master
//   APP_MASTER_PASSWORD  — senha forte (mín. 12 chars)
//   APP_MASTER_FULL_NAME — nome exibido (opcional, default: "Master Admin")
//
// Se já existir um usuário MASTER no banco, não faz nada.
// Para recriar o master: delete o usuário no banco e reinicie o servidor.
// ─────────────────────────────────────────────────────────────────

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

// @Component — registra esta classe como componente Spring (executado automaticamente na inicialização)
// CommandLineRunner — interface do Spring Boot que executa o método run() após o contexto estar pronto
@Component
public class AdminDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminDataInitializer.class);

    // @Value — injeta o valor da variável de ambiente APP_MASTER_EMAIL
    // A parte após ':' é o valor padrão (vazio = não configurado)
    @Value("${app.master.email:}")
    private String masterEmail;

    @Value("${app.master.password:}")
    private String masterPassword;

    @Value("${app.master.fullName:Master Admin}")
    private String masterFullName;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder; // BCrypt para proteger a senha

    // run() — executado automaticamente pelo Spring Boot após a aplicação iniciar
    // args — argumentos de linha de comando (não usados aqui)
    @Override
    public void run(String... args) {

        // Não faz nada se as variáveis de ambiente não foram configuradas
        if (masterEmail.isBlank() || masterPassword.isBlank()) {
            log.warn("APP_MASTER_EMAIL ou APP_MASTER_PASSWORD não configurados — usuário MASTER não será criado automaticamente.");
            return;
        }

        // Verifica se já existe algum MASTER no banco (evita duplicatas em cada restart)
        boolean masterExists = !userRepository.findByRole(Role.MASTER).isEmpty();
        if (masterExists) {
            log.info("Usuário MASTER já existe — nenhuma ação necessária.");
            return;
        }

        // Cria o usuário MASTER com apenas os campos essenciais
        // Campos de cliente (CPF, endereço etc.) são null — agora opcionais no User.java
        var master = User.builder()
                .email(masterEmail.trim())
                .password(passwordEncoder.encode(masterPassword)) // hash BCrypt
                .role(Role.MASTER)
                .fullName(masterFullName.trim())
                .build();

        userRepository.save(master);
        log.info("Usuário MASTER criado com sucesso: {}", masterEmail);
    }
}
