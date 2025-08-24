import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useParams } from '@remix-run/react';
import { MDXProvider } from '@mdx-js/react';

import { mdxComponents } from '@/utils/mdx/getMdxComponent';
import { ogMeta } from '@/utils/meta';

interface FrontMatter {
	title: string;
	section: string;
	description?: string;
}

interface LoaderData {
	frontmatter: FrontMatter;
}

const matches = import.meta.glob('../../docs/**/*.mdx', {
	eager: true,
}) as Record<string, { default: () => JSX.Element; frontmatter: FrontMatter }>;

const slug = (route: string) => `../../docs/${route}.mdx`;

export const loader = async ({ params }: LoaderFunctionArgs) => {
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

	const frontmatter = matches[slug(route)].frontmatter;

	return json<LoaderData>(
		{ frontmatter },
		{
			headers: {
				'Cache-Control': 'public, max-age=300',
			},
		},
	);
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const frontmatter = data?.frontmatter;
	const title = frontmatter?.title
		? `${frontmatter.title} | Documentation | Fontsource`
		: 'Documentation | Fontsource';
	const description = frontmatter?.description;

	return ogMeta({ title, description });
};

export default function Docs() {
	const params = useParams();
	const route = params['*'];
	if (!route) {
		return null;
	}

	const Component = matches[slug(route)].default;

	return (
		// @ts-expect-error
		<MDXProvider components={mdxComponents}>
			<Component />
		</MDXProvider>
	);
}
