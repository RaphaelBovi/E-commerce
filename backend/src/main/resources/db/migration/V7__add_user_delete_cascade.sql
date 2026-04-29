-- V7: Adiciona comportamento de cascata nas FK que referenciam users(id)
-- Garante que a exclusão de um usuário não quebre constraints de integridade referencial.
--
-- Estratégia por tabela:
--   orders    → SET NULL  (histórico de pedidos preservado, user_id vira NULL)
--   reviews   → CASCADE   (avaliações do usuário excluídas junto)
--   tickets   → CASCADE   (tickets do usuário excluídos junto)
--   favorites → CASCADE   (favoritos do usuário excluídos junto)
--
-- PL/pgSQL para encontrar o nome real da FK (gerado pelo Hibernate) e substituí-la.

DO $$
DECLARE
    v_constraint TEXT;
BEGIN
    -- ── orders.user_id → SET NULL ────────────────────────────────
    SELECT conname INTO v_constraint
    FROM pg_constraint
    WHERE conrelid = 'orders'::regclass
      AND contype  = 'f'
      AND conkey @> ARRAY[(
          SELECT attnum FROM pg_attribute
          WHERE attrelid = 'orders'::regclass AND attname = 'user_id'
      )]::smallint[];
    IF v_constraint IS NOT NULL THEN
        EXECUTE 'ALTER TABLE orders DROP CONSTRAINT ' || quote_ident(v_constraint);
    END IF;

    -- ── reviews.user_id → CASCADE ────────────────────────────────
    SELECT conname INTO v_constraint
    FROM pg_constraint
    WHERE conrelid = 'reviews'::regclass
      AND contype  = 'f'
      AND conkey @> ARRAY[(
          SELECT attnum FROM pg_attribute
          WHERE attrelid = 'reviews'::regclass AND attname = 'user_id'
      )]::smallint[];
    IF v_constraint IS NOT NULL THEN
        EXECUTE 'ALTER TABLE reviews DROP CONSTRAINT ' || quote_ident(v_constraint);
    END IF;

    -- ── tickets.user_id → CASCADE ────────────────────────────────
    SELECT conname INTO v_constraint
    FROM pg_constraint
    WHERE conrelid = 'tickets'::regclass
      AND contype  = 'f'
      AND conkey @> ARRAY[(
          SELECT attnum FROM pg_attribute
          WHERE attrelid = 'tickets'::regclass AND attname = 'user_id'
      )]::smallint[];
    IF v_constraint IS NOT NULL THEN
        EXECUTE 'ALTER TABLE tickets DROP CONSTRAINT ' || quote_ident(v_constraint);
    END IF;

    -- ── favorites.user_id → CASCADE ──────────────────────────────
    SELECT conname INTO v_constraint
    FROM pg_constraint
    WHERE conrelid = 'favorites'::regclass
      AND contype  = 'f'
      AND conkey @> ARRAY[(
          SELECT attnum FROM pg_attribute
          WHERE attrelid = 'favorites'::regclass AND attname = 'user_id'
      )]::smallint[];
    IF v_constraint IS NOT NULL THEN
        EXECUTE 'ALTER TABLE favorites DROP CONSTRAINT ' || quote_ident(v_constraint);
    END IF;
END $$;

-- Recria as FK com o comportamento correto
ALTER TABLE orders    ADD CONSTRAINT orders_user_id_fk    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE reviews   ADD CONSTRAINT reviews_user_id_fk   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tickets   ADD CONSTRAINT tickets_user_id_fk   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE favorites ADD CONSTRAINT favorites_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
