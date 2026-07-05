import { describe, expect, it } from 'vitest';

import { buildAlgoliaCacheKey } from './algolia';

describe('buildAlgoliaCacheKey', () => {
	it('ignores unknown params and skips search params', () => {
		expect(
			buildAlgoliaCacheKey(
				'https://fontsource.org/?utm_source=bot&fbclid=garbage',
			),
		).toBe('algolia:ssr:root');

		expect(
			buildAlgoliaCacheKey(
				'https://fontsource.org/?query=inter&utm_source=bot&fbclid=garbage',
			),
		).toBeUndefined();
	});

	it('skips repeated and comma-separated subsets', () => {
		expect(
			buildAlgoliaCacheKey(
				'https://fontsource.org/?subsets=latin-ext,latin&subsets=latin',
			),
		).toBeUndefined();
	});

	it('omits an empty query', () => {
		expect(buildAlgoliaCacheKey('https://fontsource.org/?query=%20%20')).toBe(
			'algolia:ssr:root',
		);
	});

	it('skips known params with arbitrary values', () => {
		expect(
			buildAlgoliaCacheKey(
				'https://fontsource.org/?sort=garbage&category=unknown&variable=garbage',
			),
		).toBeUndefined();
	});
});
