package com.ecommerce.Config;

import com.ecommerce.Product.Exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Slf4j
@Service
public class RecaptchaService {

    @Value("${google.recaptcha.secret:}")
    private String secret;

    private static final String VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
            new ParameterizedTypeReference<>() {};

    private final RestClient restClient = RestClient.create();

    // Verifica o token reCAPTCHA v2 com a API do Google.
    // Se o secret não estiver configurado, a verificação é ignorada (modo dev).
    public void verify(String token) {
        if (secret == null || secret.isBlank()) return;

        if (token == null || token.isBlank()) {
            throw new BusinessException("Verificação de segurança não concluída. Tente novamente.");
        }

        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("secret", secret);
            form.add("response", token);

            Map<String, Object> response = restClient.post()
                    .uri(VERIFY_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(MAP_TYPE);

            if (response == null || !Boolean.TRUE.equals(response.get("success"))) {
                log.warn("reCAPTCHA inválido. Resposta: {}", response);
                throw new BusinessException("Verificação de segurança falhou. Tente novamente.");
            }

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Erro ao verificar reCAPTCHA", e);
            throw new BusinessException("Não foi possível validar a verificação de segurança.");
        }
    }
}
