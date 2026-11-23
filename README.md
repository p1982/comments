# Comments — монорепозиторій

SPA «Коментарі»: користувачі залишають повідомлення з капчею, переглядають стрічку з сортуванням і пагінацією, прикріплюють файли. Backend — NestJS + PostgreSQL; frontend — Next.js.

Репозиторій: https://github.com/p1982/comments

## Зміст

1. [Що вміє продукт](#що-вміє-продукт)
2. [Стек і версії](#стек-і-версії)
3. [Бібліотеки (опис + версії)](#бібліотеки-опис--версії)
4. [Структура](#структура)
5. [Запуск з нуля](#запуск-з-нуля)
6. [База даних](#база-даних)
7. [Тести](#тести)
8. [Git: гілки, коміти, husky](#git-гілки-коміти-husky)
9. [CI](#ci)
10. [Скрипти](#скрипти)
11. [Документація](#документація)

## Що вміє продукт

| Функція             | Опис                                                         |
| ------------------- | ------------------------------------------------------------ |
| Форма коментаря     | ім’я, email, текст (обмежений HTML), опційна homepage, капча |
| Попередній перегляд | як виглядатиме текст до відправки                            |
| Список / таблиця    | корені коментарів, сортування, сторінки                      |
| Відповіді           | вкладені коментарі під коренем                               |
| Файли               | зображення (fit через sharp) і текстові вкладення            |
| Пошук               | повний текст через Elasticsearch                             |
| Auth                | JWT у httpOnly cookies (signup / signin / refresh)           |
| Live                | нові коментарі по Socket.IO після outbox                     |
| API                 | REST `/api/v1` і GraphQL `/graphql`                          |
| i18n                | локалі `/en`, `/uk`                                          |

Write path: create пише коментар + outbox в одній TX і бампить list-cache; WS / ES / черга зображень — асинхронно, щоб не блокувати список.

## Стек і версії

| Шар             | Технологія                                    | Версія                                        |
| --------------- | --------------------------------------------- | --------------------------------------------- |
| Runtime         | Node.js                                       | **22.22.1** (див. `.nvmrc`)                   |
| Package manager | npm                                           | **≥10.9.4** (`packageManager`: npm@10.9.4)    |
| Монорепо        | NX                                            | **24.0.4**                                    |
| Мова            | TypeScript                                    | **~6.0.3**                                    |
| API             | NestJS                                        | **^11**                                       |
| ORM / БД        | TypeORM + PostgreSQL                          | TypeORM **^0.3.31**, Postgres **16** (Docker) |
| Web             | Next.js                                       | **~16.4.1**                                   |
| UI              | React / MUI                                   | React **^19**, MUI **^9.5**                   |
| Черга           | RabbitMQ                                      | **3** (Docker image)                          |
| Пошук           | Elasticsearch                                 | **8.15.3** (Docker) + клієнт **^8.15**        |
| Якість          | ESLint / Prettier / Jest / Playwright / Husky | див. таблиці нижче                            |

## Бібліотеки (опис + версії)

Версії з кореневого `package.json` / workspace (діапазон `^` / `~` як у lock). Повний список — `package-lock.json`.

### Runtime / платформа (Docker)

| Пакет / образ   | Версія                               | Навіщо                                             |
| --------------- | ------------------------------------ | -------------------------------------------------- |
| `postgres`      | 16-alpine                            | основна БД                                         |
| `elasticsearch` | 8.15.3                               | індекс пошуку коментарів                           |
| `rabbitmq`      | 3-management-alpine                  | опційна черга джобів (`COMMENT_QUEUE_MODE=rabbit`) |
| k6              | окремий бінарник (`brew install k6`) | навантажувальні тести (не npm)                     |

### Backend (API)

| Бібліотека                                                        | Версія                | Опис                              |
| ----------------------------------------------------------------- | --------------------- | --------------------------------- |
| `@nestjs/common` / `core` / `platform-express`                    | ^11                   | HTTP API Nest                     |
| `@nestjs/config`                                                  | ^12                   | конфіг з `.env`                   |
| `@nestjs/typeorm` + `typeorm` + `pg`                              | ^11 / ^0.3.31 / ^8.23 | ORM + драйвер Postgres            |
| `@nestjs/jwt`                                                     | ^12                   | access / refresh токени           |
| `@nestjs/graphql` + `@nestjs/apollo` + `graphql`                  | ^13 / ^13 / ^16.14    | GraphQL schema + Apollo           |
| `@apollo/server` + `@as-integrations/express5`                    | ^5 / ^1.1             | GraphQL HTTP на Express 5         |
| `graphql-upload`                                                  | ^16                   | multipart upload у GraphQL        |
| `@nestjs/websockets` + `@nestjs/platform-socket.io` + `socket.io` | ^11 / ^11 / ^4.8      | realtime `comment.created`        |
| `@nestjs/microservices` + `amqplib` + `amqp-connection-manager`   | ^11 / ^2.4 / ^5       | RabbitMQ транспорт                |
| `@nestjs/cache-manager` + `cache-manager`                         | ^12 / ^7.2            | in-process list cache             |
| `@nestjs/event-emitter`                                           | ^12                   | внутрішні події / outbox publish  |
| `@nestjs/swagger`                                                 | ^11.4 (api workspace) | OpenAPI UI `/api/v1/docs`         |
| `@elastic/elasticsearch`                                          | ^8.15                 | клієнт ES 8.x                     |
| `class-validator` + `class-transformer`                           | ^0.15 / ^0.5          | валідація GraphQL input / DTO     |
| `cookie-parser`                                                   | ^1.4                  | JWT / captcha cookies             |
| `bcrypt`                                                          | ^6 (api)              | хеш паролів                       |
| `sharp`                                                           | ^0.35                 | fit зображень                     |
| `zod`                                                             | ^4.6                  | схеми тіл запитів (REST + shared) |
| `rxjs` + `reflect-metadata`                                       | ^7.8 / ^0.2           | Nest DI / streams                 |

### Frontend (Web)

| Бібліотека                                                       | Версія       | Опис                                  |
| ---------------------------------------------------------------- | ------------ | ------------------------------------- |
| `next`                                                           | ~16.4.1      | App Router, SSR/CSR                   |
| `react` / `react-dom`                                            | ^19          | UI                                    |
| `@mui/material` + `@mui/icons-material` + `@mui/material-nextjs` | ^9.5         | компоненти / іконки / Next інтеграція |
| `@emotion/react` + `@emotion/styled`                             | ^11.14       | emotion для MUI                       |
| `styled-components`                                              | ^6.6         | styled UI                             |
| `react-hook-form` + `@hookform/resolvers`                        | ^7.91 / ^7.0 | форми + zod resolver                  |
| `next-intl`                                                      | ^4.14        | i18n en/uk                            |
| `zustand`                                                        | ^5.1         | клієнтський стор коментарів           |
| `@apollo/client` + `@apollo/client-integration-nextjs`           | ^4.3 / ^0.14 | GraphQL клієнт (де використовується)  |
| `axios`                                                          | ^1.21        | HTTP до REST API                      |
| `socket.io-client`                                               | ^4.8         | підписка на нові коментарі            |
| `zod`                                                            | ^4.6         | валідація на клієнті                  |
| `dompurify` + `jsdom`                                            | ^3.4 / ^29   | санітизація HTML                      |
| `dayjs`                                                          | ^1.11 (web)  | дати                                  |
| `react-toastify`                                                 | ^11.2 (web)  | тости                                 |

### Shared / якість / інструменти

| Бібліотека                                | Версія       | Опис                    |
| ----------------------------------------- | ------------ | ----------------------- |
| `nx` (+ `@nx/*`)                          | 24.0.4       | монорепо таски          |
| `typescript`                              | ~6.0.3       | компіляція              |
| `eslint` + `typescript-eslint`            | ^9.8 / ^8.58 | лінт                    |
| `eslint-config-next` + react-плагіни      | ^16.1 / …    | правила Next/React      |
| `prettier`                                | ~3.6.2       | форматування            |
| `jest` + `@swc/jest` + `ts-jest`          | ~30.5 / …    | unit-тести              |
| `@playwright/test`                        | ^1.65        | браузерні e2e           |
| `supertest`                               | ^7.3         | HTTP e2e API            |
| `husky`                                   | ^9.1.7       | git hooks               |
| `lint-staged`                             | ^17.6        | lint лише staged файлів |
| `@commitlint/cli` + `config-conventional` | ^21.2        | Conventional Commits    |
| `webpack` + `webpack-cli`                 | ~5.112 / ^7  | збірка API              |
| `@swc/core` / `@swc/cli`                  | ~1.15 / ~0.8 | швидка транспіляція     |

## Структура

```
apps/api          NestJS API (коментарі, auth, captcha, outbox, search, GraphQL, WS)
apps/web          Next.js UI
apps/e2e          Playwright (браузер)
apps/load         k6 load (create + list)
packages/shared   спільні схеми / DTO / утиліти
docs/             scale, load-report, схеми БД, git-конвенції
```

## Запуск з нуля

Потрібні **Node.js 22.22.1**, **Docker** (Postgres; для повного стеку — RabbitMQ / ES).

### Варіант A — усе в Docker

```bash
git clone https://github.com/p1982/comments.git
cd comments
cp .env.example .env
npm run docker:up
```

| Сервіс  | URL                                 |
| ------- | ----------------------------------- |
| Web     | http://localhost:3000               |
| API     | http://localhost:3001/api/v1        |
| Health  | http://localhost:3001/api/v1/health |
| Swagger | http://localhost:3001/api/v1/docs   |
| GraphQL | http://localhost:3001/graphql       |

Зупинка: `npm run docker:down`.

### Варіант B — локальна розробка

```bash
git clone https://github.com/p1982/comments.git
cd comments
nvm use
cp .env.example .env
npm install
npm run db:up
```

Для `nx serve` потрібен доступний Postgres на `DB_HOST` з `.env` (зазвичай `localhost:5432` — пробрось порт у compose або використай локальний Postgres).

```bash
npm run migration:run          # якщо DB_SYNC=false
docker compose up -d elasticsearch   # опційно пошук
npm run dev
# npm run dev:api  → :3001
# npm run dev:web  → :3000
```

```bash
curl -m 3 http://localhost:3001/api/v1/health
open http://localhost:3000/uk
```

## База даних

Таблиці: `users`, `comments`, `attachments`, `outbox_events`.

- Стартовий знімок (MySQL Workbench): [`docs/comments-schema.sql`](docs/comments-schema.sql)
- Поточна схема за міграціями: [`docs/comments-schema-current.sql`](docs/comments-schema-current.sql)

![Схема БД коментарів](https://res.cloudinary.com/dkdsf8hw3/image/upload/v1794220496/comments_db_ddj6ct.png)

## Тести

| Команда                         | Що перевіряє                                                     | Де                             | Потрібно                           |
| ------------------------------- | ---------------------------------------------------------------- | ------------------------------ | ---------------------------------- |
| `npm run test`                  | unit / integration Jest (api, web, shared), coverage ~90% на API | локально + husky pre-push + CI | нічого додаткового                 |
| `npm run test:api`              | Nest HTTP e2e (`comments.e2e-spec` тощо)                         | CI + вручну                    | Postgres                           |
| `npm run test:e2e`              | Playwright: форма, preview, список, sort, пагінація, файл        | вручну                         | API + web (або auto-start web)     |
| `npm run test:load`             | k6 create+list (REST / GraphQL), профілі smoke/local/peak        | вручну                         | API + Postgres + `brew install k6` |
| `npm run typecheck`             | TS api + shared                                                  | husky + CI                     | —                                  |
| `npm run lint` / `format:check` | ESLint / Prettier                                                | husky + CI                     | —                                  |
| `npm run check`                 | гілка + format + lint + typecheck + `test`                       | вручну / дзеркало pre-push     | —                                  |

Деталі:

- Browser e2e → [`apps/e2e/README.md`](apps/e2e/README.md)
- Load → [`apps/load/README.md`](apps/load/README.md), звіт → [`docs/load-report.md`](docs/load-report.md)
- **Load не в husky і не в обов’язковому CI gate** (потрібен живий API + бінарник k6)

Приклади:

```bash
npm run test
npm run test:api
npm run test:e2e
LOAD_TRANSPORT=graphql npm run test:load
```

## Git: гілки, коміти, husky

Повний гайд також у [`docs/GIT_CONVENTIONS.md`](docs/GIT_CONVENTIONS.md). Ім’я гілки перевіряється на **pre-commit**, **pre-push** і в CI (`npm run check:branch`).

### Довгоживучі гілки

`main` | `master` | `develop`

### Feature-гілки — формат імені

```text
<type>/<description>
<type>/<ticket>-<description>
```

**Типи:** `feature` | `fix` | `hotfix` | `release` | `chore` | `docs` | `refactor` | `test` | `ci` | `perf`

**Правила:** лише lowercase, kebab-case сегменти, один `/` одразу після типу.

```text
# ок
feature/add-comments-api
fix/COM-12-cors-origin
chore/update-eslint
docs/readme-features
test/comments-load
docs/db-schema

# не ок
Feature/Foo
my-branch
feature_add_api
```

### Коміти (Conventional Commits)

```text
<type>(optional-scope): <subject>

[optional body]
```

**Типи коміту:** `feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `build` | `ci` | `chore` | `revert`

Subject: наказовий спосіб, без крапки в кінці, ≤100 символів.

```text
feat(api): add health endpoint versioning
fix(web): correct locale switcher links
docs: describe product features in README
test(load): add k6 create/list profiles
```

### Husky hooks

| Hook         | Що робить                                      |
| ------------ | ---------------------------------------------- |
| `pre-commit` | ім’я гілки + lint-staged (ESLint + Prettier)   |
| `commit-msg` | commitlint (Conventional Commits)              |
| `pre-push`   | гілка + format + lint + typecheck + `npm test` |

Після `npm install` hooks ставляться скриптом `prepare`.

## CI

GitHub Actions (`.github/workflows/ci.yml`):

- ім’я гілки (на PR)
- format, lint, typecheck, unit-тести
- `npm run test:api` (сервіс Postgres)
- build

Це дзеркало pre-push + API e2e + build. Load / Playwright — окремо.

## Скрипти

```bash
npm run dev              # api + web паралельно
npm run dev:api
npm run dev:web
npm run docker:up / docker:down
npm run db:up / db:down / db:seed
npm run migration:run / migration:revert / migration:generate
npm run lint / format / format:check / typecheck
npm run test / test:api / test:e2e / test:load
npm run build
npm run check / check:branch
```

## Документація

- [План масштабу](docs/comments-scale.md) — 1M коментарів / ~100k користувачів на добу
- [Звіт навантаження](docs/load-report.md)
- [Load (k6)](apps/load/README.md)
- [Browser e2e](apps/e2e/README.md)
- [Git-конвенції](docs/GIT_CONVENTIONS.md)

## Нотатки

- Env: `.env.example` (`CAPTCHA_SECRET`, `JWT_SECRET`, `COMMENT_QUEUE_MODE`, `ELASTICSEARCH_NODE`).
- URL API для web: `${API_BASE_URL}/api/v${API_VERSION}` у `apps/web/next.config.js` (`getApiUrl()` з `@comments/shared`).
- Черга: `COMMENT_QUEUE_MODE=sync|memory|rabbit`.
