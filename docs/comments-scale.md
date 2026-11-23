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

| Piece                 | Role today                                                            |
| --------------------- | --------------------------------------------------------------------- |
| PostgreSQL 16         | Source of truth (`users`, `comments`, `attachments`, `outbox_events`) |
| Partial root indexes  | Fast root list by `created_at` / `user_id` when `parent_id IS NULL`   |
| In-process list cache | 30s TTL, max 100 keys, version bump on `comment.created`              |
| RabbitMQ              | Optional job queue (`COMMENT_QUEUE_MODE=rabbit`) for image fit + emit |
| Elasticsearch 8       | Full-text search (`comments_v2`, `plainText`)                         |
| Socket.IO             | Live `comment.created` broadcast                                      |
| Local `/assets`       | Attachment files on disk (Docker volume)                              |

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

Create (REST + GraphQL) still does a **synchronous DB transaction**: captcha → resolve/create user → insert comment → optional `.txt` attachment. Then:

| `COMMENT_QUEUE_MODE` | After commit                                             |
| -------------------- | -------------------------------------------------------- |
| `sync` (default)     | Image fit + `comment.created` emit **inline** in request |
| `memory`             | In-process FIFO for fit + emit                           |
| `rabbit`             | Durable queue `comments.jobs` (producer+consumer in API) |

Listener on `comment.created`: Socket.IO broadcast, list-cache version bump, Elasticsearch index.

Table `outbox_events` exists in schema/migrations but is **not wired** into create.

### Capacity sketch (100k writes / 24h)

- Average ~**1.2 writes/s**; peak planning ~**10–20 writes/s**.
- Postgres can absorb that insert rate if the request only does a short TX and returns.
- Heavy work (image resize, ES index, fan-out) must leave the HTTP critical path — partially done via Rabbit for fit/emit, still incomplete for durable async delivery.

### How write stays safe for the list

1. **Short TX** — only durable comment (+ text file meta/bytes) in the request transaction.
2. **Async side effects** — image fit, search index, websocket, cache invalidation via queue/outbox so list queries are not waiting on sharp/ES.
3. **Outbox (next)** — write `outbox_events` in the same TX as the comment; a worker publishes to Rabbit / emits events with retries (`feature/comments-write-path`).
4. **One writer pool, many readers** — same Postgres today; if list p95 climbs under write load, add read replica or split connection pools before sharding.

### Gaps

| Gap                         | Impact                                          | Follow-up                         |
| --------------------------- | ----------------------------------------------- | --------------------------------- |
| Outbox not used             | Crash after commit can drop ES/WS/cache updates | `feature/comments-write-path`     |
| Consumer colocated with API | Scale-out couples HTTP and workers              | Separate worker process later     |
| `sync` mode in prod risk    | Create latency includes fit + emit              | Prefer `rabbit` in deploy         |
| No DLQ / retry policy       | Poison image jobs can stall silently            | Queue ops in write-path / ops doc |

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
  │  GET list (≤25)     POST create (+ optional file)
  ▼                     ▼
API ──► list cache ──► Postgres (roots indexes)
  │                     │
  │                     ├─ TX: user + comment + txt
  │                     └─ outbox (planned) / queue job
  │                              │
  │                              ▼
  │                         RabbitMQ worker
  │                              ├─ sharp fit → assets / object store
  │                              ├─ ES index (comments_v2)
  │                              ├─ cache version bump
  │                              └─ Socket.IO broadcast
  ▼
Elasticsearch ◄── search hydrate by id ──► Postgres
```

---

## 5. Checklist vs the target

| Requirement                  | Status  | Notes                                       |
| ---------------------------- | ------- | ------------------------------------------- |
| Paginated root list          | Done    | Cap 25; needs keyset under deep pages       |
| Indexes for latest roots     | Done    | Partial indexes on roots                    |
| List cache                   | Partial | Works single-node; Redis for multi-instance |
| Async image / events         | Partial | Rabbit modes exist; outbox not wired        |
| Search off primary list path | Done    | ES + hydrate                                |
| Durable side-effect delivery | Todo    | `feature/comments-write-path`               |
| Shared cache / WS scale-out  | Todo    | Redis (+ Socket.IO adapter)                 |
| Object storage for files     | Todo    | Before multi-node / cloud-run               |
| Measured proof               | Done    | `test/comments-load` → `docs/load-report`   |

---

## 6. Related tasks

| Branch / task                 | Role                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `feature/comments-write-path` | Create does not block list; wire outbox + async side FX     |
| `test/comments-load`          | Load scripts for create + list pages                        |
| `docs/load-report`            | What we sustained and where it bottlenecked                 |
| `chore/cloud-run` / deploy    | Multi-instance, object storage, `COMMENT_QUEUE_MODE=rabbit` |

This document is the design contract for those follow-ups — not a substitute for load numbers.
