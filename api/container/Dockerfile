FROM node:24.18.0-bookworm-slim AS workspace

WORKDIR /app

RUN npm install --global pnpm@11.14.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/package.json
COPY packages/cli/package.json ./packages/cli/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/generate/package.json ./packages/generate/package.json
COPY packages/publish/package.json ./packages/publish/package.json
COPY packages/scss/package.json ./packages/scss/package.json
COPY website/package.json ./website/package.json

FROM workspace AS build

RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY api ./api
COPY packages/core ./packages/core

RUN pnpm --filter '@fontsource-utils/core' build
RUN pnpm --filter 'api' container:build
RUN pnpm --filter 'api' --prod deploy /app/deploy

FROM node:24.18.0-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/deploy/node_modules ./node_modules
COPY --from=build /app/api/container/dist ./container/dist

EXPOSE 3000

CMD ["node", "./container/dist/server.mjs"]
