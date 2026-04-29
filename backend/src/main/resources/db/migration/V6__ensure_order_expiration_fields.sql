-- V6: Garante que as colunas de expiração de pedidos existam.
-- Idempotente: usa IF NOT EXISTS para ser seguro mesmo se V5 já foi aplicado.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_data TEXT;
