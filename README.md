# Comments monorepo

NX monorepo: **NestJS** API + **Next.js** web, TypeORM/PostgreSQL, MUI, react-hook-form, styled-components, next-intl.

## Stack

| Layer    | Tech                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------- |
| Monorepo | NX 24, npm workspaces                                                                                    |
| API      | NestJS, TypeORM, PostgreSQL                                                                              |
| Web      | Next.js App Router, MUI, styled-components, react-hook-form, next-intl                                   |
| Quality  | Strict TS (`exactOptionalPropertyTypes`, `verbatimModuleSyntax`), ESLint strictTypeChecked, Prettier, CI |

## Database

Target schema for comments: `users`, `comments`, `attachments`, `outbox_events`.

![Comments database schema](https://res.cloudinary.com/dkdsf8hw3/image/upload/v1794220496/comments_db_ddj6ct.png)

## Structure

```
apps/api          NestJS API (TypeORM wired, no domain modules yet)
apps/web          Next.js (en/uk i18n, MUI + RHF + styled-components)
packages/shared   Shared TypeScript package
```

## Setup

Requires **Node.js 22.22.1** (see `.nvmrc`).

```bash
nvm use   # or: fnm use / asdf install
cp .env.example .env
docker compose up -d
npm install
```

## Dev

```bash
# API → http://localhost:3001/api
npx nx serve api

# Web → http://localhost:3000
npx nx dev web
```

Or both:

```bash
npm run dev
```

## Scripts

```bash
npm run lint
npm run format
npm run typecheck
npm run test
npm run build
npm run check          # branch + format + lint + typecheck + test
npm run check:branch
```

## Git conventions

Husky enforces:

- **Branches:** `feature/add-api`, `fix/COM-12-cors`, `chore/...` (see `docs/GIT_CONVENTIONS.md`)
- **Commits:** Conventional Commits — `feat(api): add health endpoint`
- **pre-commit:** branch name + lint-staged
- **commit-msg:** commitlint
- **pre-push:** full checks (format, lint, typecheck, test)

## Notes

- TypeORM is configured with `autoLoadEntities: true` — add entities/modules when needed.
- Locales: `/en`, `/uk`.
- Env template: `.env.example`.
- API URL for web is composed as `${API_BASE_URL}/api/v${API_VERSION}` in `apps/web/next.config.js` (use `getApiUrl()` from `@comments/shared`).
