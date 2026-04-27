package com.ecommerce.Payment;

import com.ecommerce.Order.Entity.Order;
import com.ecommerce.Product.Exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class MercadoPagoService {

    private static final String API_BASE = "https://api.mercadopago.com";
    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
            new ParameterizedTypeReference<>() {};

    @Value("${mercadopago.access-token:}")
    private String accessToken;

    @Value("${mercadopago.notification-url:}")
    private String notificationUrl;

    @Value("${mercadopago.redirect-url:http://localhost:5173/minha-conta}")
    private String redirectUrl;

    private final RestClient restClient = RestClient.create();

    public record MpPaymentDetails(String externalReference, String status) {}

    // Cria uma preferência de pagamento e retorna a init_point (URL de redirecionamento)
    public String createPreference(Order order, String customerEmail) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new BusinessException("Token do Mercado Pago não configurado. Configure MERCADOPAGO_ACCESS_TOKEN.");
        }

        List<Map<String, Object>> items = order.getItems().stream()
                .map(item -> {
                    Map<String, Object> i = new LinkedHashMap<>();
                    i.put("id", item.getProductId() != null ? item.getProductId().toString() : "item");
                    i.put("title", item.getProductName());
                    i.put("quantity", item.getQuantity());
                    i.put("unit_price", item.getUnitPrice());
                    i.put("currency_id", "BRL");
                    return i;
                })
                .toList();

        Map<String, String> backUrls = new LinkedHashMap<>();
        backUrls.put("success", redirectUrl);
        backUrls.put("pending", redirectUrl);
        backUrls.put("failure", redirectUrl);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", items);
        body.put("payer", Map.of("email", customerEmail));
        body.put("back_urls", backUrls);
        body.put("auto_return", "approved");
        body.put("external_reference", order.getId().toString());
        if (notificationUrl != null && !notificationUrl.isBlank()) {
            body.put("notification_url", notificationUrl);
        }

        try {
            Map<String, Object> response = restClient.post()
                    .uri(API_BASE + "/checkout/preferences")
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(MAP_TYPE);

            if (response == null) {
                throw new BusinessException("Resposta vazia do Mercado Pago");
            }

            String initPoint = (String) response.get("init_point");
            if (initPoint == null) {
                throw new BusinessException("Mercado Pago não retornou URL de pagamento. Resposta: " + response);
            }

            log.info("Preferência Mercado Pago criada: {} para pedido {}", response.get("id"), order.getId());
            return initPoint;

        } catch (BusinessException e) {
            throw e;
        } catch (HttpClientErrorException e) {
            log.error("Mercado Pago 4xx [{}]: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException("Mercado Pago recusou a requisição (" + e.getStatusCode() + "): " + e.getResponseBodyAsString());
        } catch (HttpServerErrorException e) {
            log.error("Mercado Pago 5xx [{}]: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException("Serviço Mercado Pago indisponível (" + e.getStatusCode() + ")");
        } catch (Exception e) {
            log.error("Erro inesperado ao criar preferência Mercado Pago", e);
            throw new BusinessException("Não foi possível conectar ao Mercado Pago: " + e.getMessage());
        }
    }

    // Consulta o status de um pagamento pelo ID (usado no webhook)
    @SuppressWarnings("unchecked")
    public MpPaymentDetails getPaymentDetails(String paymentId) {
        if (accessToken == null || accessToken.isBlank()) return null;
        try {
            Map<String, Object> response = restClient.get()
                    .uri(API_BASE + "/v1/payments/" + paymentId)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(MAP_TYPE);

            if (response == null) return null;
            String externalRef = (String) response.get("external_reference");
            String status      = (String) response.get("status");
            return new MpPaymentDetails(externalRef, status);

        } catch (Exception e) {
            log.error("Erro ao consultar pagamento {} no Mercado Pago: {}", paymentId, e.getMessage());
            return null;
        }
    }
}
