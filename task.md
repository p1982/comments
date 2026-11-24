# Завдання: SPA «Коментарі»

Репозиторій: https://github.com/p1982/comments  
Дедлайн: 20.11.2026

Джерело: тестове PDF. Гілки, що вже зроблено, і дрібні задачі по всіх рівнях, включно з Middle+.

## Як називати гілки

Формат: `<type>/<короткий-опис>` або `<type>/<ticket>-<опис>`.

- Лише нижній регістр і kebab-case.
- Слеш лише один, одразу після типу.
- Типи: `feature`, `fix`, `hotfix`, `release`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`.
- Довгі гілки: `main`, `develop`.

Приклади:

```text
feature/comment-form
feature/comment-pagination
fix/xss-allowed-tags
chore/docker-api-image
docs/db-schema
test/comments-load
```

Неправильно: `Feature/Foo`, `my-branch`, `feature_add_api`.

Коміт: `feat(api): add comment entity` — тип, необов’язковий scope, тема без крапки в кінці.

Кожна задача нижче — окрема гілка від `develop`. Порядок вже такий, у якому їх варто робити: спочатку дані і збереження коментаря, потім список, форма, файли, доставка, і лише в кінці навантаження та деплой.

Оцінка для Middle+: скільки ще робити. Те, що вже в репозиторії, повторно не рахується. День — 8 годин.

|     | Години | Дні |
| --- | -----: | --: |
|     |    120 |  15 |

## Зроблено

16 годин.

- [x] Монорепо NX: NestJS API, Next.js (React), пакет `shared`. — 4 год.
- [x] Git, Conventional Commits, перевірка імені гілки, lint, typecheck, тести перед пушем. — 2 год.
- [x] PostgreSQL у Docker Compose, TypeORM підключений через `ConfigService`. — 2 год.
- [x] GraphQL (Apollo) підключений до API. — 2 год.
- [x] Глобальний HTTP-фільтр помилок і спільні тексти в `apps/api/src/common/filter/error-messages.ts`. — 2 год.
- [x] Заготовка форматера GraphQL-помилок і фільтра WebSocket (ще не підключені до потоку коментарів). — 2 год.
- [x] Базовий фронт: MUI, форми, стилі, локалі `en` / `uk`. — 3 год.
- [x] `.env.example` і короткий README з запуском. — 1 год.

## Схема бази

Цільова схема: `users`, `comments`, `attachments`, `outbox_events`. Сутності й міграції мають збігатися з нею.

![Схема бази коментарів](https://res.cloudinary.com/dkdsf8hw3/image/upload/v1794220496/comments_db_ddj6ct.png)

## Порядок роботи

104 годин, 15 робочих днів.

1. [x] `chore/typeorm-migrations` — схема змінюється міграціями, не `synchronize` на віддаленому середовищі. На цьому кроці таблиць коментарів ще немає: лише вмикається механізм. У `TypeORM` лишити `synchronize` тільки для локальної розробки (`DB_SYNC=true`). Для решти середовищ `synchronize: false`. Додати скрипти `migration:generate` і `migration:run`. Першу міграцію зі таблицею коментаря писати на кроці 2, разом із сутністю. — 2 год.
2. [x] `feature/comment-entity` — коментар: ім’я, email, домашня сторінка, текст, дата, батьківський коментар, дані для впізнання клієнта. Запити лише через ORM. — 2 год.
3. [x] `feature/comment-validation` — ім’я: латиниця і цифри, обов’язкове; email обов’язковий; домашня сторінка — URL, необов’язкова; текст обов’язковий. — 2 год.
4. [x] `feature/xss-tags` — у тексті лише `<a href title>`, `<code>`, `<i>`, `<strong>`. — 2 год.
5. [x] `feature/xhtml-tags` (фактична гілка: `feature/xhmtl`) — теги закриті, вкладення валідне, інший HTML відхиляється. — 2 год.
6. [x] `test/comment-validation` — юніт-тести імені, email, URL і дозволених тегів. — 2 год.
7. [x] `feature/comment-create-api` — REST: створити кореневий коментар. — 2 год.
8. [x] `feature/comment-replies` — відповідь на будь-який запис, без обмеження глибини. — 2 год.
9. [x] `feature/comment-list-api` — список кореневих коментарів, LIFO за замовчуванням, сортування за ім’ям, email і датою, сторінка по 25. — 3 год.
10. [x] `feature/comments-paging-index` — індекси під це сортування і сторінку, без повного скану таблиці. Middle+. — 2 год.
11. [x] `feature/swagger` — Swagger UI на вже готові REST-методи. Далі доповнювати його кожним новим методом. — 1 год.
12. [x] `test/comment-api` — тести API з тестовою PostgreSQL: створення, відповідь, сортування, сторінка 25. — 3 год.
13. [x] `feature/comment-table` — кореневі коментарі таблицею, каскад відповідей, сортування і сторінки. — 4 год.
14. [x] `feature/comment-styles` — простий вигляд списку і форми на CSS. — 2 год.
15. [x] `feature/comment-form` — форма створення з тією самою перевіркою, що на сервері. — 3 год.
16. [x] `feature/comment-preview` — попередній перегляд тексту без перезавантаження. — 2 год.
17. [x] `feature/html-toolbar` — кнопки `[i]`, `[strong]`, `[code]`, `[a]`. — 1 год.
18. [x] `feature/captcha` — картинка CAPTCHA і обов’язкова відповідь. Додати правило в тести валідації. — 3 год.
19. [x] `feature/comment-image` — JPG, GIF, PNG. Якщо сторона більша за 320×240, зменшити пропорційно. — 3 год.
20. [x] `feature/comment-text-file` (фактична гілка: `feature/comment-text-fil`) — TXT не більший за 100 КБ. — 1 год.
21. [x] `feature/file-lightbox` — перегляд вкладення з візуальним ефектом. — 2 год.
22. [x] `test/xss-and-files` — зайвий HTML відхиляється, великий TXT теж, велика картинка зменшується. — 2 год.
23. [x] `feature/api-health` — `GET /health` для Docker і деплою. — 1 год.
24. [x] `chore/docker-app` — образи API і web з залежностями, один спосіб підняти БД і застосунок. — 3 год.
25. [x] `feature/comment-events` — подія «коментар створено» всередині API. Junior+. — 2 год.
26. [x] `feature/websocket-comments` — інші клієнти отримують новий коментар через WebSocket. — 3 год.
27. [x] `feature/comment-queue` — зменшення картинки і розсилка події йдуть у чергу, не в запит збереження. Junior+. — 3 год.
28. [x] `feature/message-broker` — RabbitMQ або Kafka замість черги в пам’яті процесу. Middle. — 4 год.
29. [x] `feature/comments-graphql` — список, створення і відповіді через GraphQL з тими самими правилами. — 4 год.
30. [x] `feature/graphql-errors` — підключити наявний форматер: код у `extensions.code`, без внутрішніх деталей у production. — 1 год.
31. [x] `feature/comment-cache` — кеш сторінки списку, скидання після нового коментаря. Junior+. — 2 год.
32. [x] `feature/jwt-auth` — JWT як додатковий шар. Junior+. Окремий layout не робити: вхід — блок на тій самій сторінці, у вже наявному `apps/web/src/app/[locale]/layout.tsx`. Токен з’являється двічі: `POST /auth/signin` видає пару cookie (короткий access і довший refresh), `POST /auth/refresh` видає нову пару, коли access протух і axios отримав 401. У `localStorage` нічого не писати. Веб уже викликає refresh через наявний axios (`withCredentials: true`). Публічна форма як і раніше шле ім’я, email і текст без токена. Якщо cookie валідна, до коментаря додатково зберігається `userId`. — 3 год.
33. [x] `feature/comment-search` — пошук тексту в Elasticsearch, або в Redis чи Mongo, якщо пошук лишається простим. Middle. — 4 год.
34. [x] `test/comment-e2e` — браузер: форма, попередній перегляд, таблиця, сортування, сторінки, файл. — 5 год.
35. [x] `chore/ci` — у CI ті самі перевірки, що перед пушем, плюс тести API. — 2 год.
36. [x] `docs/comments-scale` — як читання, запис і файли тримають 1 000 000 повідомлень і 100 000 користувачів за 24 години. Middle+. — 2 год.
37. [x] `feature/comments-write-path` — запис коментаря не блокує видачу списку. Middle+. — 4 год.
38. [x] `test/comments-load` — навантажувальний тест створення і читання сторінок. Middle+. — 4 год.
39. [x] `docs/load-report` — скільки витримали список і запис, і що стало вузьким місцем. Middle+. — 1 год.
40. [x] `docs/db-schema` — файл схеми для MySQL Workbench, звірений з міграціями. — 1 год.
41. [x] `docs/readme-features` — що це за проєкт, які функції є, запуск з нуля лише за README. — 1 год.
42. [x] `chore/cloud-run` — один хмарний провайдер: AWS, GCP, Azure або Yandex Cloud. Middle. — 4 год.
43. [ ] `chore/deploy` — хостинг або VDS і перевірка за чек-листом. — 3 год.
44. [ ] `docs/self-check` — чистий клон, кроки з README, застосунок відкривається. — 1 год.

## Додаткові гілки з репозиторію

Гілки, створені поза початковим списком вище (у хронологічному порядку):

- [x] `feature/networking` (PR #1, #10) — axios-клієнт із auth refresh, підключення GraphQL, спільні env-конфіги, root-params i18n та відновлення production-білду `web`.
- [x] `feature/db-conection` (PR #2, #11) — читання bootstrap-конфігурації API через `ConfigService`, узгодження peer-діапазонів webpack і Apollo Playground.
- [x] `feature/global-error-exeption` (PR #3, #15) — спільні глобальні фільтри винятків API.
- [x] `chore/ignore-local-docs` (PR #4, #12) — додавання локальних PDF та `task.md` до `.gitignore` (наразі `task.md` повернено до відстеження в Git).
- [x] `feature/configure-rabbitmq` (PR #16) — підготовча гілка для конфігурації RabbitMQ та налаштування `.husky/commit-msg`.
- [x] `feature/jwt-token-service` (PR #20) — сервіс `TokenService` на бекенді для підпису та верифікації JWT-токенів.
- [x] `feature/guard` (PR #21) — бекенд `AuthGuard` для захисту HTTP та GraphQL ендпоінтів.
- [x] `feature/home-layout-store` (PR #27) — Zustand store, `commentsService` і базові компоненти коментарів на фронтенді.
- [x] `fix/deployment` (PR #61 + оновлення деплою та безпеки) — PostgreSQL `ILIKE` fallback і substring-пошук в Elasticsearch, лічильник `repliesCount`, адаптивні стилі, cross-site HTTPS cookies (`SameSite=None; Secure; Partitioned`) для Railway, security hardening (`AuthGuard` перевірка підпису й типу JWT, ліміт Multer 5 МБ, приховування внутрішніх помилок у production, HTTP security headers і `sandbox=""` для iframe).
- [x] `feature/likes-dislikes` (PR #62) — лайки та дизлайки коментарів (`comment_votes`, `votes_score`, REST/GraphQL/WS `comment.voted`), SVG CAPTCHA з оновленням, валідація форм авторизації та показ/приховування пароля, синхронізація сортування з URL, дії карток і закладки, Docker/env-фікси, обов’язковий текст коментаря, оновлення кешу/WS після асинхронної обробки зображень, актуальна схема БД і Postman-колекція.
