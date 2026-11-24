# Comments — Feature Reference

> Quick guide to what this project does and how to start it from scratch.

## What is this project?

**Comments** is a full-stack SPA for threaded commenting. Users leave messages with an SVG captcha, attach images or text files, vote on comments, bookmark favorites, browse a sortable paginated feed, search comments, and receive live updates via WebSocket. Backend is **NestJS + PostgreSQL**; frontend is **Next.js**.

Repository: <https://github.com/p1982/comments>  
Live Demo (Railway): <https://comments-front-production.up.railway.app/uk> (API docs: `/api/v1/docs`, GraphQL: `/graphql` — see [`docs/deploy.md`](deploy.md))

---

## Feature map

| #   | Feature                                                                                                                             | Where                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | **Comment form** — name, email, optional homepage, XHTML-validated text (`[i]`, `[strong]`, `[code]`, `[a]`), SVG captcha + refresh | Web UI + `POST /api/v1/comments`                                      |
| 2   | **Preview** — render comment HTML before submitting without page reload                                                             | Web UI                                                                |
| 3   | **Root list** — paginated feed of top-level comments                                                                                | `GET /api/v1/comments`                                                |
| 4   | **Sorting** — by `createdAt`, `fullName`, or `email`; `asc` / `desc` (URL-synced)                                                   | query params `sort` + `order`                                         |
| 5   | **Pagination** — page + limit (1–25)                                                                                                | query params `page` + `limit`                                         |
| 6   | **Threaded replies** — nested comments under a root with reply counts and thread expand                                             | `POST /api/v1/comments` (`parentId`) / `GET /api/v1/comments/:rootId` |
| 7   | **Likes / Dislikes** — upvote (`+1`) / downvote (`-1`) toggle per user or guest cookie                                              | `POST /api/v1/comments/:id/vote` + GraphQL `voteComment`              |
| 8   | **Card actions & bookmarks** — permalink (`#`), quote (`”`), reply (`↩`), copy text, localStorage bookmarks filter                 | Web UI                                                                |
| 9   | **Image attachment** — JPG / PNG / GIF fitted to ≤ 320 × 240 px (sharp) + lightbox viewer                                           | multipart `image` field                                               |
| 10  | **Text-file attachment** — `.txt`, max 100 KB (client + server validation) + lightbox viewer                                        | multipart `textFile` field                                            |
| 11  | **Search** — full-text + substring search via Elasticsearch with automatic PostgreSQL `ILIKE` fallback                              | `GET /api/v1/comments/search?q=…`                                     |
| 12  | **Auth** — signup / signin / refresh; JWT in httpOnly cookies, show/hide password, auto session restore on load                     | `POST /api/v1/auth/signup`, `/signin`, `/refresh`                     |
| 13  | **Live updates** — `comment.created` and `comment.voted` Socket.IO events                                                           | `/socket.io`                                                          |
| 14  | **REST API** — versioned under `/api/v1`                                                                                            | Swagger: `/api/v1/docs`                                               |
| 15  | **GraphQL API** — queries `health`, `comments`, `commentChildren`, `searchComments`; mutations `createComment`, `voteComment`       | `/graphql` (Playground enabled unless `GRAPHQL_PLAYGROUND=false`)     |
| 16  | **Captcha** — HMAC SVG, httpOnly cookie, 5 min TTL                                                                                  | `GET /api/v1/captcha`                                                 |
| 17  | **i18n** — English and Ukrainian locales                                                                                            | Next.js App Router (`/en`, `/uk`)                                     |
| 18  | **Health check** — database, GraphQL, WebSocket status                                                                              | `GET /api/v1/health`                                                  |
| 19  | **Non-blocking write path** — comment + outbox in one TX; WS / ES / image queue run async                                           | `OutboxPublisherService` + `CommentJobProcessor`                      |
| 20  | **Queue modes** — `sync` (in-request), `memory` (in-process), `rabbit` (RabbitMQ)                                                   | `COMMENT_QUEUE_MODE` env var                                          |

---

## Cookies reference

| Cookie          | Set by                           | TTL (default) | Purpose                                            |
| --------------- | -------------------------------- | ------------- | -------------------------------------------------- |
| `captcha`       | `GET /api/v1/captcha`            | 5 min         | HMAC token validating the visible SVG captcha text |
| `access_token`  | `POST /auth/signup` or `/signin` | 15 min        | JWT for authenticated requests                     |
| `refresh_token` | `POST /auth/signup` or `/signin` | 7 days        | Rotates both tokens via `POST /auth/refresh`       |
| `voter_id`      | `POST /comments/:id/vote`        | 1 year        | Identifies anonymous guests for 1-vote-per-comment |

All cookies are **httpOnly** — never accessible from JavaScript (`SameSite=Lax` on local HTTP; automatically `SameSite=None; Secure; Partitioned` over HTTPS cross-site origins such as Railway).

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

| Service       | URL                                   |
| ------------- | ------------------------------------- |
| Web (Next.js) | <http://localhost:3000/uk>            |
| API (NestJS)  | <http://localhost:3001/api/v1>        |
| Swagger UI    | <http://localhost:3001/api/v1/docs>   |
| GraphQL       | <http://localhost:3001/graphql>       |
| Health check  | <http://localhost:3001/api/v1/health> |

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

