-- Adiciona campo de bloqueio de conta ao usuário.
-- Permite que MASTER/ADMIN suspendam contas via dashboard.
-- DEFAULT false garante compatibilidade com registros existentes.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false;
