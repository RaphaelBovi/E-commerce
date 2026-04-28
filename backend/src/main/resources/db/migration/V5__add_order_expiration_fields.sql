-- V5: Suporte a expiração automática de pedidos aguardando pagamento
--
-- expires_at          — prazo máximo para pagamento (24h após criação); NULL = sem prazo
-- payment_gateway     — gateway usado: 'pagseguro' ou 'mercadopago'
-- delivery_address_data — JSON com os campos estruturados do endereço de entrega,
--                         necessário para recriar a sessão de pagamento

ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_data TEXT;
