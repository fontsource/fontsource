import { packageManagerCommandBlock } from './packageManagers';
import { source } from './source.server';

const docsPrefix = '/docs/';
const markdownSuffix = '.md';
const packageManagerCodeComponent =
	/<PackageManagerCode\s+cmd=(["'])(.*?)\1\s*\/>/g;
const cacheDocsMarkdown = import.meta.env.PROD;

interface MarkdownPage {
	url: string;
	data: {
		title: string;
		getText: (format: 'processed') => Promise<string>;
	};
}

const markdownCache = new Map<string, Promise<string>>();
let allDocsMarkdown: Promise<string> | undefined;

const renderPackageManagerCode = (cmd: string) =>
	`\`\`\`sh\n${packageManagerCommandBlock(cmd)}\n\`\`\``;

const normalizeProcessedMarkdown = (markdown: string) =>
	markdown
		.trimStart()
		.replaceAll(
			packageManagerCodeComponent,
			(_component, _quote, cmd: string) => renderPackageManagerCode(cmd),
		);

const renderDocsPageMarkdown = async (page: MarkdownPage) =>
	normalizeProcessedMarkdown(await page.data.getText('processed'));

const getMarkdownRoute = (pathname: string) => {
	if (!pathname.startsWith(docsPrefix) || !pathname.endsWith(markdownSuffix)) {
		return null;
	}

	return decodeURIComponent(
		pathname.slice(docsPrefix.length, pathname.length - markdownSuffix.length),
	);
};

const renderAllDocsMarkdown = async () => {
	const pages = source.getPages();
	const chunks = await Promise.all(
		pages.map(async (page) => {
			const text = await getDocsPageMarkdown(page);
			return `# ${page.data.title}\n\nSource: ${page.url}\n\n${text}`;
		}),
	);

	return chunks.join('\n\n---\n\n');
};

export const getDocsPageMarkdown = (page: MarkdownPage) => {
	if (!cacheDocsMarkdown) return renderDocsPageMarkdown(page);

	let text = markdownCache.get(page.url);
	if (!text) {
		text = renderDocsPageMarkdown(page);
		markdownCache.set(page.url, text);
	}

	return text;
};

export const getAllDocsMarkdown = () => {
	if (!cacheDocsMarkdown) return renderAllDocsMarkdown();

	allDocsMarkdown ??= renderAllDocsMarkdown();
	return allDocsMarkdown;
};

export const getDocsMarkdownResponse = async (pathname: string) => {
	const route = getMarkdownRoute(pathname);
	if (!route) return null;

	const page = source.getPage(route.split('/').filter(Boolean));

	if (!page) {
		return new Response('Not found', { status: 404 });
	}

	const text = await getDocsPageMarkdown(page);

	return new Response(text, {
		headers: {
			'Content-Type': 'text/markdown; charset=utf-8',
			'Cache-Control': 'public, max-age=300',
		},
	});
};
