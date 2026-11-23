import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.1.0/index.js';
import crypto from 'k6/crypto';

const BASE = __ENV.API_BASE_URL || 'http://localhost:3001';
const PREFIX = `${BASE}/api/v1`;
const GRAPHQL = `${BASE}/graphql`;
const CAPTCHA = 'AB12C';
const CAPTCHA_SECRET = __ENV.CAPTCHA_SECRET || 'secret';
// smoke = gentlest (default); local = light; peak = scale-doc rates
const PROFILE = __ENV.LOAD_PROFILE || 'smoke';
// rest (default) | graphql | both
const TRANSPORT = (__ENV.LOAD_TRANSPORT || 'rest').toLowerCase();

const createTrend = new Trend('comments_create_ms');
const listTrend = new Trend('comments_list_ms');
const errorRate = new Rate('errors');
const listCount = new Counter('comments_list_count');
const createCount = new Counter('comments_create_count');
const listOkRate = new Rate('comments_list_ok');
const createOkRate = new Rate('comments_create_ok');

const profiles = {
  smoke: {
    listRate: 2,
    writeRate: 1,
    duration: '30s',
    listVUs: [2, 5],
    writeVUs: [1, 3],
  },
  local: {
    listRate: 5,
    writeRate: 2,
    duration: '1m',
    listVUs: [5, 15],
    writeVUs: [2, 8],
  },
  peak: {
    listRate: 20,
    writeRate: 10,
    duration: '2m',
    listVUs: [20, 50],
    writeVUs: [10, 30],
  },
};

const cfg = profiles[PROFILE] || profiles.smoke;
const useRest = TRANSPORT === 'rest' || TRANSPORT === 'both';
const useGraphql = TRANSPORT === 'graphql' || TRANSPORT === 'both';
// both: split target rate so total ≈ profile; single transport gets full rate
const transportCount = (useRest ? 1 : 0) + (useGraphql ? 1 : 0) || 1;
const listRate = Math.max(1, Math.ceil(cfg.listRate / transportCount));
const writeRate = Math.max(1, Math.ceil(cfg.writeRate / transportCount));

const scenarios = {};
if (useRest) {
  scenarios.list_readers_rest = {
    executor: 'constant-arrival-rate',
    rate: listRate,
    timeUnit: '1s',
    duration: cfg.duration,
    preAllocatedVUs: cfg.listVUs[0],
    maxVUs: cfg.listVUs[1],
    exec: 'listPageRest',
  };
  scenarios.writers_rest = {
    executor: 'constant-arrival-rate',
    rate: writeRate,
    timeUnit: '1s',
    duration: cfg.duration,
    preAllocatedVUs: cfg.writeVUs[0],
    maxVUs: cfg.writeVUs[1],
    exec: 'createCommentRest',
    startTime: '5s',
  };
}
if (useGraphql) {
  scenarios.list_readers_graphql = {
    executor: 'constant-arrival-rate',
    rate: listRate,
    timeUnit: '1s',
    duration: cfg.duration,
    preAllocatedVUs: cfg.listVUs[0],
    maxVUs: cfg.listVUs[1],
    exec: 'listPageGraphql',
  };
  scenarios.writers_graphql = {
    executor: 'constant-arrival-rate',
    rate: writeRate,
    timeUnit: '1s',
    duration: cfg.duration,
    preAllocatedVUs: cfg.writeVUs[0],
    maxVUs: cfg.writeVUs[1],
    exec: 'createCommentGraphql',
    startTime: '5s',
  };
}

export const options = {
  scenarios,
  // Short smoke runs have few samples; one cold-start create (~1–3s) can
  // push p95 over a tight 300ms bar even when med is ~15ms and errors=0.
  thresholds: {
    comments_list_ms: ['p(95)<1000'],
    comments_create_ms: ['p(95)<1500'],
    errors: ['rate<0.05'],
    comments_list_ok: ['rate>0.95'],
    comments_create_ok: ['rate>0.95'],
  },
};

const COMMENTS_QUERY = `query Comments($input: CommentsListInput) {
  comments(input: $input) {
    data { id text fullName email createdAt parentId }
    total totalPages
  }
}`;

const CREATE_MUTATION = `mutation CreateComment($input: CreateCommentInput!) {
  createComment(input: $input) {
    id text fullName email parentId
  }
}`;

function metricCount(data, name) {
  return data.metrics[name]?.values?.count ?? 0;
}

function metricRate(data, name) {
  const v = data.metrics[name]?.values?.rate;
  return typeof v === 'number' ? v : null;
}

function metricPerSec(data, name) {
  const v = data.metrics[name]?.values?.rate;
  return typeof v === 'number' ? v : 0;
}

function pct(rate) {
  if (rate == null) return 'n/a';
  return `${(rate * 100).toFixed(1)}%`;
}

