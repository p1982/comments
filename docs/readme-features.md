# Comments — Feature Reference

> Quick guide to what this project does and how to start it from scratch.

## What is this project?

**Comments** is a full-stack SPA for threaded commenting. Users leave messages with a captcha, attach images or text files, browse a sortable paginated feed, and receive new comments in real time via WebSocket. Backend is **NestJS + PostgreSQL**; frontend is **Next.js**.

Repository: <https://github.com/p1982/comments>

---

## Feature map

| #   | Feature                                                                                             | Where                                                                    |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------ | -------- |
| 1   | **Comment form** — name, email, optional homepage, HTML-limited text, captcha                       | Web UI + `POST /api/v1/comments`                                         |
| 2   | **Preview** — render comment HTML before submitting                                                 | Web UI                                                                   |
| 3   | **Root list** — paginated table of top-level comments                                               | `GET /api/v1/comments`                                                   |
| 4   | **Sorting** — by `createdAt`, `fullName`, or `email`; `asc`/`desc`                                  | query param `sort` + `order`                                             |
| 5   | **Pagination** — page + limit (1–25)                                                                | query param `page` + `limit`                                             |
| 6   | **Threaded replies** — nested comments under a root                                                 | `POST /api/v1/comments` with `parentId` / `GET /api/v1/comments/:rootId` |
| 7   | **Image attachment** — uploaded file is fitted to 320 × 240 px (sharp)                              | multipart `image` field                                                  |
| 8   | **Text-file attachment** — `.txt`, max 100 KB                                                       | multipart `textFile` field                                               |
| 9   | **Full-text search** — text + author via Elasticsearch                                              | `GET /api/v1/comments/search?q=…`                                        |
| 10  | **Auth** — signup / signin / token refresh; JWT in httpOnly cookies                                 | `POST /api/v1/auth/signup                                                | signin | refresh` |
| 11  | **Live updates** — `comment.created` Socket.IO event after outbox publish                           | `/socket.io`                                                             |
| 12  | **REST API** — versioned under `/api/v1`                                                            | Swagger: `/api/v1/docs`                                                  |
| 13  | **GraphQL API** — queries `comments`, `commentChildren`, `searchComments`; mutation `createComment` | `/graphql` (playground in dev)                                           |
| 14  | **Captcha** — HMAC SVG, httpOnly cookie, 5 min TTL                                                  | `GET /api/v1/captcha`                                                    |
| 15  | **i18n** — English and Ukrainian locales                                                            | Next.js App Router (`/en`, `/uk`)                                        |
| 16  | **Health check** — DB, GraphQL, WebSocket status                                                    | `GET /api/v1/health`                                                     |
| 17  | **Non-blocking write path** — comment + outbox in one TX; WS / ES / image queue run async           | outbox publisher + event emitter                                         |
| 18  | **Queue modes** — `sync` (in-request), `memory` (in-process), `rabbit` (RabbitMQ)                   | `COMMENT_QUEUE_MODE` env var                                             |

---

## Cookies reference

| Cookie          | Set by                           | TTL (default) | Purpose                                        |
| --------------- | -------------------------------- | ------------- | ---------------------------------------------- |
| `captcha`       | `GET /api/v1/captcha`            | 5 min         | HMAC token validating the visible captcha text |
| `access_token`  | `POST /auth/signup` or `/signin` | 15 min        | JWT for authenticated requests                 |
| `refresh_token` | `POST /auth/signup` or `/signin` | 7 days        | Rotates both tokens via `POST /auth/refresh`   |

All cookies are **httpOnly, SameSite=Lax** — never accessible from JavaScript.

---

## Zero-to-running (from scratch)

### Prerequisites

| Tool                    | Required version           |
| ----------------------- | -------------------------- |
| Node.js                 | **22.22.1** (see `.nvmrc`) |
| Docker + Docker Compose | any recent version         |
| npm                     | ≥ 10.9.4                   |

### Option A — everything in Docker (recommended)

```bash
git clone https://github.com/p1982/comments.git
cd comments
cp .env.example .env
npm run docker:up
```

| Service            | URL                                   |
| ------------------ | ------------------------------------- |
| Web (Next.js)      | <http://localhost:3000/uk>            |
| API (NestJS)       | <http://localhost:3001/api/v1>        |
| Swagger UI         | <http://localhost:3001/api/v1/docs>   |
| GraphQL playground | <http://localhost:3001/graphql>       |
| Health check       | <http://localhost:3001/api/v1/health> |

