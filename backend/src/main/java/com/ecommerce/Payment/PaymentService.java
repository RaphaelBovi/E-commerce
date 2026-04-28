package com.ecommerce.Payment;

import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Repository.UserRepository;
import com.ecommerce.Auth.Service.EmailService;
import com.ecommerce.Coupon.CouponService;
import com.ecommerce.Order.Entity.*;
import com.ecommerce.Order.Repository.OrderRepository;
import com.ecommerce.Payment.Dto.CheckoutRequest;
import com.ecommerce.Payment.Dto.CheckoutResponse;
import com.ecommerce.Payment.Dto.CreateCheckoutSessionRequest;
import com.ecommerce.Payment.Dto.CheckoutSessionResponse;
import com.ecommerce.Product.Entity.ProductCategory;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import com.ecommerce.Product.Repository.ProductCategoryRepository;
import com.ecommerce.Product.Repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    @Value("${pagseguro.token:}")
    private String pagseguroToken;

    @Value("${pagseguro.webhook-secret:}")
    private String webhookSecret;

    @Value("${pagseguro.api-url:https://sandbox.api.pagseguro.com}")
    private String pagseguroApiUrl;

    @Value("${pagseguro.notification-url:}")
    private String notificationUrl;

    @Value("${pagseguro.redirect-url:http://localhost:5173/minha-conta}")
    private String redirectUrl;

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final EmailService emailService;
    private final CouponService couponService;
    private final MercadoPagoService mercadoPagoService;
    private final ProductVariantRepository productVariantRepository;
    private final StockService stockService;
    private final WebhookService webhookService;
    private final ObjectMapper objectMapper;

    private final RestClient restClient = RestClient.create();

    private static final ParameterizedTypeReference<Map<String, Object>> MAP_TYPE =
            new ParameterizedTypeReference<>() {};

    // ── UTILITÁRIO ────────────────────────────────────────────────
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    // ── CHAVE PÚBLICA ─────────────────────────────────────────────
    // Retorna a chave pública RSA do PagSeguro usada pelo SDK JS do frontend
    // para encriptar os dados do cartão antes de enviá-los ao servidor
    public String getPublicKey() {
        if (pagseguroToken == null || pagseguroToken.isBlank()) {
            throw new IllegalStateException("Token do PagSeguro não configurado");
        }
        try {
            Map<String, Object> response = restClient.get()
                    .uri(pagseguroApiUrl + "/public-keys/CREDIT_CARD")
                    .header("Authorization", "Bearer " + pagseguroToken)
                    .retrieve()
                    .body(MAP_TYPE);

            if (response == null || !response.containsKey("public_key")) {
                throw new RuntimeException("Chave pública não retornada pelo PagSeguro");
            }
            return (String) response.get("public_key");

        } catch (Exception e) {
            log.error("Falha ao obter chave pública do PagSeguro", e);
            throw new RuntimeException("Não foi possível obter a chave de pagamento: " + e.getMessage());
        }
    }

    // ── CHECKOUT ─────────────────────────────────────────────────
    // Cria o pedido no banco e processa o pagamento no PagSeguro atomicamente
    @Transactional
    public CheckoutResponse processCheckout(CheckoutRequest request) {
        User user = getCurrentUser();

        // 0. Valida estoque antes de criar o pedido (early check para UX)
        validateStock(request.items());

        // 1. Monta e persiste o pedido com status PENDING_PAYMENT
        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING_PAYMENT)
                .paymentMethod(PaymentMethod.CREDIT_CARD)
                .totalAmount(BigDecimal.ZERO)
                .deliveryAddress(request.deliveryAddress())
                .build();

        List<OrderItem> items = request.items().stream().map(i -> OrderItem.builder()
                .order(order)
                .productId(i.productId())
                .productName(i.productName())
                .productImage(i.productImage())
                .unitPrice(i.unitPrice())
                .quantity(i.quantity())
                .variantId(i.variantId())
                .variantName(i.variantName())
                .build()
        ).toList();

        // Total calculado no backend — nunca confiar no valor enviado pelo cliente
        BigDecimal total = items.stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setTotalAmount(total);
        order.getItems().addAll(items);
        Order savedOrder = orderRepository.save(order);

        // 2. Processa o pagamento via PagSeguro
        ChargeResult charge = createCharge(savedOrder.getId(), total, request);

        // 3. Atualiza status do pedido conforme resultado da cobrança
        return switch (charge.status()) {
            case "PAID", "AUTHORIZED" -> {
                savedOrder.setStatus(OrderStatus.PAID);
                savedOrder.setPagseguroChargeId(charge.chargeId());
                decrementOrderStock(savedOrder.getItems());
                Order paidOrder = orderRepository.save(savedOrder);
                try { emailService.sendOrderConfirmation(paidOrder); } catch (Exception e) {
                    log.warn("Falha ao enviar e-mail de confirmação: {}", e.getMessage());
                }
                yield new CheckoutResponse(paidOrder.getId(), charge.chargeId(), charge.status(),
                        total, true, "Pagamento aprovado! Seu pedido está sendo preparado.");
            }
            case "IN_ANALYSIS" -> {
                savedOrder.setPagseguroChargeId(charge.chargeId());
                orderRepository.save(savedOrder);
                yield new CheckoutResponse(savedOrder.getId(), charge.chargeId(), charge.status(),
                        total, true, "Pagamento em análise. Você receberá uma confirmação por e-mail.");
            }
            case "DECLINED" -> {
                savedOrder.setStatus(OrderStatus.CANCELLED);
                orderRepository.save(savedOrder);
                String msg = charge.message() != null
                        ? charge.message()
                        : "Pagamento recusado. Verifique os dados do cartão e tente novamente.";
                yield new CheckoutResponse(savedOrder.getId(), null, "DECLINED", total, false, msg);
            }
            default -> {
                savedOrder.setStatus(OrderStatus.CANCELLED);
                orderRepository.save(savedOrder);
                yield new CheckoutResponse(savedOrder.getId(), null, "ERROR", total, false,
                        "Erro ao processar o pagamento. Tente novamente em instantes.");
            }
        };
    }

    // ── CHAMADA AO PAGSEGURO ──────────────────────────────────────
    @SuppressWarnings("unchecked")
    private ChargeResult createCharge(UUID orderId, BigDecimal totalBrl, CheckoutRequest request) {
        int centavos = totalBrl.multiply(BigDecimal.valueOf(100)).intValue();

        Map<String, Object> card = new LinkedHashMap<>();
        card.put("encrypted", request.encryptedCard());
        card.put("holder", Map.of("name", request.holderName().toUpperCase()));
        card.put("store", false);

        Map<String, Object> paymentMethod = new LinkedHashMap<>();
        paymentMethod.put("type", "CREDIT_CARD");
        paymentMethod.put("installments", request.installments());
        paymentMethod.put("capture", true);
        paymentMethod.put("card", card);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reference_id", orderId.toString());
        body.put("description", "Pedido #" + orderId.toString().substring(0, 8).toUpperCase());
        body.put("amount", Map.of("value", centavos, "currency", "BRL"));
        body.put("payment_method", paymentMethod);
        if (notificationUrl != null && !notificationUrl.isBlank()) {
            body.put("notification_urls", List.of(notificationUrl));
        }

        try {
            Map<String, Object> response = restClient.post()
                    .uri(pagseguroApiUrl + "/charges")
                    .header("Authorization", "Bearer " + pagseguroToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(MAP_TYPE);

            if (response == null) {
                return new ChargeResult(null, "ERROR", "Resposta vazia do gateway");
            }

            String chargeId = (String) response.get("id");
            String status   = (String) response.getOrDefault("status", "ERROR");
            String message  = extractDeclinedMessage(response);
            return new ChargeResult(chargeId, status, message);

        } catch (HttpClientErrorException e) {
            log.warn("PagSeguro 4xx para pedido {}: {}", orderId, e.getStatusCode());
            // Tenta extrair mensagem de erro do corpo da resposta
            String declMsg = parseDeclinedMessage(e.getResponseBodyAsString());
            return new ChargeResult(null, "DECLINED", declMsg);

        } catch (HttpServerErrorException e) {
            log.error("PagSeguro 5xx para pedido {}: {}", orderId, e.getStatusCode());
            return new ChargeResult(null, "ERROR", "Serviço de pagamento indisponível");

        } catch (RestClientException e) {
            log.error("Falha de conexão com PagSeguro para pedido {}", orderId, e);
            return new ChargeResult(null, "ERROR", "Não foi possível conectar ao gateway de pagamento");
        }
    }

    @SuppressWarnings("unchecked")
    private String extractDeclinedMessage(Map<String, Object> response) {
        Object paymentResponse = response.get("payment_response");
        if (paymentResponse instanceof Map<?, ?> pr) {
            Object msg = pr.get("message");
            if (msg instanceof String s) return s;
        }
        return null;
    }

    private String parseDeclinedMessage(String body) {
        if (body == null || body.isBlank()) return "Pagamento recusado";
        if (body.contains("INSUFFICIENT_FUNDS") || body.contains("INSUFFICIENT FUNDS"))
            return "Saldo insuficiente no cartão";
        if (body.contains("INVALID_CVV") || body.contains("INVALID_SECURITY_CODE"))
            return "CVV inválido";
        if (body.contains("INVALID_NUMBER"))
            return "Número do cartão inválido";
        if (body.contains("EXPIRED"))
            return "Cartão expirado";
        return "Pagamento recusado. Verifique os dados do cartão.";
    }

    // ── CHECKOUT REDIRECT ─────────────────────────────────────────
    // Cria o pedido no banco e uma sessão de checkout no PagSeguro.
    // Suporta usuários autenticados e convidados (guestEmail obrigatório para guests).
    // O frontend redireciona o usuário para o paymentUrl retornado.
    @Transactional
    public CheckoutSessionResponse createCheckoutSession(CreateCheckoutSessionRequest request) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isGuest = auth == null || !auth.isAuthenticated()
                || auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken;

        User user = null;
        String customerEmail;

        if (!isGuest) {
            user = getCurrentUser();
            customerEmail = user.getEmail();
        } else {
            if (request.guestEmail() == null || request.guestEmail().isBlank()) {
                throw new BusinessException("E-mail é obrigatório para compras sem cadastro.");
            }
            customerEmail = request.guestEmail().trim();
        }

        validateStock(request.items());

        PaymentMethod method = switch (request.paymentMethod().toUpperCase()) {
            case "PIX"    -> PaymentMethod.PIX;
            case "BOLETO" -> PaymentMethod.BOLETO;
            default       -> PaymentMethod.CREDIT_CARD;
        };

        Order order = Order.builder()
                .user(user)
                .guestEmail(isGuest ? customerEmail : null)
                .status(OrderStatus.PENDING_PAYMENT)
                .paymentMethod(method)
                .totalAmount(BigDecimal.ZERO)
                .deliveryAddress(buildAddressString(request))
                .build();

        List<OrderItem> items = request.items().stream().map(i -> OrderItem.builder()
                .order(order)
                .productId(i.productId())
                .productName(i.productName())
                .productImage(i.productImage())
                .unitPrice(i.unitPrice())
                .quantity(i.quantity())
                .variantId(i.variantId())
                .variantName(i.variantName())
                .build()
        ).toList();

        BigDecimal total = items.stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Aplica cupom de desconto se informado
        if (request.couponCode() != null && !request.couponCode().isBlank()) {
            java.math.BigDecimal discount = couponService.applyCoupon(request.couponCode(), total);
            total = total.subtract(discount).max(BigDecimal.ZERO);
        }

        order.setTotalAmount(total);
        order.getItems().addAll(items);
        Order savedOrder = orderRepository.save(order);

        boolean isMercadoPago = "mercadopago".equalsIgnoreCase(request.gateway());

        // Persiste metadados necessários para retomada de pagamento posterior
        savedOrder.setExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
        savedOrder.setPaymentGateway(isMercadoPago ? "mercadopago" : "pagseguro");
        savedOrder.setDeliveryAddressData(buildAddressJson(request));
        orderRepository.save(savedOrder);

        String paymentUrl = isMercadoPago
                ? mercadoPagoService.createPreference(savedOrder, customerEmail)
                : callPagseguroCheckout(savedOrder, customerEmail, total, request);
        return new CheckoutSessionResponse(savedOrder.getId(), paymentUrl);
    }

    private String buildAddressString(CreateCheckoutSessionRequest r) {
        return String.join(", ",
                java.util.stream.Stream.of(
                        "Destinatário: " + r.recipientName(),
                        r.recipientCpf() != null && !r.recipientCpf().isBlank() ? "CPF: " + r.recipientCpf() : null,
                        r.recipientPhone() != null && !r.recipientPhone().isBlank() ? "Tel: " + r.recipientPhone() : null,
                        r.recipientPhone2() != null && !r.recipientPhone2().isBlank() ? "Tel2: " + r.recipientPhone2() : null,
                        r.street() + ", " + r.streetNumber(),
                        r.complement(),
                        r.neighborhood(),
                        r.city() + "-" + r.state(),
                        "CEP: " + r.zipCode()
                ).filter(s -> s != null && !s.isBlank())
                .toArray(String[]::new)
        );
    }

    // Serializa os campos estruturados do endereço como JSON para armazenamento no pedido.
    // Usado para recriar a sessão de pagamento ao retomar um pedido pendente.
    private String buildAddressJson(CreateCheckoutSessionRequest r) {
        try {
            Map<String, String> addr = new LinkedHashMap<>();
            addr.put("recipientName",  r.recipientName());
            addr.put("recipientCpf",   r.recipientCpf()   != null ? r.recipientCpf()   : "");
            addr.put("recipientPhone", r.recipientPhone()  != null ? r.recipientPhone()  : "");
            addr.put("recipientPhone2",r.recipientPhone2() != null ? r.recipientPhone2() : "");
            addr.put("street",         r.street());
            addr.put("streetNumber",   r.streetNumber());
            addr.put("complement",     r.complement()      != null ? r.complement()      : "");
            addr.put("neighborhood",   r.neighborhood()    != null ? r.neighborhood()    : "");
            addr.put("city",           r.city());
            addr.put("state",          r.state());
            addr.put("zipCode",        r.zipCode());
            return objectMapper.writeValueAsString(addr);
        } catch (Exception e) {
            log.warn("Falha ao serializar endereço do pedido: {}", e.getMessage());
            return "{}";
        }
    }

    // ── RECRIAR LINK DE PAGAMENTO ─────────────────────────────────
    // Gera uma nova URL de pagamento para um pedido existente com status PENDING_PAYMENT.
    // Valida propriedade do pedido, prazo de expiração e disponibilidade dos dados de endereço.
    @Transactional(readOnly = true)
    public CheckoutSessionResponse generatePaymentLink(UUID orderId) {
        User currentUser = getCurrentUser();
        Order order = orderRepository.findByIdAndUserId(orderId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));

        if (order.getStatus() != com.ecommerce.Order.Entity.OrderStatus.PENDING_PAYMENT) {
            throw new BusinessException("Apenas pedidos com pagamento pendente podem ter o link de pagamento regenerado.");
        }

        if (order.getExpiresAt() != null && Instant.now().isAfter(order.getExpiresAt())) {
            throw new BusinessException("O prazo para pagamento deste pedido expirou. O pedido será cancelado em breve.");
        }

        if (order.getDeliveryAddressData() == null || order.getDeliveryAddressData().isBlank()) {
            throw new BusinessException("Dados de entrega indisponíveis — não é possível recriar o link de pagamento para este pedido.");
        }

        String customerEmail = currentUser.getEmail();
        String gateway = order.getPaymentGateway();

        if ("mercadopago".equalsIgnoreCase(gateway)) {
            String url = mercadoPagoService.createPreference(order, customerEmail);
            return new CheckoutSessionResponse(orderId, url);
        }

        // PagSeguro: reconstrói o payload a partir dos dados armazenados
        String url = callPagseguroCheckoutFromStoredData(order, customerEmail);
        return new CheckoutSessionResponse(orderId, url);
    }

    @SuppressWarnings("unchecked")
    private String callPagseguroCheckoutFromStoredData(Order order, String userEmail) {
        if (pagseguroToken == null || pagseguroToken.isBlank()) {
            throw new BusinessException("Token do PagSeguro não configurado.");
        }

        Map<String, String> addr;
        try {
            addr = objectMapper.readValue(order.getDeliveryAddressData(),
                    new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            throw new BusinessException("Dados de endereço corrompidos — não é possível recriar o pagamento.");
        }

        String baseUrl = pagseguroApiUrl.replaceAll("/+$", "");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reference_id", order.getId().toString());
        body.put("expiration_date",
                java.time.OffsetDateTime.now().plusHours(2)
                        .truncatedTo(java.time.temporal.ChronoUnit.SECONDS)
                        .format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME));

        Map<String, Object> customer = new LinkedHashMap<>();
        customer.put("name", addr.getOrDefault("recipientName", userEmail));
        customer.put("email", userEmail);
        String cpf = addr.getOrDefault("recipientCpf", "");
        if (!cpf.isBlank()) customer.put("tax_id", digitsOnly(cpf));
        List<Map<String, Object>> phones = new ArrayList<>();
        addPhone(phones, addr.getOrDefault("recipientPhone", ""), "MOBILE");
        addPhone(phones, addr.getOrDefault("recipientPhone2", ""), "HOME");
        if (!phones.isEmpty()) customer.put("phones", phones);
        body.put("customer", customer);

        List<Map<String, Object>> itemsList = order.getItems().stream().map(item -> {
            Map<String, Object> i = new LinkedHashMap<>();
            i.put("reference_id", item.getProductId() != null ? item.getProductId().toString() : "item");
            i.put("name", item.getProductName());
            i.put("quantity", item.getQuantity());
            i.put("unit_amount", item.getUnitPrice().multiply(BigDecimal.valueOf(100)).intValue());
            return i;
        }).collect(java.util.stream.Collectors.toList());
        body.put("items", itemsList);

        Map<String, Object> shipAddr = new LinkedHashMap<>();
        shipAddr.put("street",      addr.getOrDefault("street", ""));
        shipAddr.put("number",      addr.getOrDefault("streetNumber", ""));
        String complement = addr.getOrDefault("complement", "");
        if (!complement.isBlank()) shipAddr.put("complement", complement);
        String neighborhood = addr.getOrDefault("neighborhood", "");
        if (!neighborhood.isBlank()) shipAddr.put("locality", neighborhood);
        shipAddr.put("city",        addr.getOrDefault("city", ""));
        shipAddr.put("region_code", addr.getOrDefault("state", "").toUpperCase());
        shipAddr.put("country",     "BRA");
        shipAddr.put("postal_code", digitsOnly(addr.getOrDefault("zipCode", "")));

        Map<String, Object> shipping = new LinkedHashMap<>();
        shipping.put("type",    "FIXED");
        shipping.put("amount",  0);
        shipping.put("address", shipAddr);
        body.put("shipping", shipping);

        if (redirectUrl != null && !redirectUrl.isBlank()) body.put("redirect_url", redirectUrl);
        if (notificationUrl != null && !notificationUrl.isBlank())
            body.put("notification_urls", List.of(notificationUrl));

        // Restringe ao método de pagamento original do pedido
        String pmType = order.getPaymentMethod().name();
        body.put("payment_methods", List.of(Map.of("type", pmType)));

        try {
            Map<String, Object> response = restClient.post()
                    .uri(baseUrl + "/checkouts")
                    .header("Authorization", "Bearer " + pagseguroToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(MAP_TYPE);

            if (response == null) throw new BusinessException("Resposta vazia do PagSeguro");

            List<Map<String, Object>> links = (List<Map<String, Object>>) response.get("links");
            if (links == null) throw new BusinessException("PagSeguro não retornou links.");

            return links.stream()
                    .filter(l -> "PAY".equals(l.get("rel")))
                    .map(l -> (String) l.get("href"))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("PagSeguro não retornou URL de pagamento."));

        } catch (BusinessException e) {
            throw e;
        } catch (HttpClientErrorException e) {
            log.error("PagSeguro 4xx ao recriar checkout [{}]: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException("PagSeguro recusou a requisição: " + e.getStatusCode());
        } catch (HttpServerErrorException e) {
            log.error("PagSeguro 5xx ao recriar checkout [{}]: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new BusinessException("Serviço PagSeguro indisponível.");
        } catch (RestClientException e) {
            log.error("Falha de conexão com PagSeguro ao recriar checkout", e);
            throw new BusinessException("Não foi possível conectar ao PagSeguro.");
        }
    }

    @SuppressWarnings("unchecked")
    private String callPagseguroCheckout(Order order, String userEmail,
                                         BigDecimal total, CreateCheckoutSessionRequest request) {
        if (pagseguroToken == null || pagseguroToken.isBlank()) {
            throw new BusinessException("Token do PagSeguro não configurado. Configure a variável PAGSEGURO_TOKEN.");
        }

        String baseUrl = pagseguroApiUrl.replaceAll("/+$", "");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reference_id", order.getId().toString());

        // ISO 8601 sem nanosegundos: 2025-04-30T23:59:59-03:00
        body.put("expiration_date",
                java.time.OffsetDateTime.now().plusDays(1)
                        .truncatedTo(java.time.temporal.ChronoUnit.SECONDS)
                        .format(java.time.format.DateTimeFormatter.ISO_OFFSET_DATE_TIME));

        // Customer — pré-preenche o formulário na página do PagBank
        Map<String, Object> customer = new LinkedHashMap<>();
        customer.put("name", request.recipientName());
        customer.put("email", userEmail);
        if (request.recipientCpf() != null && !request.recipientCpf().isBlank()) {
            customer.put("tax_id", digitsOnly(request.recipientCpf()));
        }
        List<Map<String, Object>> phones = new ArrayList<>();
        addPhone(phones, request.recipientPhone(), "MOBILE");
        addPhone(phones, request.recipientPhone2(), "HOME");
        if (!phones.isEmpty()) customer.put("phones", phones);
        body.put("customer", customer);

        // Items — reference_id é opcional, name/quantity/unit_amount são obrigatórios
        List<Map<String, Object>> itemsList = order.getItems().stream().map(item -> {
            Map<String, Object> i = new LinkedHashMap<>();
            i.put("reference_id", item.getProductId() != null ? item.getProductId().toString() : "item");
            i.put("name", item.getProductName());
            i.put("quantity", item.getQuantity());
            i.put("unit_amount", item.getUnitPrice().multiply(BigDecimal.valueOf(100)).intValue());
            return i;
        }).collect(java.util.stream.Collectors.toList());
        body.put("items", itemsList);

        // Shipping — type deve ser "FIXED"; amount 0 = frete grátis
        Map<String, Object> shipAddr = new LinkedHashMap<>();
        shipAddr.put("street", request.street());
        shipAddr.put("number", request.streetNumber());
        if (request.complement() != null && !request.complement().isBlank())
            shipAddr.put("complement", request.complement());
        if (request.neighborhood() != null && !request.neighborhood().isBlank())
            shipAddr.put("locality", request.neighborhood());
        shipAddr.put("city", request.city());
        shipAddr.put("region_code", request.state().toUpperCase());
        shipAddr.put("country", "BRA");
        shipAddr.put("postal_code", digitsOnly(request.zipCode()));

        Map<String, Object> shipping = new LinkedHashMap<>();
        shipping.put("type", "FIXED");
        shipping.put("amount", 0);
        shipping.put("address", shipAddr);
        body.put("shipping", shipping);

        // redirect_url — para onde o PagBank envia o cliente após o pagamento
        if (redirectUrl != null && !redirectUrl.isBlank()) {
            body.put("redirect_url", redirectUrl);
        }
        if (notificationUrl != null && !notificationUrl.isBlank()) {
            body.put("notification_urls", List.of(notificationUrl));
        }

        // payment_methods — restringe ao método já escolhido pelo usuário
        String pmType = request.paymentMethod().toUpperCase();
        body.put("payment_methods", List.of(Map.of("type", pmType)));

        try {
            Map<String, Object> response = restClient.post()
                    .uri(baseUrl + "/checkouts")
                    .header("Authorization", "Bearer " + pagseguroToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(MAP_TYPE);

            if (response == null) {
                throw new BusinessException("Resposta vazia do PagSeguro");
            }

            // A URL de pagamento está em links[].href onde rel == "PAY"
            List<Map<String, Object>> links = (List<Map<String, Object>>) response.get("links");
            if (links == null) {
                throw new BusinessException("PagSeguro não retornou links. Resposta: " + response);
            }

            return links.stream()
                    .filter(l -> "PAY".equals(l.get("rel")))
                    .map(l -> (String) l.get("href"))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException("PagSeguro não retornou URL de pagamento. Links: " + links));

        } catch (BusinessException e) {
            throw e;
        } catch (HttpClientErrorException e) {
            String responseBody = e.getResponseBodyAsString();
            log.error("PagSeguro 4xx ao criar checkout [{}]: {}", e.getStatusCode(), responseBody);
            throw new BusinessException("PagSeguro recusou a requisição (" + e.getStatusCode() + "): " + responseBody);
        } catch (HttpServerErrorException e) {
            String responseBody = e.getResponseBodyAsString();
            log.error("PagSeguro 5xx ao criar checkout [{}]: {}", e.getStatusCode(), responseBody);
            throw new BusinessException("Serviço PagSeguro indisponível (" + e.getStatusCode() + "): " + responseBody);
        } catch (RestClientException e) {
            log.error("Falha de conexão com PagSeguro ao criar checkout", e);
            throw new BusinessException("Não foi possível conectar ao PagSeguro: " + e.getMessage());
        } catch (Exception e) {
            log.error("Erro inesperado ao criar checkout PagSeguro", e);
            throw new BusinessException("Erro ao processar checkout: " + e.getClass().getSimpleName() + " — " + e.getMessage());
        }
    }

    private void addPhone(List<Map<String, Object>> list, String raw, String type) {
        if (raw == null || raw.isBlank()) return;
        String d = digitsOnly(raw);
        if (d.length() < 10) return;
        list.add(Map.of("country", "55", "area", d.substring(0, 2),
                        "number", d.substring(2), "type", type));
    }

    private static String digitsOnly(String v) {
        return v == null ? "" : v.replaceAll("\\D", "");
    }

    // ── VERIFICAÇÃO DE ASSINATURA DO WEBHOOK ──────────────────────
    // O PagSeguro envia HMAC-SHA256(raw_body, webhook_secret) em hex no header
    // x-pagseguro-signature. Retorna false se assinatura ausente ou inválida.
    // Se webhook-secret não estiver configurado (dev local), aceita sem verificar.
    public boolean isValidWebhookSignature(String rawBody, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("pagseguro.webhook-secret não configurado — verificação de assinatura ignorada");
            return true;
        }
        if (signature == null || signature.isBlank()) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String expected = toHex(hash);
            // Comparação constant-time para prevenir timing attacks
            return MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Erro ao verificar assinatura HMAC do webhook", e);
            return false;
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    // ── WEBHOOK ───────────────────────────────────────────────────
    // Recebe notificações assíncronas do PagSeguro quando o status muda
    // Webhook delegados ao WebhookService — ver WebhookService.java
    public void handleWebhook(Map<String, Object> payload) {
        webhookService.handlePagSeguro(payload);
    }

    public void handleMercadoPagoWebhook(String paymentId) {
        webhookService.handleMercadoPago(paymentId);
    }

    // Estoque delegado ao StockService — ver StockService.java
    private void validateStock(List<com.ecommerce.Order.Entity.Dto.OrderItemRequest> items) {
        stockService.validateStock(items);
    }

    private void decrementOrderStock(List<com.ecommerce.Order.Entity.OrderItem> items) {
        stockService.decrementStock(items);
    }

    private record ChargeResult(String chargeId, String status, String message) {}
}
