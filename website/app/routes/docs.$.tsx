import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useLoaderData, useOutletContext } from '@remix-run/react';
import { SafeMdxRenderer } from 'safe-mdx';

import { fetchMdx } from '@/utils/mdx/mdx.server';
import { ogMeta } from '@/utils/meta';
import type { Root } from 'mdast';
import { MdxRenderer } from '@/utils/mdx/render';

export interface FrontMatter {
	title: string;
	section: string;
	description?: string;
}

interface LoaderData {
	mdx: Root;
}

export const loader = async ({
	request,
	params,
	context,
}: LoaderFunctionArgs) => {
	const route = params['*'];
	if (!route) {
		throw new Response('Not found', { status: 404 });
	}

	// Redirect sections to their first child
	if (route === 'getting-started' || route === 'getting-started/')
		return redirect('/docs/getting-started/introduction');
	if (route === 'guides' || route === 'guides/')
		return redirect('/docs/guides/angular');
	if (route === 'api' || route === 'api/')
		return redirect('/docs/api/introduction');

	const mdx = await fetchMdx(
		route,
		request,
		context.cloudflare.env,
		context.cloudflare.ctx,
	);
	if (!mdx) {
		throw new Response('Not found', { status: 404 });
	}

	return json<LoaderData>(
		{ mdx },
		{
			headers: {
				'Cache-Control': 'public, max-age=300',
			},
		},
	);
};

/*export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const frontmatter = data?.frontmatter as FrontMatter | undefined;
	const title = frontmatter?.title
		? `${frontmatter.title} | Documentation | Fontsource`
		: 'Documentation | Fontsource';
	const description = frontmatter?.description;

	return ogMeta({ title, description });
}; */

export default function Docs() {
	const { mdx } = useLoaderData<LoaderData>();
	const [Component, _] = MdxRenderer({ mdast: mdx });

	return Component;
}
