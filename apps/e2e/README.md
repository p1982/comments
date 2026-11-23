# Браузерні e2e (`test/comment-e2e`)

Playwright покриває: форму, попередній перегляд, список, сортування, пагінацію, завантаження файлу.

## Передумови

- API на `http://localhost:3001` з Postgres (міграції або `DB_SYNC=true`)
- Web на `http://localhost:3000` (Playwright може сам підняти `next dev`)

```bash
docker compose up -d postgres rabbitmq elasticsearch api
# для локального compose зручно DB_SYNC=true, або npm run migration:run
npm run test:e2e
```

## Нотатки

- HTTP e2e API — у `apps/api/src/comments/comments.e2e-spec.ts` (`npm run test:api`).
- Цей пакет лише **браузерний** e2e; не дублюй тут API-покриття.
- Капча: запит `/api/v1/captcha` і розбір коду з SVG.
