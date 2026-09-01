# Build context must be the repo root (bun workspaces need packages/shared),
# e.g.: docker build -f packages/server/Dockerfile .
# This is handled automatically by the root docker-compose.yml.

FROM oven/bun:1
WORKDIR /app

# Manifests first (cached layer) so `bun install` only reruns when a
# package.json or the lockfile actually changes.
COPY package.json bun.lock ./
COPY packages/server/package.json packages/server/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/client/package.json packages/client/package.json
RUN bun install --frozen-lockfile

COPY packages/shared packages/shared
COPY packages/server packages/server

ENV NODE_ENV=production
WORKDIR /app/packages/server
EXPOSE 3000
CMD ["bun", "run", "server.ts"]