npm run dev                      # starts API and Web in parallel
```

Verify:

```bash
curl -s http://localhost:3001/api/v1/health | jq .
# → {"status":"ok","database":"up","graphql":"up","websocket":"up"}

open http://localhost:3000/uk
```

### Option C — API only (for Postman / scripts)

```bash
npm run db:up
npm run dev:api                  # API_PORT=4000 (default PORT=3001 in Docker / .env.example)
```

---

## Postman collection

A ready-made Postman collection is at [`docs/comments-api.postman_collection.json`](comments-api.postman_collection.json).

**Import:**
Postman → Import → select `docs/comments-api.postman_collection.json`.

**Workflow order:**

```text
1. GET  /api/v1/health                → verifies database, graphql, websocket = "up"
2. GET  /api/v1/captcha               → sets captcha cookie and auto-saves {{captcha_answer}}
3. POST /api/v1/auth/signup           → creates account; sets auth cookies
4. POST /api/v1/auth/signin           → re-auth if needed
5. POST /api/v1/comments              → creates a comment (allowed HTML: <a>, <code>, <i>, <strong>)
6. GET  /api/v1/comments              → lists roots (auto-saves {{rootCommentId}})
7. POST /api/v1/comments/:id/vote     → toggles upvote (+1) / downvote (-1)
8. GET  /api/v1/comments/:rootId      → children of a root comment
9. GET  /api/v1/comments/search?q=…   → search via Elasticsearch (with PostgreSQL ILIKE fallback)
10. POST /api/v1/auth/refresh         → rotates access/refresh tokens
```

Collection variables (pre-configured):

| Variable         | Default                         | Description                                        |
| ---------------- | ------------------------------- | -------------------------------------------------- |
| `baseUrl`        | `http://localhost:3001/api/v1`  | REST API base path (`:4000` for `npm run dev:api`) |
| `graphqlUrl`     | `http://localhost:3001/graphql` | GraphQL endpoint (`:4000` for `npm run dev:api`)   |
| `wsUrl`          | `http://localhost:3001`         | Socket.IO origin (`:4000` for `npm run dev:api`)   |
| `signupEmail`    | `test@example.com`              | Email for signup/signin                            |
| `signupPassword` | `Password1!`                    | Password                                           |
| `signupFullName` | `TestUser`                      | Display name (alphanumeric)                        |
| `signupHomepage` | `https://example.com`           | Optional homepage URL                              |
| `captcha_answer` | _(auto-extracted)_              | Auto-parsed from `GET /captcha` SVG test script    |
| `rootCommentId`  | _(auto-saved)_                  | Auto-saved by list / create test scripts           |
| `voteValue`      | `1`                             | Vote payload (`1` or `-1`)                         |
| `searchQuery`    | `world`                         | Query term for search                              |

---

## Key environment variables

See `.env.example` for the full list.

| Variable             | Default                             | Description                                                               |
| -------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `API_PORT` / `PORT`  | `3001` (`4000` in `dev:api`)        | API listening port (`API_PORT` takes precedence over `PORT`)              |
| `API_VERSION`        | `1`                                 | URL prefix `/api/v1`                                                      |
| `API_BASE_URL`       | `http://localhost:3001`             | Base API URL for web build (fallback when `NEXT_PUBLIC_API_URL` is unset) |
| `DB_SYNC`            | `true`                              | Auto-sync schema (set `false` in prod, use migrations)                    |
| `JWT_SECRET`         | `secret`                            | **Change in prod**                                                        |
| `CAPTCHA_SECRET`     | `secret`                            | **Change in prod**                                                        |
| `COMMENT_QUEUE_MODE` | `memory` (`rabbit` in Docker)       | `sync` \| `memory` \| `rabbit`                                            |
| `ELASTICSEARCH_NODE` | `http://localhost:9200`             | ES URL (falls back to PostgreSQL `ILIKE` if unreachable)                  |
| `RABBITMQ_URL`       | `amqp://guest:guest@localhost:5672` | Used when `COMMENT_QUEUE_MODE=rabbit`                                     |
| `CORS_ORIGIN`        | `http://localhost:3000`             | Allowed web origin                                                        |

---

## Project structure

```text
apps/api          NestJS API  (auth, captcha, comments, votes, search, GraphQL, WS, outbox)
apps/web          Next.js UI  (form, captcha, preview, list, votes, bookmarks, real-time, i18n)
apps/e2e          Playwright browser tests
apps/load         k6 load tests (REST + GraphQL profiles)
packages/shared   Shared Zod schemas, DTO types, endpoint constants, cookie names
docs/             Scale analysis, load report, DB schemas, Git conventions, Postman collection
```

---

## Running tests

```bash
npm run test            # unit + integration (Jest), >= 90 % coverage
npm run test:api        # NestJS HTTP e2e (requires Postgres)
npm run test:e2e        # Playwright browser tests (requires API + Web running)
npm run test:load       # k6 load tests (requires API + k6 binary)
npm run typecheck       # TypeScript check
npm run lint            # ESLint
```

> [!TIP]
> Run `npm run check` to mirror everything the pre-push hook and CI check: branch name, format, lint, typecheck, and unit tests.
