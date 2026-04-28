-- V1: Schema inicial completo
-- Todas as tabelas usam IF NOT EXISTS para ser seguro em bancos existentes
-- (baseline-on-migrate=true garante que este script só rode em novos bancos)

CREATE TABLE IF NOT EXISTS users (
    id            uuid         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email         varchar(320) NOT NULL UNIQUE,
    password      varchar(255) NOT NULL,
    role          varchar(20)  NOT NULL,
    created_at    timestamptz  NOT NULL,
    full_name     varchar(255) NOT NULL,
    cpf           varchar(11)  UNIQUE,
    birth_date    date,
    phone         varchar(11),
    address       varchar(255),
    city          varchar(255),
    state         varchar(2),
    zip_code      varchar(8),
    google_account boolean     NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS pending_registrations (
    email         varchar(320) NOT NULL PRIMARY KEY,
    password_hash varchar(72)  NOT NULL,
    otp_hash      varchar(72)  NOT NULL,
    expires_at    timestamptz  NOT NULL,
    attempts      int          NOT NULL DEFAULT 0,
    full_name     varchar(255) NOT NULL,
    cpf           varchar(11),
    birth_date    date,
    phone         varchar(11),
    address       varchar(255),
    city          varchar(255),
    state         varchar(2),
    zip_code      varchar(8)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    email      varchar(320) NOT NULL PRIMARY KEY,
    token_hash varchar(72)  NOT NULL,
    expires_at timestamptz  NOT NULL,
    attempts   int          NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
    id         uuid         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name       varchar(255) NOT NULL UNIQUE,
    slug       varchar(255) NOT NULL UNIQUE,
    active     boolean      NOT NULL DEFAULT true,
    created_at timestamptz  NOT NULL
);

CREATE TABLE IF NOT EXISTS product_category (
    id                uuid           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name              varchar(255),
    ref               varchar(255),
    price             numeric(19, 2),
    promotional_price numeric(19, 2),
    qnt               int,
    marca             varchar(255),
    category          varchar(255),
    image             text,
    weight_kg         numeric(8, 3),
    width_cm          int,
    height_cm         int,
    length_cm         int,
    created_at        timestamptz    NOT NULL,
    updated_at        timestamptz    NOT NULL,
    is_promo          boolean        NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS product_images (
    product_id  uuid NOT NULL REFERENCES product_category(id) ON DELETE CASCADE,
    image_url   text,
    image_order int  NOT NULL,
    PRIMARY KEY (product_id, image_order)
);

CREATE TABLE IF NOT EXISTS product_variant (
    id         uuid           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid           NOT NULL REFERENCES product_category(id) ON DELETE CASCADE,
    name       varchar(255)   NOT NULL,
    sku        varchar(255),
    price      numeric(10, 2),
    qnt        int            NOT NULL,
    attributes text
);

CREATE TABLE IF NOT EXISTS orders (
    id                  uuid           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id             uuid           REFERENCES users(id),
    guest_email         varchar(320),
    status              varchar(30)    NOT NULL,
    payment_method      varchar(20)    NOT NULL,
    total_amount        numeric(10, 2) NOT NULL,
    tracking_code       varchar(255),
    tracking_url        varchar(512),
    delivery_address    text,
    pagseguro_charge_id varchar(255),
    created_at          timestamptz    NOT NULL,
    updated_at          timestamptz    NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id            uuid           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id      uuid           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id    uuid,
    product_name  varchar(255)   NOT NULL,
    product_image text,
    unit_price    numeric(10, 2) NOT NULL,
    quantity      int            NOT NULL,
    variant_id    uuid,
    variant_name  varchar(255)
);

CREATE TABLE IF NOT EXISTS coupons (
    id               uuid           NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code             varchar(255)   NOT NULL UNIQUE,
    type             varchar(30)    NOT NULL,
    value            numeric(10, 2) NOT NULL,
    min_order_amount numeric(10, 2),
    max_usages       int,
    used_count       int            NOT NULL DEFAULT 0,
    expires_at       timestamptz,
    active           boolean        NOT NULL DEFAULT true,
    created_at       timestamptz    NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    uuid        NOT NULL REFERENCES users(id),
    product_id uuid        NOT NULL,
    rating     int         NOT NULL,
    comment    text,
    created_at timestamptz NOT NULL,
    UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS favorites (
    id         uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    uuid        NOT NULL,
    product_id uuid        NOT NULL,
    created_at timestamptz NOT NULL,
    UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS banners (
    id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title         varchar(255) NOT NULL,
    subtitle      varchar(255),
    image_url     text,
    link_url      text,
    position      varchar(30)  NOT NULL,
    active        boolean      NOT NULL DEFAULT true,
    display_order int          NOT NULL DEFAULT 0,
    created_at    timestamptz  NOT NULL
);

CREATE TABLE IF NOT EXISTS abandoned_carts (
    user_id       uuid        NOT NULL PRIMARY KEY,
    email         varchar(320) NOT NULL,
    items_json    text,
    updated_at    timestamptz  NOT NULL,
    email_sent_at timestamptz
);

CREATE TABLE IF NOT EXISTS tickets (
    id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number varchar(20)  NOT NULL UNIQUE,
    user_id       uuid        NOT NULL REFERENCES users(id),
    subject       varchar(120) NOT NULL,
    category      varchar(60)  NOT NULL,
    status        varchar(20)  NOT NULL DEFAULT 'OPEN',
    created_at    timestamptz  NOT NULL,
    updated_at    timestamptz  NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_messages (
    id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id   uuid        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id   uuid        NOT NULL,
    author_name varchar(120) NOT NULL,
    author_role varchar(20)  NOT NULL,
    content     text        NOT NULL,
    created_at  timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS return_requests (
    id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id    uuid        NOT NULL,
    user_id     uuid        NOT NULL,
    reason      varchar(50)  NOT NULL,
    items_json  text,
    status      varchar(20)  NOT NULL DEFAULT 'PENDING',
    admin_notes text,
    created_at  timestamptz  NOT NULL
);
