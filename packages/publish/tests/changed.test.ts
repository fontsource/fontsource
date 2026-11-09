import { tmpdir } from 'node:os';
import fs from 'fs-extra';
import path from 'pathe';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { getChanged } from '../src/changed';

let root: string;
beforeEach(async () => {
	root = await fs.mkdtemp(path.join(tmpdir(), 'publish-changed-'));
	await fs.outputJson(path.join(root, 'font', 'package.json'), {
		name: 'font-test',
		version: '1.0.0',
	});
	await fs.outputFile(path.join(root, 'font', 'font.woff2'), 'font bytes');
});
afterEach(() => fs.remove(root));

it('skips the recorded baseline and detects binary-only changes', async () => {
	const config = { packages: [root], commitMessage: 'release' };
	const [changed] = await getChanged(config);
	expect(changed.name).toBe('font-test');
	await fs.writeJson(path.join(root, 'font', 'package.json'), {
		name: 'font-test',
		version: '1.0.0',
		publishHash: changed.hash,
	});
	expect(await getChanged(config)).toEqual([]);
	expect(await getChanged({ ...config, force: true })).toHaveLength(1);
	await fs.writeFile(path.join(root, 'font', 'font.woff2'), 'changed');
	expect(await getChanged(config)).toHaveLength(1);
});

it('propagates packing failures instead of reporting a successful empty scan', async () => {
	await fs.writeJson(path.join(root, 'font', 'package.json'), {
		name: 'font-test',
	});
	await expect(
		getChanged({ packages: [root], commitMessage: 'release' }),
	).rejects.toThrow();
});
