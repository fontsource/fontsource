import { expect, it } from 'vitest';
import { normalizeSearchQuery } from './search';

it.each([
	['  IBM Plex  ', '  IBM Plex  '],
	['a'.repeat(512), 'a'.repeat(512)],
	['a'.repeat(513), 'a'.repeat(512)],
	['字'.repeat(171), '字'.repeat(170)],
	[`${'a'.repeat(508)}😀x`, `${'a'.repeat(508)}😀`],
	[`${'a'.repeat(509)}😀`, 'a'.repeat(509)],
	[undefined, ''],
	[['inter', 'roboto'], ''],
	[{ query: 'inter' }, ''],
])(
	'bounds search queries without splitting Unicode code points (%#)',
	(input, expected) => {
		expect(normalizeSearchQuery(input)).toBe(expected);
	},
);
