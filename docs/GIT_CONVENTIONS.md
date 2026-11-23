# Git-конвенції

## Імена гілок

Довгоживучі / захищені:

- `main` | `master` | `develop`

Feature-гілки:

```text
<type>/<description>
<type>/<ticket>-<description>
```

**Типи:** `feature` | `fix` | `hotfix` | `release` | `chore` | `docs` | `refactor` | `test` | `ci` | `perf`

**Правила:** lowercase, kebab-case сегменти, `/` лише після типу.

Приклади:

```text
feature/add-comments-api
fix/COM-12-cors-origin
chore/update-eslint
docs/git-conventions
test/comments-load
```

Невірно: `Feature/Foo`, `my-branch`, `feature_add_api`

## Повідомлення комітів (Conventional Commits)

```text
<type>(optional-scope): <subject>

[optional body]

[optional footer]
```

**Типи:** `feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `build` | `ci` | `chore` | `revert`

Приклади:

```text
feat(api): add health endpoint versioning
fix(web): correct locale switcher links
chore: configure husky and commitlint
docs: describe git branch rules
```

Subject: наказовий спосіб, без крапки в кінці, максимум 100 символів.

## Hooks (Husky)

| Hook         | Перевірки                                   |
| ------------ | ------------------------------------------- |
| `pre-commit` | ім’я гілки, lint-staged (ESLint + Prettier) |
| `commit-msg` | Conventional Commits через commitlint       |
| `pre-push`   | гілка + format + lint + typecheck + test    |

CI (`.github/workflows/ci.yml`) повторює ті самі перевірки, що `pre-push`, плюс `npm run test:api` (сервіс Postgres) і `npm run build`.

Вручну:

```bash
npm run check:branch
npm run check
npm run test:api
```

Після `npm install` Husky ставиться скриптом `prepare`.
