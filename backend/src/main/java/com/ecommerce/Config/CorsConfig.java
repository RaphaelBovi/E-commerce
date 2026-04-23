// ─────────────────────────────────────────────────────────────────
// CorsConfig.java — Configuração de CORS (Cross-Origin Resource Sharing)
//
// Define quais origens (domínios/frontends) podem fazer requisições
// ao backend. Sem esta configuração, os navegadores bloqueiam
// requisições vindas de origens diferentes (ex.: frontend em :3000
// tentando acessar API em :8080).
//
// As origens permitidas são lidas de application.properties:
//   app.cors.allowed-origins=http://localhost:3000,https://meusite.com
//   (separadas por vírgula)
//
// Para permitir novas origens:
//   - Adicione-as em app.cors.allowed-origins no properties (sem alterar código)
// Para adicionar novos métodos HTTP (ex.: PATCH):
//   - Inclua "PATCH" na lista de setAllowedMethods()
// Para adicionar novos headers permitidos (ex.: X-Custom-Header):
//   - Inclua na lista de setAllowedHeaders()
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Config;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

// @Configuration — indica que esta classe contém definições de beans Spring (@Bean)
// que serão registrados no contexto da aplicação na inicialização
@Configuration
public class CorsConfig {

    // Origens permitidas lidas de application.properties (app.cors.allowed-origins)
    // Exemplo: "http://localhost:3000,https://meuapp.com"
    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    // @Bean — registra o CorsConfigurationSource no contexto Spring para ser usado
    // pelo SecurityConfig ao configurar a política de CORS do Spring Security
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Converte a string de origens separadas por vírgula em uma lista,
        // removendo espaços em branco e entradas vazias
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList());

        // Métodos HTTP permitidos nas requisições cross-origin
        // OPTIONS é necessário para requisições "preflight" do navegador
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Headers que o frontend pode enviar nas requisições
        // Authorization → necessário para enviar o token JWT
        // Content-Type  → necessário para enviar JSON no body
        // Accept        → indica os tipos de resposta aceitos
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Captcha-Token"));

        // Permite o envio de cookies e headers de autenticação (Authorization) nas requisições cross-origin
        configuration.setAllowCredentials(true);

        // Aplica esta configuração de CORS para todos os caminhos da API ("/**")
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // Registra o CorsFilter no nível do servlet container, antes do Spring Security.
    // Isso garante que requisições OPTIONS (preflight) sejam respondidas corretamente
    // antes de qualquer verificação de autenticação ou autorização.
    @Bean
    FilterRegistrationBean<CorsFilter> corsFilterRegistration(CorsConfigurationSource corsConfigurationSource) {
        FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(new CorsFilter(corsConfigurationSource));
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }
}
