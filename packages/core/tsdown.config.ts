import { defineConfig } from 'tsdown';

export default defineConfig([
	{
		entry: ['./src/index.ts', './src/css/index.ts'],
		platform: 'neutral',
		dts: true,
	},
]);
