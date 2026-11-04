# Git conventions

## Branch names

Protected / long-lived:

- `main` | `master` | `develop`

Feature branches:

```text
<type>/<description>
<type>/<ticket>-<description>
```

**Types:** `feature` | `fix` | `hotfix` | `release` | `chore` | `docs` | `refactor` | `test` | `ci` | `perf`

**Rules:** lowercase, kebab-case segments, `/` only after type.

Examples:

```text
feature/add-comments-api
fix/COM-12-cors-origin
chore/update-eslint
docs/git-conventions
```

Invalid: `Feature/Foo`, `my-branch`, `feature_add_api`

## Commit messages (Conventional Commits)

```text
<type>(optional-scope): <subject>

[optional body]

[optional footer]
```

**Types:** `feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `build` | `ci` | `chore` | `revert`

Examples:

```text
feat(api): add health endpoint versioning
fix(web): correct locale switcher links
chore: configure husky and commitlint
docs: describe git branch rules
```

Subject: imperative mood, no period at the end, max 100 chars.

## Hooks (Husky)

| Hook         | Checks                                         |
| ------------ | ---------------------------------------------- |
| `pre-commit` | branch name, lint-staged (ESLint + Prettier)   |
| `commit-msg` | Conventional Commits via commitlint            |
| `pre-push`   | branch name + format + lint + typecheck + test |

Manual checks:

```bash
npm run check:branch
npm run check
```

After `npm install`, Husky hooks are installed via the `prepare` script.
