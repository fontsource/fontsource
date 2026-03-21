import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtureDir = resolve(
	dirname(fileURLToPath(import.meta.url)),
	'fixtures/fonts',
);

const loadFontFixture = (filename: string): Uint8Array =>
	new Uint8Array(readFileSync(resolve(fixtureDir, filename)));

export const loadStaticFontFixture = (): Uint8Array =>
	loadFontFixture('abel-latin-400-normal.ttf');

export const loadVariableFontFixture = (): Uint8Array =>
	loadFontFixture('recursive-latin-full-normal.ttf');
