# Install and build the app
FROM oven/bun:alpine as deps

RUN mkdir /app
WORKDIR /app

COPY package.json ./
RUN bun install

FROM oven/bun:alpine as deploy

ENV PORT=8080

RUN mkdir /app
WORKDIR /app

COPY package.json ./
COPY ./src ./src
COPY --from=deps /app/bun.lockb ./

RUN bun install --production
RUN bun run build
CMD bun run dist/server.js
