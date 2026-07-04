import { describe, expect, it } from 'vitest';

import { buildAlgoliaCacheKey } from './algolia';

describe('buildAlgoliaCacheKey', () => {
	it('ignores unknown params', () => {
		expect(
			buildAlgoliaCacheKey(
				'https://fontsource.org/?utm_source=bot&fbclid=garbage',
			),
		).toBe('algolia:ssr:root');

		expect(
			buildAlgoliaCacheKey(
				'https://fontsource.org/?query=inter&utm_source=bot&fbclid=garbage',
			),
		).toBe('algolia:ssr:query=inter');
	});

	it('normalizes param order', () => {
		expect(
			buildAlgoliaCacheKey(
				'https://fontsource.org/?sort=newest&category=serif&query=inter',
			),
		).toBe(
			buildAlgoliaCacheKey(
				'https://fontsource.org/?query=inter&category=serif&sort=newest',
			),
		);
	});

	it('normalizes repeated and comma-separated subsets', () => {
		expect(
			buildAlgoliaCacheKey(
				'https://fontsource.org/?subsets=latin-ext,latin&subsets=latin',
			),
		).toBe('algolia:ssr:subsets=latin%2Clatin-ext');
	});

	it('omits an empty query', () => {
		expect(buildAlgoliaCacheKey('https://fontsource.org/?query=%20%20')).toBe(
			'algolia:ssr:root',
		);
	});

	it('preserves known params with arbitrary values', () => {
		expect(
			buildAlgoliaCacheKey(
				'https://fontsource.org/?sort=garbage&category=unknown&variable=garbage',
			),
		).toBe('algolia:ssr:category=unknown&variable=true&sort=garbage');
	});
});
