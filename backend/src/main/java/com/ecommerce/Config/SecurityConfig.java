package com.ecommerce.Config;

// ─────────────────────────────────────────────────────────────────
// SecurityConfig.java — Configuração de segurança da API
//
// Define QUEM pode acessar QUAL endpoint.
// Toda requisição passa pelo filtro JWT antes de chegar aqui.
//
// Hierarquia de acesso:
//   MASTER > ADMIN > CUSTOMER (autenticado) > Público
//
// Para adicionar um novo endpoint protegido:
//   1. Adicione uma linha .requestMatchers(...).hasRole("PAPEL")
//   2. Deve vir ANTES de .anyRequest().authenticated()
// ─────────────────────────────────────────────────────────────────

import com.ecommerce.Auth.Service.UserDetailsServiceImpl;
import com.ecommerce.Security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

// @Configuration — indica que esta classe configura beans do Spring
@Configuration
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter; // filtro que valida o token JWT em cada requisição

    @Autowired
    private UserDetailsServiceImpl userDetailsService; // carrega o usuário do banco pelo e-mail

    // Bean principal de segurança — define todas as regras de acesso
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Desabilita CSRF — não necessário em APIs stateless (JWT)
                .csrf(AbstractHttpConfigurer::disable)

                // Habilita CORS com as configurações definidas em CorsConfig (se existir)
                .cors(Customizer.withDefaults())

                // STATELESS — sem sessão no servidor; cada requisição precisa do JWT
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authenticationProvider(authenticationProvider())

                // Cabeçalhos de segurança HTTP
                .headers(headers -> headers
                        .frameOptions(frame -> frame.deny())               // impede iframe (clickjacking)
                        .contentTypeOptions(Customizer.withDefaults())     // previne MIME sniffing
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000))                // força HTTPS por 1 ano
                        .referrerPolicy(referrer -> referrer
                                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives("default-src 'none'; frame-ancestors 'none'"))
                )

                // ── Regras de autorização ──────────────────────────────
                // ORDEM IMPORTA: regras mais específicas devem vir antes das mais genéricas
                .authorizeHttpRequests(auth -> auth

                        // Público — qualquer pessoa pode acessar (sem token)
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/product-category", "/api/product-category/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()

                        // Produtos — leitura pública; escrita restrita a ADMIN ou MASTER
                        // Para restringir a leitura também: remova o permitAll() acima e adicione .authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/product-category/**").hasAnyRole("ADMIN", "MASTER")
                        .requestMatchers(HttpMethod.PUT, "/api/product-category/**").hasAnyRole("ADMIN", "MASTER")
                        .requestMatchers(HttpMethod.DELETE, "/api/product-category/**").hasAnyRole("ADMIN", "MASTER")

                        // Pedidos do cliente — qualquer usuário autenticado
                        .requestMatchers(HttpMethod.POST, "/api/orders").authenticated()
                        .requestMatchers("/api/orders/my/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/orders/my").authenticated()

                        // Pedidos admin — somente ADMIN ou MASTER
                        .requestMatchers("/api/orders/**").hasAnyRole("ADMIN", "MASTER")

                        // Gerenciamento de usuários — somente MASTER
                        // Para permitir que ADMIN também crie usuários: troque por hasAnyRole("ADMIN", "MASTER")
                        .requestMatchers("/api/admin/**").hasRole("MASTER")

                        // Qualquer outro endpoint exige autenticação (token válido)
                        .anyRequest().authenticated()
                )

                // Adiciona o filtro JWT ANTES do filtro de autenticação padrão do Spring
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Configura o provedor de autenticação com BCrypt e carregamento por e-mail
    @Bean
    DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    // BCrypt — algoritmo de hash de senha com salt automático
    // Para mudar o custo (velocidade do hash): new BCryptPasswordEncoder(12) — padrão é 10
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Expõe o AuthenticationManager como Bean para ser injetado no AuthService
    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
