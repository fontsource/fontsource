import { describe, expect, it } from 'vitest';

import { z } from 'zod';

import { deserializeStoredChoice, readStoredValue } from './browser-storage';

describe('deserializeStoredChoice', () => {
	it('accepts a supported JSON value', () => {
		expect(
			deserializeStoredChoice('"web"', ['download', 'web'], 'download'),
		).toBe('web');
	});

	it('falls back for missing, corrupt, or unsupported values', () => {
		expect(
			deserializeStoredChoice(undefined, ['package', 'cdn'], 'package'),
		).toBe('package');
		expect(deserializeStoredChoice('{', ['package', 'cdn'], 'package')).toBe(
			'package',
		);
		expect(deserializeStoredChoice('pnpm', ['npm', 'pnpm'], 'npm')).toBe('npm');
		expect(
			deserializeStoredChoice('"future"', ['package', 'cdn'], 'package'),
		).toBe('package');
	});

	it('supports a null unselected state', () => {
		expect(
			deserializeStoredChoice('null', ['download', 'web', null], null),
		).toBeNull();
	});
});

describe('readStoredValue', () => {
	const schema = z.object({ familyId: z.string().min(1) });

	it('distinguishes missing, valid, and invalid stored data', () => {
		const values = new Map<string, string>();
		const storage = {
			getItem: (key: string) => values.get(key) ?? null,
		} as Storage;

		expect(readStoredValue(storage, 'font-set', schema)).toEqual({
			status: 'missing',
		});

		values.set('font-set', '{"familyId":"roboto"}');
		expect(readStoredValue(storage, 'font-set', schema)).toEqual({
			status: 'valid',
			value: { familyId: 'roboto' },
		});

		values.set('font-set', '{');
		expect(readStoredValue(storage, 'font-set', schema)).toEqual({
			status: 'invalid',
		});

		values.set('font-set', '{"familyId":""}');
		expect(readStoredValue(storage, 'font-set', schema)).toEqual({
			status: 'invalid',
		});
	});

	it('reports unavailable storage', () => {
		const storage = {
			getItem: () => {
				throw new Error('blocked');
			},
		} as unknown as Storage;

		expect(readStoredValue(storage, 'font-set', schema)).toEqual({
			status: 'unavailable',
		});
	});
});
