# Fontsource API

This API uses Cloudflare Workers, KV and R2 to serve the API and CDN. We also use a custom proxy provided by [jsDelivr](https://www.jsdelivr.com/) to cache all R2 requests on the edge to also reduce costs.

Learn more about the API at [fontsource.org](https://fontsource.org/docs/api/introduction).

### Workers

-   [cdn](./cdn) - The worker that acts as the origin for the jsDelivr CDN proxy.
-   [common](./common) - A shared library of common functions and types used by the other workers.
-   [metadata](./metadata) - The API worker that serves the KV metadata for the fonts.
-   [upload](./upload) - A worker that uploads font files from our website VM to R2.

### Development

To run the API locally, you will need to install Node 18+ and `bun`.

```bash
bun install
```

Each directory represents a different worker that is deployed to Cloudflare. To run a worker locally, you can use the following command:

```bash
bun run dev
```

As different workers are binded to each other, they may connect to the live service. Thus you will need to run `bun run dev` in each relevant directory to use the local workers dev registry.

### Testing

To run the tests, you can use the following command in each directory:

```bash
bun run test
```
