import { Container } from '@mantine/core';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useMemo } from 'react';

import { getMDXComponent } from '@/utils/mdx/getMdxComponent';
import { fetchMdx } from '@/utils/mdx/mdx.server';

export const loader: LoaderFunction = async ({ params }) => {
	const { id } = params;
	const { code, frontmatter } = await fetchMdx('getting-started/overview');

	return json({ code, frontmatter });
};

export default function Docs() {
	const data = useLoaderData();
	const { code, frontmatter } = data;

	const Content = useMemo(() => getMDXComponent(code), [code]);
	return (
		<Container>
			<h1>Page 2</h1>
			<p>This route works fine.</p>
			<Link to="/">Back to home</Link>
			{JSON.stringify(frontmatter)}
			<Content />
		</Container>
	);
}
