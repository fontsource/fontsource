import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: {
		cli: 'src/cli.ts',
		hash: 'src/hash.ts',
	},
	format: 'esm',
	dts: true,
	target: 'node22',
});
