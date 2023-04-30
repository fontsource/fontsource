import { Container, Header } from '@mantine/core';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { useMemo } from 'react';

import { getMDXComponent } from '@/utils/mdx/getMdxComponent';
import { fetchMdx } from '@/utils/mdx/mdx.server';

export const loader: LoaderFunction = async () => {
	const { code, frontmatter } = await fetchMdx('getting-started/overview');
	return json({ code, frontmatter });
};

export default function Index() {
	const data = useLoaderData();
	const { code, frontmatter } = data;

	const components = {
		h1: (props: any) => <Header fw={900} {...props} />,
	};

	const Content = useMemo(() => getMDXComponent(code), [code]);
	return (
		<>
			{JSON.stringify(frontmatter)}
			<Content components={components} />
		</>
	);
}
