import { execFileSync } from 'node:child_process';

if (process.env.POSTHOG_API_KEY) {
	// Process the final build, including Vite's separately emitted worker assets.
	execFileSync(
		'posthog-cli',
		[
			'sourcemap',
			'process',
			'--directory',
			'build',
			'--release-name',
			'fontsource-website',
			'--release-mode',
			'symbol-set',
			'--delete-after',
		],
		{
			stdio: 'inherit',
			env: {
				...process.env,
				POSTHOG_CLI_API_KEY: process.env.POSTHOG_API_KEY,
				POSTHOG_CLI_PROJECT_ID: '280021',
				POSTHOG_CLI_HOST: 'https://eu.posthog.com',
			},
		},
	);
}
