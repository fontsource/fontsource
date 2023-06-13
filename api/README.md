# Fontsource API

This API uses Cloudflare Workers, KV and R2 to serve the API and CDN. We use a proxy provided by jsDelivr to cache all R2 requests on the edge to also reduce costs.

### Development

To run the API locally, you will need to install Node 18+ and `pnpm`.

```bash
pnpm install
```

Each directory represents a different worker that is deployed to Cloudflare. To run a worker locally, you can use the following command:

```bash
pnpm run dev
```

As different workers are binded to each other, they may connect to the live service. Thus you will need to run `pnpm run dev` in each relevant directory to use the local workers dev registry.

### Testing

To run the tests, you can use the following command in each directory:

```bash
pnpm run test
```
