import type { Root } from 'mdast';
import { remark } from 'remark';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkRehype from 'remark-rehype';
import remarkSmartypants from 'remark-smartypants';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';

const mdxParser = remark()
	.use(remarkFrontmatter)
	.use(remarkMdx)
	.use(remarkGfm)
	.use(remarkSmartypants)
	.use(remarkRehype)
	.use(rehypeSlug)
	.use(rehypeAutolinkHeadings);

const parseMdx = async (code: string) => mdxParser.parse(code);

const fetchMdx = async (
	slug: string,
	req: Request,
	env: Env,
	ctx: ExecutionContext,
): Promise<Root | undefined> => {
	const { ASSETS, DOCS } = env;
	// If we're in production, we can just get the doc from the KV cache.
	if (process.env.NODE_ENV === 'production') {
		const result = await DOCS.get<Root>(slug, 'json');
		if (result) return result;
	}

	// If the doc doesn't exist in the KV, we need to create it.
	const url = new URL(req.url);
	url.pathname = `/docs/${slug}.mdx`;
	const sourceResp = await ASSETS.fetch(url.toString());
	if (!sourceResp.ok) {
		return;
	}

	const source = await sourceResp.text();
	if (!source) return;

	const mdx = parseMdx(source);

	if (process.env.NODE_ENV === 'production') {
		ctx.waitUntil(
			DOCS.put(slug, JSON.stringify(mdx), {
				expirationTtl: 60 * 60 * 24 * 7, // 1 week
			}),
		);
	}

	return mdx;
};

export { fetchMdx };
