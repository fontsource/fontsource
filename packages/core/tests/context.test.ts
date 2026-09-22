import fs from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { setTimeout } from 'node:timers/promises';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { createFontContext, inspectFont } from '../src';
import { loadStaticFontFixture, loadStaticWoff2Fixture } from './font-fixture';

// Native dependency imports use the built-in filesystem exports directly.
const readFile = fs.readFile;
beforeAll(() => {
	vi.spyOn(fs, 'readFile').mockImplementation((...args) => {
		if (/woff[12]\.wasm$/.test(String(args[0]))) {
			return Promise.reject(new TypeError('WASM download failed'));
		}
		return readFile(...args);
	});
	syncBuiltinESMExports();
});
afterAll(() => {
	vi.restoreAllMocks();
	syncBuiltinESMExports();
});

it('can inspect an uncompressed font and clean up after compression initialization fails', async () => {
	const ctx = createFontContext();
	try {
		// Let initialization fail before an operation could observe its rejection.
		await setTimeout(20);
		const font = await inspectFont(ctx, loadStaticFontFixture());
		expect(font.familyName).toBe('Abel');
	} finally {
		ctx.destroy();
	}
	// Vitest fails the run if initialization or cleanup leaks an unhandled rejection.
	await setTimeout(20);
});

it('reports compression initialization failure to the caller without leaking cleanup errors', async () => {
	const ctx = createFontContext();
	try {
		await expect(inspectFont(ctx, loadStaticWoff2Fixture())).rejects.toThrow(
			'WASM download failed',
		);
	} finally {
		ctx.destroy();
	}
	await setTimeout(20);
});
