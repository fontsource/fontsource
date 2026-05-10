FROM oven/bun:1.3.13 AS workspace

WORKDIR /app

COPY package.json bun.lock ./
COPY api/cdn/package.json ./api/cdn/package.json
COPY api/common/package.json ./api/common/package.json
COPY api/download/package.json ./api/download/package.json
COPY api/metadata/package.json ./api/metadata/package.json
COPY api/upload/package.json ./api/upload/package.json
COPY api/worker/package.json ./api/worker/package.json
COPY packages/cli/package.json ./packages/cli/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/generate/package.json ./packages/generate/package.json
COPY packages/publish/package.json ./packages/publish/package.json
COPY packages/scss/package.json ./packages/scss/package.json
COPY website/package.json ./website/package.json

FROM workspace AS build

RUN bun install --frozen-lockfile

COPY tsconfig.json ./
COPY packages/core ./packages/core

RUN bun --filter '@fontsource-utils/core' build

FROM workspace AS runtime

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/api/worker/node_modules ./api/worker/node_modules
COPY --from=build /app/packages/core/node_modules ./packages/core/node_modules
COPY api/worker/container ./api/worker/container
COPY api/worker/shared ./api/worker/shared
COPY packages/core/package.json ./packages/core/package.json
COPY --from=build /app/packages/core/dist ./packages/core/dist

EXPOSE 3000

CMD ["bun", "./api/worker/container/server.ts"]
