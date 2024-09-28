# base node image
FROM oven/bun:1 AS base

# Install all node_modules, including dev dependencies
FROM base AS deps

RUN mkdir -p /temp/dev
COPY package.json /temp/dev/
RUN cd /temp/dev && bun install

# Install all node_modules, excluding dev dependencies
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --production

# Build the app
FROM base AS build

ENV NODE_ENV=production

RUN mkdir /website
WORKDIR /website

COPY --from=deps /temp/dev/node_modules node_modules
COPY . .
RUN bun run build

# Build the production image with minimal footprint
FROM base

ENV PORT="8080"
ENV NODE_ENV=production

RUN mkdir /website
WORKDIR /website

COPY --from=deps /temp/prod/node_modules node_modules

COPY --from=build /website/docs /website/docs
COPY --from=build /website/build/server /website/build/server
COPY --from=build /website/build/client /website/build/client
COPY package.json ./

USER bun
EXPOSE 8080/tcp
CMD ["bun", "run", "start"]
