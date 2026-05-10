import browserCollections from 'collections/browser';
import type { TOCItemType } from 'fumadocs-core/toc';
import type {
	ClientLoaderFunctionArgs,
	LoaderFunctionArgs,
	MetaFunction,
} from 'react-router';
import { data, redirect, useLoaderData } from 'react-router';

import { Breadcrumbs } from '@/components/docs/Breadcrumbs';
import classes from '@/components/docs/Page.module.css';
import { PageActions } from '@/components/docs/PageActions';
import { Pager } from '@/components/docs/Pager';
import { Toc } from '@/components/docs/Toc';
import type { Breadcrumb, Pager as PagerData } from '@/utils/docs/navigation';
import { getBreadcrumbs, getPager } from '@/utils/docs/navigation';
import { source } from '@/utils/docs/source.server';
import { mdxComponents } from '@/utils/mdx/getMdxComponent';
import { ogMeta } from '@/utils/meta';

interface FrontMatter {
	title: string;
	description?: string;
}

interface LoaderData {
	path: string;
	markdownUrl: string;
	editUrl: string;
	frontmatter: FrontMatter;
	toc: TOCItemType[];
	pager: PagerData;
	breadcrumbs: Breadcrumb[];
}

const sectionRedirects: Record<string, string> = {
	'getting-started': '/docs/getting-started/introduction',
	guides: '/docs/guides/angular',
	api: '/docs/api/introduction',
};

interface ContentProps {
	title: string;
	markdownUrl: string;
}

const docsContentLoader =
	browserCollections.docs.createClientLoader<ContentProps>({
		component({ default: MDX }, { title, markdownUrl }) {
			return (
				<>
					<h1 className={classes.title}>{title}</h1>
					<PageActions markdownUrl={markdownUrl} />
					<MDX components={mdxComponents} />
				</>
			);
		},
	});

const editUrl = (path: string) =>
	`https://github.com/fontsource/fontsource/edit/main/website/docs/${path}`;

export const loader = async ({ params }: LoaderFunctionArgs) => {
	const route = params['*']?.replace(/\/$/, '');
	if (!route) {
		throw new Response('Not found', { status: 404 });
	}

	const redirectTo = sectionRedirects[route];
	if (redirectTo) return redirect(redirectTo);

	const page = source.getPage(route.split('/').filter(Boolean));

	if (!page) {
		throw new Response('Not found', { status: 404 });
	}

	await docsContentLoader.preload(page.path);

	return data<LoaderData>(
		{
			path: page.path,
			markdownUrl: `${page.url}.md`,
			editUrl: editUrl(page.path),
			frontmatter: {
				title: page.data.title,
				description: page.data.description,
			},
			toc: page.data.toc,
			pager: getPager(source.pageTree, page.url),
			breadcrumbs: getBreadcrumbs(source.pageTree, page.url),
		},
		{
			headers: {
				'Cache-Control': 'public, max-age=300',
			},
		},
	);
};

export const clientLoader = async ({
	serverLoader,
}: ClientLoaderFunctionArgs) => {
	const loaderData = await serverLoader<LoaderData>();
	await docsContentLoader.preload(loaderData.path);
	return loaderData;
};

clientLoader.hydrate = true;

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const frontmatter = data?.frontmatter;
	const title = frontmatter?.title
		? `${frontmatter.title} | Documentation | Fontsource`
		: 'Documentation | Fontsource';
	const description = frontmatter?.description;

	return ogMeta({ title, description });
};

export default function DocsPage() {
	const loaderData = useLoaderData<typeof loader>() as LoaderData;

	return (
		<div className={classes.page}>
			<article className={classes.article}>
				<Breadcrumbs items={loaderData.breadcrumbs} />
				{docsContentLoader.useContent(loaderData.path, {
					title: loaderData.frontmatter.title,
					markdownUrl: loaderData.markdownUrl,
				})}
				<Pager pager={loaderData.pager} />
			</article>
			<Toc toc={loaderData.toc} editUrl={loaderData.editUrl} />
		</div>
	);
}
