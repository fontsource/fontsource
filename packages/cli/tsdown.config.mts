import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: { cli: 'src/cli.ts' },
	format: 'esm',
	target: 'node22',
});
