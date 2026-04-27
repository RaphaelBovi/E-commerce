package com.ecommerce.Shipping;

import com.ecommerce.Product.Entity.ProductCategory;
import com.ecommerce.Product.Repository.ProductCategoryRepository;
import com.ecommerce.Shipping.Dto.FreightCalculateRequest;
import com.ecommerce.Shipping.Dto.FreightOption;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
public class FreightService {

    @Value("${melhorenvio.token:}")
    private String token;

    @Value("${melhorenvio.api-url:https://melhorenvio.com.br}")
    private String apiUrl;

    @Value("${melhorenvio.origin-zip:13417730}")
    private String originZip;

    private static final String USER_AGENT = "SuaLoja (raphael.bovi96@gmail.com)";

    private static final BigDecimal DEFAULT_WEIGHT = new BigDecimal("0.3");
    private static final int DEFAULT_WIDTH  = 15;
    private static final int DEFAULT_HEIGHT = 10;
    private static final int DEFAULT_LENGTH = 20;

    @Autowired
    private ProductCategoryRepository productRepository;

    private final RestClient restClient = RestClient.create();

    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_TYPE =
            new ParameterizedTypeReference<>() {};

    public List<FreightOption> calculate(FreightCalculateRequest req) {
        if (token == null || token.isBlank()) {
            log.warn("MELHOR_ENVIO_TOKEN não configurado — retornando frete padrão");
            return List.of(new FreightOption("Frete Padrão", "Entrega", BigDecimal.ZERO, 7));
        }

        BigDecimal totalWeight = BigDecimal.ZERO;
        int maxWidth = DEFAULT_WIDTH, maxHeight = DEFAULT_HEIGHT, maxLength = DEFAULT_LENGTH;

        for (FreightCalculateRequest.FreightItemRequest item : req.items()) {
            if (item.productId() == null) continue;
            Optional<ProductCategory> opt = productRepository.findById(item.productId());
            ProductCategory p = opt.orElse(null);

            BigDecimal w = (p != null && p.getWeightKg() != null) ? p.getWeightKg() : DEFAULT_WEIGHT;
            int width    = (p != null && p.getWidthCm()  != null) ? p.getWidthCm()  : DEFAULT_WIDTH;
            int height   = (p != null && p.getHeightCm() != null) ? p.getHeightCm() : DEFAULT_HEIGHT;
            int length   = (p != null && p.getLengthCm() != null) ? p.getLengthCm() : DEFAULT_LENGTH;

            totalWeight = totalWeight.add(w.multiply(BigDecimal.valueOf(item.quantity())));
            maxWidth    = Math.max(maxWidth,  width);
            maxHeight   = Math.max(maxHeight, height);
            maxLength   = Math.max(maxLength, length);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("from", Map.of("postal_code", originZip.replaceAll("\\D", "")));
        body.put("to",   Map.of("postal_code", req.zipCode().replaceAll("\\D", "")));
        body.put("package", Map.of(
                "height", maxHeight,
                "width",  maxWidth,
                "length", maxLength,
                "weight", totalWeight
        ));
        body.put("options", Map.of("receipt", false, "own_hand", false));

        try {
            List<Map<String, Object>> response = restClient.post()
                    .uri(apiUrl + "/api/v2/me/shipment/calculate")
                    .header("Authorization", "Bearer " + token)
                    .header("User-Agent", USER_AGENT)
                    .header("Accept", "application/json")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(LIST_TYPE);

            if (response == null || response.isEmpty()) return List.of();

            return response.stream()
                    .filter(opt -> opt.get("error") == null)
                    .map(this::toOption)
                    .filter(Objects::nonNull)
                    .toList();

        } catch (Exception e) {
            log.warn("Falha ao calcular frete Melhor Envio: {}", e.getMessage());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private FreightOption toOption(Map<String, Object> data) {
        try {
            String service = (String) data.get("name");
            String carrier = "Transportadora";
            Object comp = data.get("company");
            if (comp instanceof Map<?, ?> m) carrier = (String) ((Map<String, Object>) m).get("name");
            String priceStr = Objects.toString(data.get("price"), null);
            if (priceStr == null) return null;
            BigDecimal price = new BigDecimal(priceStr);
            Integer days = data.get("delivery_time") instanceof Number n ? n.intValue() : null;
            return new FreightOption(carrier, service, price, days);
        } catch (Exception e) {
            return null;
        }
    }
}
