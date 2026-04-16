// ─────────────────────────────────────────────────────────────────
// JwtUtil.java — Utilitário para geração e validação de tokens JWT
//
// Responsável por:
//   1. Gerar tokens JWT assinados com HMAC-SHA (usando a chave secreta configurada)
//   2. Extrair o e-mail (subject) de um token válido
//   3. Validar se um token é íntegro e não expirou
//
// As configurações de segredo e tempo de expiração são lidas do
// arquivo application.properties / application.yml:
//   app.jwt.secret        → chave secreta (use ao menos 32 caracteres aleatórios)
//   app.jwt.expiration-ms → duração do token em milissegundos (ex.: 86400000 = 24h)
//
// Para adicionar novos claims ao token (ex.: userId):
//   1. Inclua .claim("userId", userId) em generateToken()
//   2. Crie um método extractUserId() seguindo o mesmo padrão de extractEmail()
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

// @Component — registra esta classe como bean Spring para ser injetada onde necessário
@Component
public class JwtUtil {

    // Chave secreta lida do application.properties (app.jwt.secret)
    // Deve ser longa e aleatória; nunca versionar em repositório público
    @Value("${app.jwt.secret}")
    private String secret;

    // Tempo de expiração do token em milissegundos, lido de app.jwt.expiration-ms
    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    // Constrói e retorna a SecretKey HMAC-SHA a partir da string secreta configurada.
    // Chamado internamente a cada operação para garantir uso consistente da chave.
    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // Gera um token JWT assinado contendo o e-mail como subject e a role como claim customizado.
    // Parâmetro: email — identificador do usuário (subject do token)
    // Parâmetro: role  — papel do usuário (ex.: "CUSTOMER", "ADMIN") incluído como claim "role"
    // Retorno: string do token JWT no formato header.payload.signature
    public String generateToken(String email, String role) {
        return Jwts.builder()
                .subject(email)                                              // define o "dono" do token
                .claim("role", role)                                         // claim personalizado com o papel
                .issuedAt(new Date())                                        // momento de emissão
                .expiration(new Date(System.currentTimeMillis() + expirationMs)) // prazo de validade
                .signWith(getKey())                                          // assina com HMAC-SHA
                .compact();                                                  // serializa para string
    }

    // Extrai o e-mail (subject) do token JWT.
    // Parâmetro: token — token JWT em formato string
    // Retorno: e-mail armazenado no campo "sub" do payload
    // Lança exceção se o token for inválido ou expirado
    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(getKey())       // verifica a assinatura com a chave secreta
                .build()
                .parseSignedClaims(token)   // faz o parse e valida expiração
                .getPayload()
                .getSubject();             // retorna o campo "sub" (e-mail)
    }

    // Verifica se o token é válido (assinatura correta e não expirado).
    // Parâmetro: token — token JWT em formato string
    // Retorno: true se válido, false se inválido ou expirado
    // O bloco try/catch captura qualquer exceção da biblioteca JJWT
    // (JwtException, IllegalArgumentException) sem propagá-la
    public boolean isTokenValid(String token) {
        try {
            Jwts.parser().verifyWith(getKey()).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
