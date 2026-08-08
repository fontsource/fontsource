import { describe, expect, it } from 'vitest';

import { deserializeStoredChoice } from './browser-storage';

describe('deserializeStoredChoice', () => {
	it('accepts current JSON and legacy raw values', () => {
		expect(
			deserializeStoredChoice('"web"', ['download', 'web'], 'download'),
		).toBe('web');
		expect(deserializeStoredChoice('pnpm', ['npm', 'pnpm'], 'npm')).toBe(
			'pnpm',
		);
	});

	it('falls back for missing, corrupt, or unsupported values', () => {
		expect(
			deserializeStoredChoice(undefined, ['package', 'cdn'], 'package'),
		).toBe('package');
		expect(deserializeStoredChoice('{', ['package', 'cdn'], 'package')).toBe(
			'package',
		);
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
