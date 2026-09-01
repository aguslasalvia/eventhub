# Build context must be the repo root (bun workspaces need packages/shared),
# e.g.: docker build -f packages/client/Dockerfile .
# This is handled automatically by the root docker-compose.yml.

FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/client/package.json packages/client/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/server/package.json packages/server/package.json
RUN bun install --frozen-lockfile

FROM deps AS runner
COPY packages/shared packages/shared
COPY packages/client packages/client
WORKDIR /app/packages/client
RUN bun run build

ENV NODE_ENV=production
EXPOSE 80
CMD ["bun", "run", "preview"]
