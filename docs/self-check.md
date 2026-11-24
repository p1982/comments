# Self-check: запуск із чистого клону за README (`docs/self-check`)

Перевірка запуску проєкту з нуля у чистій директорії виключно за інструкцією з [`README.md`](../README.md) (Варіант A — усе в Docker).

- **Дата перевірки:** 2026-11-24
- **Перевірений коміт (`origin/main`):** `4d20f36` (`Merge pull request #77 from p1982/develop`)
- **Робоча директорія:** чистий клон `/tmp/comments-self-check` (видалено після завершення перевірки)

## Виконані кроки з README

```bash
git clone https://github.com/p1982/comments.git /tmp/comments-self-check
cd /tmp/comments-self-check
cp .env.example .env
npm run docker:up
```

Усі 5 контейнерів (`comments-postgres`, `comments-rabbitmq`, `comments-elasticsearch`, `comments-api`, `comments-web`) зібралися й стартували з першого разу без жодних ручних правок (`[+] up 10/10`, `comments-api` — `Healthy`).

## Результати перевірки (8/8 PASS)

| #   | Перевірка                                                                             | Результат | Деталі                                                                                                                       |
| --- | ------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | `GET http://localhost:3001/api/v1/health`                                             | PASS      | `HTTP 200` — `{"status":"ok","database":"up","graphql":"up","websocket":"up"}`                                               |
| 2   | `GET http://localhost:3001/api/v1/docs`                                               | PASS      | `HTTP 200` — Swagger UI завантажується                                                                                       |
| 3   | `GET / POST http://localhost:3001/graphql`                                            | PASS      | `HTTP 200` — Apollo Playground UI + `query { health comments(...) }` (`health="API is running"`)                             |
| 4   | `GET http://localhost:3001/socket.io/?EIO=4&transport=polling`                        | PASS      | `HTTP 200` — Socket.IO handshake + `upgrades: ["websocket"]`                                                                 |
| 5   | `GET http://localhost:3000/uk` та `/en`                                               | PASS      | `HTTP 200` — SSR HTML обох локалей (`Коментарі` / `Comments`)                                                                |
| 6   | `GET /api/v1/captcha` → `POST /api/v1/comments` (HTML + PNG + `.txt`)                 | PASS      | `HTTP 201` — коментар створено з валідним XHTML, SVG CAPTCHA та обома вкладеннями                                            |
| 7   | Асинхронні вкладення (`RabbitMQ` → `sharp` → `api_assets`) + Outbox → `Elasticsearch` | PASS      | PNG (`200 OK`), `.txt` (`200 OK`, `Content-Security-Policy: default-src 'none'; sandbox`), пошук знайшов запис (`matches=1`) |
| 8   | `POST /api/v1/comments/:id/vote` (`{ "value": 1 }`)                                   | PASS      | `HTTP 200` — `votesScore=1`, `userVote=1`                                                                                    |

## Очищення

Після перевірки тестовий стек зупинено та видалено разом із тимчасовими volume (`docker compose down -v`) і папкою `/tmp/comments-self-check`.
