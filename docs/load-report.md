# Load report — comments create + list

Measured with k6 (`apps/load/comments-load.js`) against a single Nest API process on a laptop (`npm run dev:api`), Postgres up, Elasticsearch optional. Captcha HMAC matches API `CAPTCHA_SECRET`.

Script: `npm run test:load` · profiles: `smoke` (default), `local`, `peak`.

## What we sustained

### Smoke — pass (warm API)

| Signal                  | Rate             | Duration | Result     |
| ----------------------- | ---------------- | -------- | ---------- |
| List `GET /comments`    | 2/s              | 30s      | 100% `200` |
| Create `POST /comments` | 1/s (starts +5s) | 30s      | 100% `201` |
| Errors                  | —                | —        | **0%**     |

| Metric               | med    | p95        | max    | Threshold       |
| -------------------- | ------ | ---------- | ------ | --------------- |
| `comments_create_ms` | ~17 ms | **~56 ms** | ~85 ms | p(95)&lt;1500 ✓ |
| `comments_list_ms`   | ~9 ms  | **~23 ms** | ~90 ms | p(95)&lt;1000 ✓ |

Checks: 151/151. HTTP failed: 0%. ~91 iterations in ~35s.

**Verdict:** at ~2 list/s + 1 create/s the write path (TX + outbox enqueue + sync list-cache bump) and list path stay well under a second. Create does not block list at this rate.

### Earlier cold smoke (same profile)

Same rates, but after a heavy/peak attempt the API was still recovering:

- checks still 100%, errors 0%
- create **med ~15 ms**, create **p95 ~413 ms**, **max ~2.5 s**
- one cold/slow create pulled p95 above a tight 300 ms bar; thresholds were widened for laptop smoke

### Local — partial / timeouts (prior runs)

`LOAD_PROFILE=local` (~5 list/s + 2 create/s, 1m) on the same single process often showed request timeouts once the event loop or DB backlog grew, especially with ES indexing noise. Not a clean SLA pass on this machine.

### Peak — fail (scale-doc rates)

`LOAD_PROFILE=peak` (~20 list/s + 10 create/s, 2m):

- many `request timeout` (5s client timeout)
- create success rate collapses; list degrades after saturation
- useful as a ceiling, not as a laptop SLA target

**Rough ceiling on this setup:** comfortable around **smoke** rates; **peak** (20/10) saturates one Nest worker.

## Bottlenecks (observed)

1. **Single-process Nest** — create, list, outbox publisher, Socket.IO, and ES client share one event loop. Under peak, backlog shows up as HTTP timeouts, not only slow p95.
2. **Write side effects** — after HTTP 201, outbox → `comment.created` → ES `index` + WS. ES client/server mismatch (client v9 vs ES 8) produced `media_type_header_exception` spam; indexing is now warn-and-skip + `refresh: false` so create latency is not blocked on ES, but failed/slow ES work still costs CPU under load.
3. **List cache** — warm pages are fast (single-digit–tens ms). Cache bump on every create forces cold fills; under write bursts more list traffic hits Postgres `OFFSET/LIMIT`.
4. **Postgres + outbox poll** — publisher interval ~1s is fine at 1 create/s; at 10 create/s the combination of TX inserts + poll + listeners competes with list queries on one node.

## Not the bottleneck (at smoke)

- Root list query shape with cache hit
- Captcha HMAC cookie path
- HTTP returning before ES/WS complete (outbox design holds: create stays ~10–50 ms when warm)

## Relation to scale plan

| Scale doc target                           | This report                                              |
| ------------------------------------------ | -------------------------------------------------------- |
| Peak write ~10–20/s                        | Not sustained on one laptop Nest process                 |
| List tens–hundreds/s                       | Not measured at that scale here                          |
| p95 list &lt;200 ms warm / &lt;500 ms cold | Smoke warm list p95 ~23 ms ✓ (tiny dataset, not 1M rows) |

Next steps when scaling: more API replicas, shared Redis list cache, ES client aligned to server major version, and re-run `peak` against that stack — then update this file.

## How to reproduce

```bash
curl -m 3 http://localhost:3001/api/v1/health
npm run test:load                          # smoke
LOAD_PROFILE=local npm run test:load
LOAD_PROFILE=peak npm run test:load
k6 run --summary-export=apps/load/results.json apps/load/comments-load.js
```

See `apps/load/README.md` for profiles and how to read failures.
