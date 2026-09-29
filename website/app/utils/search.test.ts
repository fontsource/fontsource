import { expect, it } from 'vitest';
import { normalizeSearchQuery } from './search';

it.each([
	['  IBM Plex  ', '  IBM Plex  '],
	['a'.repeat(128), 'a'.repeat(128)],
	['a'.repeat(129), 'a'.repeat(128)],
	['字'.repeat(129), '字'.repeat(128)],
	[`${'a'.repeat(126)}😀x`, `${'a'.repeat(126)}😀`],
	[`${'a'.repeat(127)}😀`, 'a'.repeat(127)],
	[undefined, ''],
	[['inter', 'roboto'], ''],
	[{ query: 'inter' }, ''],
])(
	'bounds search queries without splitting Unicode code points (%#)',
	(input, expected) => {
		expect(normalizeSearchQuery(input)).toBe(expected);
	},
);
