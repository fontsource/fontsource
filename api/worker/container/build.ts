const result = await Bun.build({
	entrypoints: ['./api/worker/container/server.ts'],
	compile: {
		outfile: './api/worker/bin/artifact-builder',
		autoloadDotenv: false,
		autoloadBunfig: false,
	},
	bytecode: true,
	minify: true,
	sourcemap: 'none',
});

if (!result.success) {
	for (const log of result.logs) {
		console.error(log);
	}

	process.exit(1);
}

export {};