Stop: `npm run docker:down`

### Option B — local dev (Node + Docker only for infra)

```bash
git clone https://github.com/p1982/comments.git
cd comments
nvm use                          # switches to Node 22.22.1
cp .env.example .env
npm install                      # installs all workspace packages
npm run db:up                    # starts Postgres in Docker
npm run migration:run            # apply DB migrations (if DB_SYNC=false)

# optional: full-text search
docker compose up -d elasticsearch

npm run dev                      # starts API (:3001) and Web (:3000) in parallel
```

Verify:

```bash
curl -s http://localhost:3001/api/v1/health | jq .
# → {"status":"ok","db":"ok","graphql":"ok","ws":"ok"}

open http://localhost:3000/uk
```

### Option C — API only (for Postman / scripts)

```bash
npm run db:up
npm run dev:api                  # :3001 only
```

---

## Postman collection

A ready-made Postman collection is at [`docs/comments-api.postman_collection.json`](comments-api.postman_collection.json).

**Import:**  
Postman → Import → select `docs/comments-api.postman_collection.json`.

**Workflow order:**

```
1. GET  /api/v1/captcha               → captcha cookie set; read SVG text
2. POST /api/v1/auth/signup           → creates account; auth cookies set
3. POST /api/v1/auth/signin           → re-auth if needed
4. POST /api/v1/comments              → create a comment (captcha value in body)
5. GET  /api/v1/comments              → list (auto-saves rootCommentId variable)
6. GET  /api/v1/comments/:rootId      → children of a root comment
7. GET  /api/v1/comments/search?q=…  → full-text search (needs Elasticsearch)
8. POST /api/v1/auth/refresh          → rotate tokens
```

Collection variables (pre-configured):

| Variable         | Default                        | Description                     |
| ---------------- | ------------------------------ | ------------------------------- |
| `baseUrl`        | `http://localhost:3001/api/v1` | API base path                   |
| `signupEmail`    | `test@example.com`             | Email for signup/signin         |
| `signupPassword` | `Password1!`                   | Password                        |
| `signupFullName` | `TestUser`                     | Display name (alphanumeric)     |
| `captcha_answer` | _(empty)_                      | Set manually after GET /captcha |
| `rootCommentId`  | _(empty)_                      | Auto-saved by test scripts      |
| `searchQuery`    | `nestjs`                       | Query term for search           |

---

## Key environment variables

See `.env.example` for the full list.

| Variable             | Default                             | Description                                            |
| -------------------- | ----------------------------------- | ------------------------------------------------------ |
| `PORT`               | `3001`                              | API port                                               |
| `API_VERSION`        | `1`                                 | URL prefix `/api/v1`                                   |
| `DB_SYNC`            | `true`                              | Auto-sync schema (set `false` in prod, use migrations) |
| `JWT_SECRET`         | `secret`                            | **Change in prod**                                     |
| `CAPTCHA_SECRET`     | `secret`                            | **Change in prod**                                     |
| `COMMENT_QUEUE_MODE` | `memory`                            | `sync` \| `memory` \| `rabbit`                         |
| `ELASTICSEARCH_NODE` | `http://localhost:9200`             | ES URL (search disabled if unreachable)                |
| `RABBITMQ_URL`       | `amqp://guest:guest@localhost:5672` | Used when `COMMENT_QUEUE_MODE=rabbit`                  |
| `CORS_ORIGIN`        | `http://localhost:3000`             | Allowed web origin                                     |

---

## Project structure

```
apps/api          NestJS API  (auth, captcha, comments, search, GraphQL, WS, outbox)
apps/web          Next.js UI  (form, preview, list, real-time, i18n en/uk)
apps/e2e          Playwright browser tests
apps/load         k6 load tests (REST + GraphQL profiles)
packages/shared   Shared Zod schemas, endpoint constants, cookie names
docs/             Scale analysis, load report, DB schema, Git conventions, Postman collection
```

---

## Running tests

```bash
npm run test            # unit + integration (Jest), ~90 % coverage on API
npm run test:api        # NestJS HTTP e2e (requires Postgres)
npm run test:e2e        # Playwright browser tests (requires API + Web running)
npm run typecheck       # TypeScript check
npm run lint            # ESLint
```

> [!TIP]
> Run `npm run check` to mirror everything the pre-push hook and CI check: branch name, format, lint, typecheck, and unit tests.
