import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useOutletContext } from '@remix-run/react';
import { useMemo } from 'react';

import { getMDXComponent } from '@/utils/mdx/getMdxComponent';
import { fetchMdx } from '@/utils/mdx/mdx.server';

export const loader: LoaderFunction = async ({ params }) => {
	const { id } = params;
	const { code, frontmatter } = await fetchMdx('general/overview');

	return json({ code, frontmatter });
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
