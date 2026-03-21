import { wasm } from 'rolldown-plugin-wasm';
import { defineConfig } from 'tsdown';

export default defineConfig([
	{
		entry: ['./src/index.ts'],
		platform: 'neutral',
		dts: true,
		plugins: [
			wasm({
				targetEnv: 'auto-inline',
				maxFileSize: 10 * 1024 * 1024,
			}),
		],
	},
]);
