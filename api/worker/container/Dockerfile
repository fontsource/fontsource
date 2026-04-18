FROM oven/bun:latest AS build

WORKDIR /app

COPY package.json bun.lock ./

# Temporary to satisfy bun workspaces.
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

RUN bun install

COPY tsconfig.json ./
COPY api/worker ./api/worker
COPY packages/core ./packages/core

RUN bun --filter '@fontsource-utils/core' build
RUN bun run ./api/worker/container/build.ts

FROM gcr.io/distroless/cc-debian13:nonroot AS runtime

WORKDIR /app

COPY --from=build /app/api/worker/bin/artifact-builder /app/artifact-builder

EXPOSE 3000

CMD ["/app/artifact-builder"]
