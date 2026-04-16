// ─────────────────────────────────────────────────────────────────
// UserDetailsServiceImpl.java — Implementação do UserDetailsService do Spring Security
//
// O Spring Security chama este serviço internamente durante o processo
// de autenticação para carregar os dados do usuário a partir do banco
// de dados. A entidade User já implementa UserDetails (definindo
// getUsername(), getPassword() e getAuthorities()), por isso pode ser
// retornada diretamente.
//
// Também é utilizado pelo JwtAuthFilter para recuperar o usuário após
// validar o token JWT, garantindo que ele ainda exista no banco.
//
// Não é necessário alterar este arquivo para adicionar novos campos ao
// usuário — apenas User.java e UserRepository precisariam ser modificados.
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Auth.Service;

import com.ecommerce.Auth.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

// @Service — registra esta classe como um bean gerenciado pelo Spring,
// disponível para injeção em outros componentes (ex.: SecurityConfig, JwtAuthFilter)
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    // Repositório JPA para buscar o usuário no banco de dados
    @Autowired
    private UserRepository userRepository;

    // loadUserByUsername — método exigido pela interface UserDetailsService.
    // Apesar do nome "ByUsername", aqui o identificador é o e-mail do usuário.
    // Parâmetro: email — e-mail do usuário a ser autenticado
    // Retorno: UserDetails (a própria entidade User que implementa esta interface)
    // Lança: UsernameNotFoundException se nenhum usuário for encontrado com o e-mail informado
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
    }
}
