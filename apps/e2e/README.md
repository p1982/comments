# Browser e2e (`test/comment-e2e`)

Playwright covers: form, preview, list, sort, pagination, file upload.

## Prerequisites

- API on `http://localhost:3001` with Postgres migrated/synced
- Web on `http://localhost:3000` (Playwright can start `next dev` automatically)

```bash
docker compose up -d postgres rabbitmq elasticsearch api
# ensure DB_SYNC=true for local compose, or run migrations
npm run test:e2e
```

## Notes

- API HTTP e2e already lives in `apps/api/src/comments/comments.e2e-spec.ts` (`npm run test:api`).
- This package is **browser** e2e only; do not duplicate API coverage here.
- Captcha is solved by fetching `/api/v1/captcha` and parsing the SVG code.
