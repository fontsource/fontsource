const fetchMdx = async (
	slug: string,
	req: Request,
	env: Env,
	ctx: ExecutionContext,
): Promise<string | undefined> => {
	const { ASSETS, DOCS } = env;
	// If we're in production, we can just get the doc from the KV cache.
	if (process.env.NODE_ENV === 'production') {
		const result = await DOCS.get(slug);
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

	if (process.env.NODE_ENV === 'production') {
		ctx.waitUntil(
			DOCS.put(slug, source, {
				expirationTtl: 60 * 60 * 24 * 7, // 1 week
			}),
		);
	}

	return source;
};

export { fetchMdx };
