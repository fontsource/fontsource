import type { ErrorBoundaryComponent, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useOutletContext } from '@remix-run/react';
import { useMemo } from 'react';

import { getMDXComponent } from '@/utils/mdx/getMdxComponent';
import { fetchMdx } from '@/utils/mdx/mdx.server';

export const loader: LoaderFunction = async ({ params }) => {
	const route = params['*'];
	if (!route) {
		throw new Response('Not found', { status: 404 });
	}

	// Redirect sections to their first child
	if (route === 'getting-started')
		return redirect('/docs/getting-started/overview');
	if (route === 'guides') return redirect('/docs/guides/angular');
	if (route === 'api') return redirect('/docs/api/introduction');

	const mdx = await fetchMdx(route);
	if (!mdx) {
		throw new Response('Not found', { status: 404 });
	}

	return json({ code: mdx.code, frontmatter: mdx.frontmatter });
};

export default function Docs() {
	const mdxComponents = useOutletContext();
	const data = useLoaderData();
	const { code, frontmatter } = data;

	const Content = useMemo(() => getMDXComponent(code), [code]);
	return (
		<>
			{JSON.stringify(frontmatter)}
			<Content components={mdxComponents} />
		</>
	);
}

export const ErrorBoundary: ErrorBoundaryComponent = ({ error }) => {
	return <>{error.message}</>;
};
