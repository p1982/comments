# syntax=docker/dockerfile:1

FROM node:22.22.1-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY tools/apollo-playground-plugin tools/apollo-playground-plugin

RUN npm ci

FROM deps AS builder
WORKDIR /app

ARG API_BASE_URL=http://localhost:3001
ARG API_VERSION=1

ENV API_BASE_URL=$API_BASE_URL
ENV API_VERSION=$API_VERSION
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

COPY . .
RUN npx nx build @comments/web

FROM node:22.22.1-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