/** Compact board: count, speed (req/s), success % — plus default k6 summary. */
export function handleSummary(data) {
  const listN = metricCount(data, 'comments_list_count');
  const createN = metricCount(data, 'comments_create_count');
  const listRps = metricPerSec(data, 'comments_list_count');
  const createRps = metricPerSec(data, 'comments_create_count');
  const listOk = metricRate(data, 'comments_list_ok');
  const createOk = metricRate(data, 'comments_create_ok');
  const err = metricRate(data, 'errors');

  const board = [
    '',
    `LOAD BOARD  profile=${PROFILE}  transport=${TRANSPORT}`,
    '─────────────────────────────────────────',
    `  list    count=${listN}   speed=${listRps.toFixed(2)}/s   ok=${pct(listOk)}`,
    `  create  count=${createN}   speed=${createRps.toFixed(2)}/s   ok=${pct(createOk)}`,
    `  errors  ${pct(err)}`,
    '─────────────────────────────────────────',
    '',
  ].join('\n');

  return {
    stdout: board + textSummary(data, { indent: ' ', enableColors: true }),
    'apps/load/results.json': JSON.stringify(
      {
        profile: PROFILE,
        transport: TRANSPORT,
        list: { count: listN, speed_per_s: listRps, ok_pct: listOk == null ? null : listOk * 100 },
        create: {
          count: createN,
          speed_per_s: createRps,
          ok_pct: createOk == null ? null : createOk * 100,
        },
        errors_pct: err == null ? null : err * 100,
      },
      null,
      2,
    ),
  };
}

function captchaToken() {
  return crypto.hmac('sha256', CAPTCHA_SECRET, CAPTCHA.toLowerCase(), 'hex');
}

function captchaCookieHeader() {
  return { Cookie: `captcha=${captchaToken()}` };
}

function graphql(query, variables) {
  return http.post(GRAPHQL, JSON.stringify({ query, variables }), {
    headers: {
      'Content-Type': 'application/json',
      ...captchaCookieHeader(),
    },
    timeout: '5s',
  });
}

function recordList(res, ok) {
  listTrend.add(res.timings.duration);
  listCount.add(1);
  listOkRate.add(ok);
  errorRate.add(!ok);
  sleep(0.1);
}

function recordCreate(res, ok) {
  createTrend.add(res.timings.duration);
  createCount.add(1);
  createOkRate.add(ok);
  errorRate.add(!ok);
  sleep(0.1);
}

export function listPageRest() {
  const page = (__ITER % 5) + 1;
  const res = http.get(`${PREFIX}/comments?page=${page}&limit=25&sort=createdAt&order=desc`, {
    timeout: '5s',
  });
  const ok = check(res, {
    'rest list 200': (r) => r.status === 200,
    'rest list has data': (r) => {
      try {
        return Array.isArray(r.json('data'));
      } catch (_err) {
        return false;
      }
    },
  });
  recordList(res, ok);
}

export function createCommentRest() {
  const i = __VU * 1000000 + __ITER;
  const payload = JSON.stringify({
    fullName: `LoadUser${i}`,
    email: `load${i}@test.example`,
    text: `load comment ${i}`,
    captcha: CAPTCHA,
  });
  const res = http.post(`${PREFIX}/comments`, payload, {
    headers: {
      'Content-Type': 'application/json',
      ...captchaCookieHeader(),
    },
    timeout: '5s',
  });
  const ok = check(res, { 'rest create 201': (r) => r.status === 201 });
  recordCreate(res, ok);
}

export function listPageGraphql() {
  const page = (__ITER % 5) + 1;
  const res = graphql(COMMENTS_QUERY, {
    input: { page, limit: 25, sort: 'createdAt', order: 'desc' },
  });
  const ok = check(res, {
    'gql list 200': (r) => r.status === 200,
    'gql list no errors': (r) => {
      try {
        return !r.json('errors');
      } catch (_err) {
        return false;
      }
    },
    'gql list has data': (r) => {
      try {
        return Array.isArray(r.json('data.comments.data'));
      } catch (_err) {
        return false;
      }
    },
  });
  recordList(res, ok);
}

export function createCommentGraphql() {
  const i = __VU * 2000000 + __ITER;
  const res = graphql(CREATE_MUTATION, {
    input: {
      fullName: `LoadGqlUser${i}`,
      email: `loadgql${i}@test.example`,
      text: `load gql comment ${i}`,
      captcha: CAPTCHA,
    },
  });
  const ok = check(res, {
    'gql create 200': (r) => r.status === 200,
    'gql create no errors': (r) => {
      try {
        return !r.json('errors');
      } catch (_err) {
        return false;
      }
    },
    'gql create has id': (r) => {
      try {
        return Boolean(r.json('data.createComment.id'));
      } catch (_err) {
        return false;
      }
    },
  });
  recordCreate(res, ok);
}
