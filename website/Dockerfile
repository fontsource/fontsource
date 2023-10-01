# base node image
FROM node:20-bullseye-slim as base

## Add PNPM
RUN npm install -g pnpm
RUN pnpm --version

# Install all node_modules, including dev dependencies
FROM base AS deps

RUN mkdir /website
WORKDIR /website

COPY package.json ./
RUN pnpm install

# Setup production node_modules
FROM base AS production-deps

RUN mkdir /website
WORKDIR /website

COPY --from=deps /website/node_modules /website/node_modules
COPY package.json ./
RUN pnpm prune --prod

# Build the app
FROM base AS build

ENV NODE_ENV=production

RUN mkdir /website
WORKDIR /website

COPY --from=deps /website/node_modules /website/node_modules

ADD . .
RUN pnpm run build

# Build the production image with minimal footprint
FROM base

ENV PORT="8080"
ENV NODE_ENV=production

WORKDIR /website

COPY --from=production-deps /website/node_modules /website/node_modules

COPY --from=build /website/build /website/build
COPY --from=build /website/docs /website/docs
COPY --from=build /website/public /website/public
COPY package.json ./

EXPOSE 8080
CMD ["npm", "run", "start"]
