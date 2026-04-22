package com.ecommerce.Payment;

import com.ecommerce.Payment.Dto.CheckoutRequest;
import com.ecommerce.Payment.Dto.CheckoutResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    // GET /api/payments/public-key
    // Retorna a chave pública RSA do PagSeguro para o SDK JS do frontend
    // encriptar os dados do cartão antes de enviá-los ao servidor
    @GetMapping("/api/payments/public-key")
    public ResponseEntity<Map<String, String>> getPublicKey() {
        String key = paymentService.getPublicKey();
        return ResponseEntity.ok(Map.of("publicKey", key));
    }

    // POST /api/checkout
    // Cria o pedido e processa o pagamento no PagSeguro em uma única chamada.
    // Retorna 201 Created com o resultado do pagamento (aprovado, em análise ou recusado).
    @PostMapping("/api/checkout")
    public ResponseEntity<CheckoutResponse> processCheckout(@Valid @RequestBody CheckoutRequest request) {
        CheckoutResponse result = paymentService.processCheckout(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // POST /api/payments/webhook
    // Endpoint público chamado pelo PagSeguro para notificar mudanças de status da cobrança.
    // Protegido por verificação de referência interna (reference_id = UUID do pedido).
    @PostMapping("/api/payments/webhook")
    public ResponseEntity<Void> handleWebhook(@RequestBody Map<String, Object> payload) {
        paymentService.handleWebhook(payload);
        return ResponseEntity.ok().build();
    }
}
