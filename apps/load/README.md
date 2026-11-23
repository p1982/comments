# Навантажувальні тести коментарів (k6)

Навантаження create + list проти запущеного API. k6 ставиться окремо (`brew install k6`) — це не npm-пакет.

## Передумови

- API на `http://localhost:3001` (`npm run dev:api` або compose)
- Postgres піднятий
- `CAPTCHA_SECRET` як у `.env` API (за замовчуванням `secret`)
- Elasticsearch опційний для create/list (якщо заданий `ELASTICSEARCH_NODE`, outbox все одно пробує індексувати)

## Запуск

```bash
# 1) API має відповісти на health
curl -m 3 http://localhost:3001/api/v1/health

# 2) smoke за замовчуванням: REST ~2 list/s + 1 create/s, 30s
npm run test:load

LOAD_PROFILE=local npm run test:load
LOAD_PROFILE=peak npm run test:load

# GraphQL замість REST (POST /graphql)
LOAD_TRANSPORT=graphql npm run test:load

# Половина REST + половина GraphQL
LOAD_TRANSPORT=both npm run test:load
```

| `LOAD_TRANSPORT` | Що ганяється                                      |
| ---------------- | ------------------------------------------------- |
| `rest` (default) | `GET/POST /api/v1/comments`                       |
| `graphql`        | `POST /graphql` — `comments` + `createComment`    |
| `both`           | половина rate на кожен транспорт (сума ≈ профіль) |

В кінці — **LOAD BOARD** (count, speed req/s, success %) і файл `apps/load/results.json`.

Якщо API «завис» після важкого прогону: зупини k6 (`Ctrl+C`), перезапусти `npm run dev:api`, дочекайся health 200, знову smoke.

## Профілі

| `LOAD_PROFILE`    | list/s | create/s | тривалість |
| ----------------- | ------ | -------- | ---------- |
| `smoke` (default) | 2      | 1        | 30s        |
| `local`           | 5      | 2        | 1m         |
| `peak`            | 20     | 10       | 2m         |

## Як читати результати

Здоровий **smoke** на ноутбуці:

- `checks_succeeded` 100%, `errors` 0%; REST `create 201` / `list 200`, GraphQL `200` без `errors` + payload
- create **med** ~10–30 ms, list **med** одиниці–десятки ms
- create **p95** інколи сотні ms (або 1–2 s) через холодний перший write / GC — пороги це допускають

Провальний **peak** на ноутбуці:

- багато `request timeout`, коли event loop / DB / ES outbox забиваються
- `create 201` майже 0%, list тримається частково до насичення
- успішні відповіді можуть лишатись швидкими; p95 тягнуть таймаути

Корисно для `docs/load-report`: вузьке місце часто **побічні ефекти запису** (outbox → ES) і **один процес Nest**, а не сам list при cache hit.
