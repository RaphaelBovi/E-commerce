-- Tabela para carrinhos compartilháveis via link.
-- Token UUID gerado pelo backend; expiresAt define validade de 7 dias.
CREATE TABLE IF NOT EXISTS shared_carts (
    token      varchar(36)  NOT NULL PRIMARY KEY,
    items_json text         NOT NULL,
    created_at timestamptz  NOT NULL,
    expires_at timestamptz  NOT NULL
);
