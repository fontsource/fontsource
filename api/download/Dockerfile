FROM oven/bun:1 as deploy

ENV PORT=8080

RUN mkdir /app
WORKDIR /app

COPY . .

RUN bun install
RUN bun run build

USER bun
EXPOSE 8080/tcp
CMD ["bun", "run", "dist/server.js"]

