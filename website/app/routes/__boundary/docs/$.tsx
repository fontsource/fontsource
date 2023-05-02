import type { ErrorBoundaryComponent, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useOutletContext } from '@remix-run/react';
import { useAtom } from 'jotai';
import { useEffect, useMemo } from 'react';

import { sidebarAtom } from '@/components/docs/atoms';
import type { FrontMatter } from '@/utils/mdx/esbuild.server';
import { getMDXComponent } from '@/utils/mdx/getMdxComponent';
import type {FetchMdxListResult } from '@/utils/mdx/mdx.server';
import { fetchMdx, fetchMdxList } from '@/utils/mdx/mdx.server';

interface LoaderData {
	code: string;
	frontmatter: FrontMatter;
	sidebar: FetchMdxListResult;
}

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

	const sidebar = await fetchMdxList(route.split('/')[0]); // e.g. getting-started

	return json<LoaderData>({ code: mdx.code, frontmatter: mdx.frontmatter, sidebar });
};

export default function Docs() {
	const mdxComponents = useOutletContext();
	const [_, setSidebar] = useAtom(sidebarAtom);
	const data = useLoaderData<LoaderData>();
	const { code, frontmatter, sidebar } = data;

	useEffect(() => {
		// This is a hacky way to pass data from each route to the parent route for the sidebar
		setSidebar(sidebar);
	}, [sidebar, setSidebar]);

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
