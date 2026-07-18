import { build } from 'esbuild';

await build({
	entryPoints: ['container/server.ts'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node24',
	packages: 'external',
	outfile: 'container/dist/server.mjs',
});
