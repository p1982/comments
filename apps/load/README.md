# Comments load tests (k6)

Load create + list against a running API. Install k6 separately (`brew install k6`); it is not an npm package.

## Prerequisites

- API on `http://localhost:3001` (`npm run dev:api` or compose)
- Postgres up
- `CAPTCHA_SECRET` same as API `.env` (default `secret`)
- Elasticsearch optional for create/list (outbox still tries to index if `ELASTICSEARCH_NODE` is set)

## Run

```bash
# 1) API must answer health first
curl -m 3 http://localhost:3001/api/v1/health

# 2) default smoke: REST ~2 list/s + 1 create/s for 30s
npm run test:load

LOAD_PROFILE=local npm run test:load
LOAD_PROFILE=peak npm run test:load

# GraphQL instead of REST (POST /graphql)
LOAD_TRANSPORT=graphql npm run test:load

# Split rate across REST + GraphQL
LOAD_TRANSPORT=both npm run test:load
```

| `LOAD_TRANSPORT` | What runs                                    |
| ---------------- | -------------------------------------------- |
| `rest` (default) | `GET/POST /api/v1/comments`                  |
| `graphql`        | `POST /graphql` `comments` + `createComment` |
| `both`           | half rate each transport (total ≈ profile)   |

End of run prints a **LOAD BOARD** (count, speed req/s, success %) and writes `apps/load/results.json`.

If the API hangs after a heavy run: stop k6 (`Ctrl+C`), restart `npm run dev:api`, wait for health 200, then smoke again.

## Profiles

| `LOAD_PROFILE`    | list/s | create/s | duration |
| ----------------- | ------ | -------- | -------- |
| `smoke` (default) | 2      | 1        | 30s      |
| `local`           | 5      | 2        | 1m       |
| `peak`            | 20     | 10       | 2m       |

## How to read results

Healthy **smoke** on a laptop usually looks like:

- `checks_succeeded` 100%, `errors` 0%; REST `create 201` / `list 200`, GraphQL `200` + no `errors` + payload
- create **med** ~10–30ms, list **med** single-digit–tens ms
- create **p95** can still be hundreds of ms (or 1–2s) from a cold first write / GC; thresholds allow that

Failed **peak** on a laptop typically shows:

- many `request timeout` once the API event loop / DB / ES outbox work backs up
- `create 201` near 0% while `list 200` stays partially OK until saturation
- successful responses can still be fast; p95 is pulled up by timeouts

Useful for `docs/load-report`: bottleneck is often **write side effects** (outbox → ES) and **single-process Nest**, not the list query itself when cache hits.
