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

COPY . .
RUN npx nx build @comments/api
RUN npx nx prune @comments/api

WORKDIR /app/apps/api/dist
RUN npm install --omit=dev

FROM node:22.22.1-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NX_READY_SIGNAL_SOCKET=false

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nestjs

COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/assets ./apps/api/assets

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/v'+(process.env.API_VERSION||1)+'/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/main.js"]
