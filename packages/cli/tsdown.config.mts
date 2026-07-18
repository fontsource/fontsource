import { defineConfig } from 'tsdown';

const libraryEntries = {
	browser: 'src/browser.ts',
	index: 'src/index.ts',
};

export default defineConfig({
	entry: libraryEntries,
	format: {
		esm: {
			entry: {
				...libraryEntries,
				cli: 'src/cli.ts',
			},
		},
		cjs: {},
	},
	dts: {
		entry: Object.values(libraryEntries),
	},
	target: 'node20',
});
