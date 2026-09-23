import { expect, it } from 'vitest';
import { buildAlgoliaCacheKey } from './algolia';

const keyFor = (path: string) =>
	buildAlgoliaCacheKey(`https://fontsource.org${path}`);

it('shares cache entries across tracking parameters and independent filter ordering', async () => {
	expect(await keyFor('/?utm_source=bot')).toBe(await keyFor('/'));
	expect(await keyFor('/?query=inter&sort=name&languages=en_Latn')).toBe(
		await keyFor('/?languages=en_Latn&sort=name&query=inter&utm_source=bot'),
	);
});

it.each([
	['/', '/languages/vietnamese'],
	['/languages/vietnamese', '/languages/japanese'],
	['/?query=inter', '/?query=roboto'],
	['/?sort=name', '/?sort=newest'],
	['/?category=serif', '/?category=sans-serif'],
	['/?variable=true', '/?variable=false'],
	['/?subsets=latin', '/?subsets=cyrillic'],
	['/?classifications=serif', '/?classifications=slab-serif'],
	['/?tags=monospace', '/?tags=display'],
	['/?languages=en_Latn', '/?languages=ja_Jpan'],
	['/?languages[0]=en_Latn', '/?languages[0]=ja_Jpan'],
	['/?languages=en_Latn&languages=ja_Jpan', '/?languages=en_Latn'],
	['/?query=inter&query=roboto', '/?query=roboto&query=inter'],
	[
		'/?languages[]=en_Latn&languages[0]=ja_Jpan',
		'/?languages[0]=ja_Jpan&languages[]=en_Latn',
	],
])('keeps distinct search state separate: %s and %s', async (left, right) => {
	const leftKey = await keyFor(left);
	const rightKey = await keyFor(right);
	expect(leftKey).toBeDefined();
	expect(rightKey).toBeDefined();
	expect(leftKey).not.toBe(rightKey);
});

it('bounds the KV key even for long queries and paths', async () => {
	const key = await keyFor(
		`/${'long-path'.repeat(100)}?query=${'font'.repeat(1000)}`,
	);
	expect(key).toMatch(/^algolia:ssr:search-v3:[a-f0-9]{64}$/);
});

it('does not share URLs whose routing is truncated by the query parser', async () => {
	expect(
		await keyFor(`/?${'utm_source=bot&'.repeat(1000)}query=inter`),
	).toBeUndefined();
});

it.each(['%FF', '%E2%28%A1', '%'])(
	'does not cache malformed query encoding: %s',
	async (query) => {
		expect(await keyFor(`/?query=${query}`)).toBeUndefined();
		expect(await keyFor('/?query=%EF%BF%BD')).toBeDefined();
	},
);

it.each(['collection=saved', 'collection=', 'collection[0]=saved'])(
	'does not share browser-local collection state: %s',
	async (params) => {
		expect(await keyFor(`/?${params}&query=inter`)).toBeUndefined();
	},
);
