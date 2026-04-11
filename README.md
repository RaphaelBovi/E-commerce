# PASTRACTOR

Catalogo de produtos com backend em Spring Boot e frontend em React/Vite.

## Stack

- Backend: Java 17, Spring Boot, Spring Data JPA, PostgreSQL
- Frontend: React, Vite, React Router
- Deploy: Railway (backend + frontend + PostgreSQL)

## Estrutura do projeto

- `backend`: API REST
- `frontend`: aplicacao web
- `backend/railway.toml`: build/start do backend no Railway
- `frontend/railway.toml`: build/start do frontend no Railway

## Backend (API)

### Base URL

- Local (Dev): `http://localhost:8080/api`
- Producao (atual): `https://pastractor-production.up.railway.app/api`

### Recurso principal

- Recurso: `ProductCategory`
- Campos do payload: `name`, `ref`, `price`, `qnt`, `marca`, `category`, `image`

### Endpoints principais

- `POST /api/product-category`
- `GET /api/product-category`
- `GET /api/product-category/ref/{ref}`
- `PUT /api/product-category/{ref}`
- `DELETE /api/product-category/ref/{ref}`
- `DELETE /api/product-category/id/{id}`

### Endpoints legados (compatibilidade)

- `POST /api/product-category/save`
- `GET /api/product-category/all`
- `GET /api/product-category/findByRef/{ref}`
- `PUT /api/product-category/update/{ref}`
- `DELETE /api/product-category/delete/{ref}`

### Exemplo de JSON (create/update)

```json
{
  "name": "Pastilha Freio Dianteira",
  "ref": "PFD-123",
  "price": 199.9,
  "qnt": 30,
  "marca": "Bosch",
  "category": "mais-vendidos",
  "image": "https://exemplo.com/produto.jpg"
}
```

## Frontend

### Variavel de API

- `VITE_API_BASE_URL` define a URL base consumida pelo frontend.
- Exemplo de producao: `https://pastractor-production.up.railway.app/api`

### Fluxo de consumo

- O frontend tenta buscar produtos por:
  - `/product-category`
  - `/product-category/all` (fallback legado)
- Em caso de erro de rede/CORS, mostra fallback conforme implementacao da aplicacao.

## Execucao local (sem Docker)

### Backend

1. Configure um PostgreSQL local.
2. Ajuste variaveis de ambiente para o backend (ou `application-dev.yml`).
3. Execute no diretorio `backend`:
   - Windows: `mvnw.cmd spring-boot:run`
   - Linux/Mac: `./mvnw spring-boot:run`

### Frontend

1. No diretorio `frontend`:
   - `npm install`
   - `npm run dev`
2. Garanta `VITE_API_BASE_URL=http://localhost:8080/api` em desenvolvimento.

## Deploy no Railway

## 1) Servicos e plugins

Crie estes servicos no Railway:

- Servico `backend` (Root Directory: `backend`)
- Servico `frontend` (Root Directory: `frontend`)
- Plugin `PostgreSQL` vinculado ao `backend` (obrigatorio)
- Plugin `Redis` (opcional)

## 2) Variaveis do backend

No servico `backend`, abra **Variables > Raw Editor > JSON** e cole:

```json
{
  "SPRING_PROFILES_ACTIVE": "prod",
  "APP_CORS_ALLOWED_ORIGINS": "https://SEU-FRONTEND.up.railway.app",
  "DB_HOST": "${{Postgres.PGHOST}}",
  "DB_PORT": "${{Postgres.PGPORT}}",
  "DB_NAME": "${{Postgres.PGDATABASE}}",
  "DB_USER": "${{Postgres.PGUSER}}",
  "DB_PASSWORD": "${{Postgres.PGPASSWORD}}"
}
```

Notas:

- Substitua `SEU-FRONTEND.up.railway.app` pela URL publica real do frontend.
- Se o nome do servico do banco nao for `Postgres`, troque o prefixo nas referencias.

## 3) Variaveis do frontend

No servico `frontend`, abra **Variables > Raw Editor > JSON** e cole:

```json
{
  "VITE_API_BASE_URL": "https://pastractor-production.up.railway.app/api",
  "NODE_ENV": "production"
}
```

## 4) Validacao rapida pos deploy

1. Abra a API:
   - `https://pastractor-production.up.railway.app/api/product-category`
2. Abra o frontend publicado e valide Home/Catalogo/Detalhes.
3. Se ocorrer CORS, ajuste `APP_CORS_ALLOWED_ORIGINS` com a URL exata do frontend e redeploy.

## Arquivos de configuracao Railway

- `backend/railway.toml`
  - Build: `mvn -B -DskipTests clean package`
  - Start: `java -jar target/*.jar`
- `frontend/railway.toml`
  - Build: `npm ci && npm run build`
  - Start: `npm run preview -- --host 0.0.0.0 --port $PORT`

## Observacoes

- Manter `Dockerfile` no repositorio nao prejudica o Railway com `NIXPACKS`.
- O backend usa `PORT` automaticamente em producao (`application.yml`).
- O backend aceita fallback de variaveis `PG*` no profile `prod` (`application-prod.yml`).