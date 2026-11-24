# Comments scale plan

How this stack is meant to hold **1 000 000 comments** and **~100 000 active users / 24 hours**, for **read**, **write**, and **files**. Numbers below are capacity targets for design — measured results belong in `docs/load-report` after `test/comments-load`.

## Target load (order of magnitude)

| Signal                         | Target                  | Rough average                     |
| ------------------------------ | ----------------------- | --------------------------------- |
| Stored comments                | 1 000 000 rows          | —                                 |
| Active users / day             | 100 000                 | —                                 |
| New comments / day (assume 1×) | up to ~100 000 writes   | ~1.2 writes/s average             |
| Peak write (×10 vs average)    | short bursts            | ~10–20 writes/s                   |
| List reads                     | much higher than writes | tens–hundreds of reads/s peak     |
| Attachments                    | subset of creates       | local volume → object store later |

Peaks matter more than averages: the write path must not stall the list under concurrent create + paginated read.

## What we already have

| Piece                 | Role today                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| PostgreSQL 16         | Source of truth (`users`, `comments` + `votes_score`, `comment_votes`, `attachments`, `outbox_events`) |
| Partial root indexes  | Fast root list by `created_at` / `user_id` when `parent_id IS NULL`                                    |
| Transactional outbox  | `outbox_events` inserted in the create TX; `OutboxPublisherService` publishes async (1s)               |
| In-process list cache | 30s TTL, max 100 keys, version bump on create, vote, and async image completion                        |
| RabbitMQ              | Durable job queue (`COMMENT_QUEUE_MODE=rabbit`) for async image fit + cache/WS update                  |
| Elasticsearch 8       | Full-text + substring search (`ngram` + `wildcard`) with automatic PostgreSQL `ILIKE` fallback         |
| Socket.IO             | Live `comment.created` and `comment.voted` broadcasts                                                  |
| Local `/assets`       | Attachment files on disk (Docker volume)                                                               |

Redis is **not** in compose yet. List cache is process-local Nest `cache-manager`.

---

## 1. Read path — how 1M comments stay pageable

### Current behaviour

- REST `GET /api/v1/comments` and GraphQL `comments`: roots only (`parent_id IS NULL`), **page size 1–25** (default 25), sort `createdAt` | `fullName` | `email`.
- Implementation: TypeORM `skip` / `take` (**OFFSET/LIMIT**) + `findAndCount`.
- Cache key: `comments:list:v{version}:{page}:{limit}:{sort}:{order}`; invalidate by bumping `comments:list:version` on create.
- Thread children: `GET /api/v1/comments/:rootId` loads the full child set for one root (no pagination).
- Search goes to Elasticsearch, then hydrates rows from Postgres by id (order preserved).

### Why this can work at 1M

- Clients never pull the whole table: max **25 roots / request**.
- Partial indexes on roots (`created_at DESC, id DESC` and `user_id, created_at DESC, id DESC`) keep the common “latest roots” query index-friendly.
- Hot first pages hit the 30s cache and avoid repeated COUNT + OFFSET for the same key.
- Search stays off the transactional hot path (ES index + hydrate by primary key).

### Limits to fix before claiming the target

| Risk                         | Why it hurts at 1M                                 | Direction                                              |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| Deep OFFSET + COUNT          | Cost grows with page number and table size         | Keyset / cursor pagination; avoid COUNT where possible |
| Sort by `fullName` / `email` | Join to `users` + ORDER BY                         | Covering indexes or denormalized sort fields           |
| In-process cache             | Multi-instance → stale or cold cache; max 100 keys | Shared cache (Redis) + higher capacity                 |
| Full children dump           | Large threads → big payloads                       | Paginate replies                                       |
| ES `refresh: true` on index  | Write amplification on every create                | Async refresh / bulk indexer (ties to write path)      |

Read SLA target for later load tests: p95 list page **&lt; 200 ms** on warm cache, **&lt; 500 ms** on cold cache at ~1M roots (exact bars in `docs/load-report`).

---

## 2. Write path — how 100k users/day do not block the list

### Current behaviour

Create (REST + GraphQL) executes a **short synchronous DB transaction**: captcha check → resolve/create user → insert comment → optional `.txt` attachment (or inline image fit in `sync` mode) → insert `comment.created` row into `outbox_events`. After commit, the API bumps the list-cache version and returns HTTP `201`:

| `COMMENT_QUEUE_MODE` | Image handling & side effects                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| `sync` (default)     | Image fit inline in request TX; WS + ES run asynchronously via `OutboxPublisherService`               |
| `memory`             | In-process FIFO processes `process-image`, bumps list cache, and broadcasts updated comment over WS   |
| `rabbit`             | Durable RabbitMQ queue `comments.jobs` processes `process-image`, bumps list cache, and broadcasts WS |

Listener on `comment.created` (triggered by `OutboxPublisherService` polling `outbox_events` every 1s): Socket.IO broadcast + Elasticsearch index (`refresh: false`). Votes (`POST /comments/:id/vote` and GraphQL `voteComment`) run a short atomic transaction on `comment_votes` + `comments.votes_score`, bump list cache, and broadcast `comment.voted`.

