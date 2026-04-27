package com.ecommerce.Payment;

import com.ecommerce.Payment.Dto.CheckoutRequest;
import com.ecommerce.Payment.Dto.CheckoutResponse;
import com.ecommerce.Payment.Dto.CreateCheckoutSessionRequest;
import com.ecommerce.Payment.Dto.CheckoutSessionResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping("/api/payments/public-key")
    public ResponseEntity<Map<String, String>> getPublicKey() {
        String key = paymentService.getPublicKey();
        return ResponseEntity.ok(Map.of("publicKey", key));
    }

    @PostMapping("/api/checkout")
    public ResponseEntity<CheckoutResponse> processCheckout(@Valid @RequestBody CheckoutRequest request) {
        CheckoutResponse result = paymentService.processCheckout(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/api/checkout/session")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession(
            @Valid @RequestBody CreateCheckoutSessionRequest request) {
        CheckoutSessionResponse result = paymentService.createCheckoutSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // POST /api/payments/webhook
    // O PagSeguro envia HMAC-SHA256 do body no header x-pagseguro-signature.
    // O body é lido como String raw para que o HMAC seja calculado sobre os bytes originais.
    // Retorna 401 se a assinatura estiver ausente ou inválida.
    @PostMapping("/api/payments/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestHeader(value = "x-pagseguro-signature", required = false) String signature,
            @RequestBody String rawBody) {

        if (!paymentService.isValidWebhookSignature(rawBody, signature)) {
            log.warn("Webhook PagSeguro rejeitado — assinatura inválida ou ausente");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            Map<String, Object> payload = objectMapper.readValue(rawBody, new TypeReference<>() {});
            paymentService.handleWebhook(payload);
        } catch (Exception e) {
            log.error("Erro ao processar payload do webhook PagSeguro", e);
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok().build();
    }
}
