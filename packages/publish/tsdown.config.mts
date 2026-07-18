import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: {
		cli: 'src/cli.ts',
	},
	format: 'esm',
	dts: false,
	target: 'node22',
});
