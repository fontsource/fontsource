import type { PlatformProxy } from 'wrangler';

type GetLoadContextArgs = {
	request: Request;
	context: {
		cloudflare: Omit<
			PlatformProxy<Env, IncomingRequestCfProperties>,
			'dispose' | 'caches'
		> & {
			caches:
				| PlatformProxy<Env, IncomingRequestCfProperties>['caches']
				| CacheStorage;
		};
	};
};

declare module '@remix-run/cloudflare' {
	interface AppLoadContext extends ReturnType<typeof getLoadContext> {
		// This will merge the result of `getLoadContext` into the `AppLoadContext`
	}
}

export function getLoadContext({ context }: GetLoadContextArgs) {
	return context;
}
