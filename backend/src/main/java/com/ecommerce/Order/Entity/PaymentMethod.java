// ─────────────────────────────────────────────────────────────────
// PaymentMethod.java — Enum que representa os métodos de pagamento disponíveis
//
// Define as formas de pagamento que o cliente pode escolher ao criar
// um pedido. Armazenado como STRING no banco de dados via
// @Enumerated(EnumType.STRING) na entidade Order.
//
// Para adicionar um novo método de pagamento (ex.: CRYPTO):
//   1. Insira o valor aqui
//   2. Nenhuma outra alteração de banco é necessária (STRING é extensível)
//   3. Atualize o frontend para exibir a nova opção de pagamento
//   4. Implemente o fluxo de processamento correspondente em OrderService, se necessário
// ─────────────────────────────────────────────────────────────────
package com.ecommerce.Order.Entity;

public enum PaymentMethod {
    // Pagamento instantâneo via sistema PIX (Banco Central do Brasil)
    PIX,

    // Pagamento parcelado ou à vista com cartão de crédito
    CREDIT_CARD,

    // Boleto bancário — pagamento assíncrono (confirmação pode levar até 3 dias úteis)
    BOLETO,

    // Pagamento à vista com cartão de débito (débito imediato na conta)
    DEBIT_CARD
}
