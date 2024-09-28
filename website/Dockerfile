# base node image
FROM oven/bun:1 AS base

ENV PORT="8080"
ENV NODE_ENV=production

RUN mkdir /website
WORKDIR /website

COPY . .
RUN bun install
RUN bun run build

USER bun
EXPOSE 8080
CMD ["bun", "run", "start"]
