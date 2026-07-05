import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Config } from '@react-router/dev/config';

const docsDirectory = fileURLToPath(new URL('./docs', import.meta.url));
const mdxExtension = '.mdx';

const staticPageRoutes = ['/tools', '/tools/converter'];
const staticResourceRoutes = ['/llms.txt', '/llms-full.txt', '/robots.txt'];

const getDocsPageRoutes = (directory: string): string[] => {
	const routes: string[] = [];

	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		const entryPath = join(directory, entry.name);

		if (entry.isDirectory()) {
			routes.push(...getDocsPageRoutes(entryPath));
			continue;
		}

		if (!entry.isFile() || !entry.name.endsWith(mdxExtension)) {
			continue;
		}

		const docsPath = relative(docsDirectory, entryPath)
			.slice(0, -mdxExtension.length)
			.split(sep)
			.join('/');

		routes.push(`/docs/${docsPath}`);
	}

	return routes;
};

const prerenderRoutes = [
	...staticPageRoutes,
	...staticResourceRoutes,
	// Docs pages use the dynamic docs.$ route, so each MDX page is listed.
	...getDocsPageRoutes(docsDirectory),
].sort();

export default {
	ssr: true,
	prerender: prerenderRoutes,
} satisfies Config;
