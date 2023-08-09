# Fetch the LiteFS binary using a multi-stage build.
FROM flyio/litefs:0.5 AS litefs

# base node image
FROM node:20-bullseye-slim as base

# Install fuse and ca-certificates for lite-fs
RUN apt-get update && apt-get install -y fuse3 ca-certificates
## Add PNPM
RUN npm install -g pnpm
RUN pnpm --version

# Install all node_modules, including dev dependencies
FROM base AS deps

RUN mkdir /app
WORKDIR /app

COPY package.json ./
RUN pnpm install

# Setup production node_modules
FROM base AS production-deps

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
COPY package.json ./
RUN pnpm prune --prod

# Build the app
FROM base AS build

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules

ADD . .
RUN pnpm run build

# Build the production image with minimal footprint
FROM base

ENV FLY="true"
ENV LITEFS_DIR="/litefs"
ENV DATABASE_FILENAME="sqlite.db"
ENV DATABASE_URL="$LITEFS_DIR/$DATABASE_FILENAME"
ENV INTERNAL_PORT="8080"
ENV PORT="8081"
ENV NODE_ENV=production

WORKDIR /app

COPY --from=production-deps /app/node_modules /app/node_modules

COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public
COPY --from=build /app/migrations /app/migrations
COPY --from=build /app/docs /app/docs
COPY knexfile.js ./
COPY package.json ./

# Setup LiteFS
COPY --from=litefs /usr/local/bin/litefs /usr/local/bin/litefs
COPY litefs.yml /etc/litefs.yml
RUN mkdir -p /data ${LITEFS_DIR}

EXPOSE 3000
CMD ["litefs", "mount"]
