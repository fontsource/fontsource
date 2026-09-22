import { expect, it } from 'vitest';
import { buildAlgoliaCacheKey } from './algolia';

it.each([
	['/?utm_source=bot', 'algolia:ssr:taxonomy-v2:root'],
	['/languages/vietnamese', 'algolia:ssr:taxonomy-v2:languages:vietnamese'],
	['/?query=inter', undefined],
	['/?languages[0]=vietnamese', undefined],
])('scopes the SSR cache for %s', (path, key) => {
	expect(buildAlgoliaCacheKey(`https://fontsource.org${path}`)).toBe(key);
});
