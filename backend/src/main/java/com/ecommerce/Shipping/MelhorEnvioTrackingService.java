package com.ecommerce.Shipping;

import com.ecommerce.Order.Entity.Dto.TrackingEventResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class MelhorEnvioTrackingService {

    @Value("${melhorenvio.token:}")
    private String token;

    @Value("${melhorenvio.api-url:https://melhorenvio.com.br}")
    private String apiUrl;

    private static final String USER_AGENT = "SuaLoja (raphael.bovi96@gmail.com)";

    private final RestClient restClient = RestClient.create();

    private static final ParameterizedTypeReference<Map<String, List<Map<String, Object>>>> RESPONSE_TYPE =
            new ParameterizedTypeReference<>() {};

    // Busca os eventos de rastreio de um código no Melhor Envio.
    // Retorna lista vazia se o token não está configurado, o código é inválido
    // ou a API está indisponível — nunca lança exceção para o chamador.
    public List<TrackingEventResponse> getTrackingEvents(String trackingCode) {
        if (token == null || token.isBlank()) {
            log.debug("MELHOR_ENVIO_TOKEN não configurado — rastreio ignorado");
            return List.of();
        }
        if (trackingCode == null || trackingCode.isBlank()) {
            return List.of();
        }

        try {
            Map<String, List<Map<String, Object>>> response = restClient.get()
                    .uri(apiUrl + "/api/v2/me/shipment/tracking?q=" + trackingCode)
                    .header("Authorization", "Bearer " + token)
                    .header("User-Agent", USER_AGENT)
                    .header("Accept", "application/json")
                    .retrieve()
                    .body(RESPONSE_TYPE);

            if (response == null) return List.of();

            // A API retorna um mapa com o código como chave; tenta a chave exata
            // e também a variante em maiúsculas (o Melhor Envio pode normalizar o código)
            List<Map<String, Object>> events = response.get(trackingCode);
            if (events == null) events = response.get(trackingCode.toUpperCase());
            if (events == null || events.isEmpty()) return List.of();

            return events.stream()
                    .map(e -> new TrackingEventResponse(
                            asString(e, "status"),
                            asString(e, "message"),
                            asString(e, "location"),
                            asString(e, "happened_at")
                    ))
                    .toList();

        } catch (Exception e) {
            log.warn("Falha ao consultar rastreio Melhor Envio para {}: {}", trackingCode, e.getMessage());
            return List.of();
        }
    }

    private static String asString(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v != null ? v.toString() : null;
    }
}
