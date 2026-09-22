import { defineConfig } from 'tsdown';

export default defineConfig([
	{
		entry: ['./src/index.ts', './src/css/index.ts'],
		platform: 'neutral',
		// cssesc is CommonJS and exposes its entrypoint through package.json main.
		inputOptions: { resolve: { mainFields: ['module', 'main'] } },
		dts: true,
		deps: { alwaysBundle: ['cssesc'] },
	},
]);
