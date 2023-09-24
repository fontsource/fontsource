# base node image
FROM node:20-bullseye-slim as base

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

ENV PORT="8080"
ENV NODE_ENV=production

WORKDIR /app

COPY --from=production-deps /app/node_modules /app/node_modules

COPY --from=build /app/build /app/build
COPY --from=build /app/public /app/public
COPY --from=build /app/docs /app/docs
COPY package.json ./

EXPOSE 8080
CMD ["npm", "run", "start"]
