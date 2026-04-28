CREATE TABLE IF NOT EXISTS pending_google_setups (
    email        VARCHAR(320) PRIMARY KEY,
    full_name    VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    otp_hash     VARCHAR(255),
    setup_token  VARCHAR(255) NOT NULL,
    expires_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts     INTEGER NOT NULL DEFAULT 0
);
