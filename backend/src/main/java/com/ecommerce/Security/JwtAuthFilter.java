// ─────────────────────────────────────────────────────────────────
// JwtAuthFilter.java — Filtro de autenticação JWT para cada requisição HTTP
//
// Intercepta toda requisição recebida pelo servidor exatamente uma vez
// (graças à extensão de OncePerRequestFilter) e executa o seguinte fluxo:
//
//   1. Lê o header "Authorization" da requisição
//   2. Se ausente ou sem prefixo "Bearer ", repassa a requisição sem autenticar
//   3. Extrai o token JWT (remove o prefixo "Bearer ")
//   4. Valida o token com JwtUtil.isTokenValid()
//   5. Se válido, carrega o usuário do banco via UserDetailsService
//   6. Cria um objeto de autenticação e o insere no SecurityContext do Spring
//
// O SecurityContext autenticado permite que o Spring Security libere
// o acesso aos endpoints protegidos para esta requisição.
//
// Este filtro é registrado na cadeia de filtros em SecurityConfig.
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// @Component — registra o filtro como bean Spring para ser injetado em SecurityConfig
@Component
// OncePerRequestFilter — garante que doFilterInternal() seja chamado exatamente
// uma vez por requisição, mesmo em cadeias de filtros que redirecionam internamente
public class JwtAuthFilter extends OncePerRequestFilter {

    // Utilitário para validar e extrair informações do token JWT
    @Autowired
    private JwtUtil jwtUtil;

    // Serviço para carregar os dados do usuário a partir do banco (implementado em UserDetailsServiceImpl)
    @Autowired
    private UserDetailsService userDetailsService;

    // Método principal do filtro — executado a cada requisição HTTP.
    // Parâmetro: request     — requisição HTTP recebida
    // Parâmetro: response    — resposta HTTP a ser enviada
    // Parâmetro: filterChain — cadeia de filtros; chamar doFilter() passa para o próximo filtro
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Lê o header Authorization da requisição (ex.: "Bearer eyJhbGci...")
        String authHeader = request.getHeader("Authorization");

        // Se o header não existir ou não começar com "Bearer ", a requisição não possui JWT.
        // O filtro passa adiante sem autenticar — o Spring Security decidirá se o recurso é público ou não.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Remove o prefixo "Bearer " (7 caracteres) para obter apenas o token JWT
        String token = authHeader.substring(7);

        // Valida o token: verifica assinatura e expiração
        if (jwtUtil.isTokenValid(token)) {
            // Extrai o e-mail do subject do token
            String email = jwtUtil.extractEmail(token);

            // Carrega os dados do usuário do banco (inclui authorities/roles)
            var userDetails = userDetailsService.loadUserByUsername(email);

            // Cria o objeto de autenticação com as authorities do usuário (roles)
            // O segundo parâmetro (credentials) é null pois a senha não é necessária após validação do JWT
            var authToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
            );

            // Adiciona detalhes extras da requisição (IP, session) ao objeto de autenticação
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // Registra a autenticação no SecurityContext, liberando acesso aos recursos protegidos
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        // Passa a requisição para o próximo filtro da cadeia (ex.: filtros de autorização do Spring Security)
        filterChain.doFilter(request, response);
    }
}
