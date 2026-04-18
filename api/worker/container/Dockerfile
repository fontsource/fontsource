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

# Bun's compiled binary leaves @glypht/core worker-script and WASM URLs pointed
# at the build-time node_modules path. Preserve that dist tree verbatim so the
# runtime worker threads can resolve their sibling assets.
RUN mkdir -p /runtime-assets && \
    find /app/node_modules/.bun -path '*/node_modules/@glypht/core/dist' -type d | while read d; do \
      mkdir -p "/runtime-assets$d" && \
      cp -R "$d/." "/runtime-assets$d/"; \
    done

FROM gcr.io/distroless/cc-debian13:nonroot AS runtime

WORKDIR /app

COPY --from=build /app/api/worker/bin/artifact-builder /app/artifact-builder
COPY --from=build /runtime-assets/app/ /app/

EXPOSE 3000

CMD ["/app/artifact-builder"]
