# Install and build the app
FROM oven/bun:latest as base

COPY package.json ./
COPY src/ ./src/

RUN bun install
RUN bun run build

# Build the production image with minimal footprint
FROM scratch as deploy

ENV PORT="3000"

COPY --from=base /bin /bin

EXPOSE 3000
ENTRYPOINT [ "/bin" ]