### Capacity sketch (100k writes / 24h)

- Average ~**1.2 writes/s**; peak planning ~**10–20 writes/s**.
- Postgres can absorb that insert rate because the HTTP request performs only a short transaction and returns before ES/WS/image-resize side effects finish.

### How write stays safe for the list

1. **Short TX + Transactional Outbox** — comment, optional `.txt`, and `outbox_events` commit atomically; HTTP returns immediately without waiting on ES or WS.
2. **Async image pipeline** — in `memory` / `rabbit` modes, `sharp` resizing runs off the HTTP path, then invalidates the list cache and pushes the hydrated comment over Socket.IO.
3. **List cache invalidation** — version bump on create, vote, and async image completion keeps paginated reads fresh while absorbing read bursts.
4. **One writer pool, many readers** — same Postgres today; if list p95 climbs under write load, add a read replica or split connection pools before sharding.

### Gaps

| Gap                         | Impact                                                | Follow-up                     |
| --------------------------- | ----------------------------------------------------- | ----------------------------- |
| Consumer colocated with API | Scale-out couples HTTP, outbox poller, and RMQ worker | Separate worker process later |
| Single-node cache & WS      | Multi-instance needs shared cache and WS fan-out      | Redis + Socket.IO adapter     |
| `sync` mode in prod risk    | Create latency includes inline image fit              | Use `rabbit` in deploy        |
| No DLQ / retry policy       | Poison image jobs can stall silently                  | Queue ops / DLQ policy        |

Write SLA target for load tests: create p95 **&lt; 300 ms** (without counting client upload time) at peak, while list p95 stays within the read bars above.

---

## 3. Files — attachments under the same traffic

### Current behaviour

- Files land on **local disk** under `apps/api/assets/` (served as `/assets/…`, Docker volume `api_assets`).
- Images: JPG/PNG/GIF; **fit inside 320×240** (sharp, no enlarge).
- Text: `.txt`, max **100 KiB**, no null bytes; written in the create transaction.
- GraphQL upload: **5 MiB**, max **2** files per request.

### How this holds 100k users / day

- Most comments are text-only; attachments are a fraction of writes.
- Shrinking images to 320×240 caps storage and CPU vs raw phone photos.
- Moving fit to Rabbit keeps HTTP from blocking on sharp during peaks.
- Metadata in `attachments` stays queryable without scanning the filesystem.

### What must change before real multi-node deploy

| Topic         | Today                       | Needed at scale                                     |
| ------------- | --------------------------- | --------------------------------------------------- |
| Blob storage  | Single node disk + volume   | Object storage (S3/GCS/…) + CDN URLs                |
| Upload size   | App limits only             | Edge/CDN limits + virus/type checks                 |
| Backups       | Volume-dependent            | Bucket lifecycle + DB backup of `attachments` rows  |
| Queue payload | Image buffers may ride jobs | Store object key in job; worker downloads/processes |

Files do not need a separate 1M-object story if object storage + async fit are in place; DB still stores only metadata per comment.

---

## 4. End-to-end picture

```text
Client
  │  GET list (≤25)     POST create / vote (+ optional file)
  ▼                     ▼
API ──► list cache ──► Postgres (roots indexes + comment_votes)
  │                     │
  │                     ├─ TX: user + comment + txt + outbox_events
  │                     ├─ OutboxPublisherService (1s) ──► WS comment.created + ES index
  │                     └─ RabbitMQ / memory queue (process-image)
  │                              └─ sharp fit → assets → cache bump + WS update
  ▼
Elasticsearch (with Postgres ILIKE fallback) ◄── hydrate by id ──► Postgres
```

---

## 5. Checklist vs the target

| Requirement                  | Status  | Notes                                                           |
| ---------------------------- | ------- | --------------------------------------------------------------- |
| Paginated root list          | Done    | Cap 25; keyset pagination recommended for deep pages at 1M      |
| Indexes for latest roots     | Done    | Partial indexes on roots + unique index on `comment_votes`      |
| List cache                   | Partial | Works single-node; Redis needed for multi-instance              |
| Async image / events         | Done    | RabbitMQ/memory `process-image` + cache invalidation + WS       |
| Search off primary list path | Done    | ES ngram/wildcard + hydrate + automatic Postgres ILIKE fallback |
| Durable side-effect delivery | Done    | Transactional `outbox_events` + `OutboxPublisherService`        |
| Shared cache / WS scale-out  | Todo    | Redis (+ Socket.IO adapter)                                     |
| Object storage for files     | Todo    | Before multi-node / cloud-run                                   |
| Measured proof               | Done    | `test/comments-load` → `docs/load-report`                       |

---

## 6. Related tasks

| Branch / task                 | Role                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `feature/comments-write-path` | Create does not block list; wire outbox + async side FX     |
| `test/comments-load`          | Load scripts for create + list pages                        |
| `docs/load-report`            | What we sustained and where it bottlenecked                 |
| `chore/cloud-run` / deploy    | Multi-instance, object storage, `COMMENT_QUEUE_MODE=rabbit` |

This document is the design contract for those follow-ups — not a substitute for load numbers.
