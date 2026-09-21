import { Button, TextInput } from '@mantine/core';
import { IconArrowRight, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, Link, useLoaderData } from 'react-router';

import { ContentHeader } from '@/components/layout/ContentHeader';
import classes from '@/styles/browse.module.css';
import { cacheHeaders } from '@/utils/cache';
import type { DiscoveryPage } from '@/utils/discovery';
import { loadDiscoveryData } from '@/utils/discovery.server';
import { ogMeta } from '@/utils/meta';

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { pages, registry } = await loadDiscoveryData(request.signal);
	return data(
		{ pages, tagGroups: registry.taxonomy.tagGroups },
		{ headers: cacheHeaders.short },
	);
};

export const meta: MetaFunction = () =>
	ogMeta({
		title: 'Browse Open-Source Fonts | Fontsource',
		description:
			'Browse open-source fonts by category, style, language, and variable-font support, then preview and self-host your selection with Fontsource.',
	});

const Directory = ({
	pages,
	large = false,
}: {
	pages: DiscoveryPage[];
	large?: boolean;
}) => (
	<ul className={large ? classes.categories : classes.directory}>
		{pages.map((page) => (
			<li key={page.path}>
				<Link to={page.path} prefetch="intent" className={classes.link}>
					<span>{page.label}</span>
					<span
						className={classes.count}
						title={`${page.count.toLocaleString('en-US')} families`}
					>
						{page.count.toLocaleString('en-US')}
						<span className={classes.srOnly}> families</span>
					</span>
					{large && <IconArrowRight size={20} aria-hidden />}
				</Link>
			</li>
		))}
	</ul>
);

export default function Browse() {
	const { pages, tagGroups } = useLoaderData<typeof loader>();
	const [query, setQuery] = useState('');
	const normalizedQuery = query.trim().toLocaleLowerCase();
	const matchingPages = pages.filter((page) => {
		const group = page.routeState.tags?.split('/')[0];
		return `${page.label} ${group ? (tagGroups[group]?.label ?? '') : ''}`
			.toLocaleLowerCase()
			.includes(normalizedQuery);
	});
	const categories = matchingPages.filter((page) => page.kind === 'category');
	const languages = matchingPages.filter((page) => page.kind === 'language');
	const variable = matchingPages.find((page) => page.kind === 'variable');
	const groups = Object.entries(tagGroups)
		.map(([id, group]) => ({
			id,
			label: group.label,
			pages: matchingPages.filter((page) =>
				page.routeState.tags?.startsWith(`${id}/`),
			),
		}))
		.filter((group) => group.pages.length > 0)
		.sort((a, b) => a.label.localeCompare(b.label));

	return (
		<>
			<ContentHeader
				title="Browse fonts"
				description="Find a starting point. Explore by category, language, or the details that give a typeface its character."
			/>
			<div className={classes.content}>
				<div className={classes.toolbar}>
					<nav aria-label="Browse sections" className={classes.navigation}>
						{(categories.length > 0 || variable) && (
							<a href="#categories">Categories</a>
						)}
						{languages.length > 0 && <a href="#languages">Languages</a>}
						{groups.length > 0 && <a href="#tags">Style & character</a>}
					</nav>
					<TextInput
						aria-label="Find a category, language, or tag"
						placeholder="Find a category, language, or tag"
						leftSection={<IconSearch size={18} aria-hidden />}
						value={query}
						onChange={(event) => setQuery(event.currentTarget.value)}
						className={classes.search}
					/>
				</div>
				{normalizedQuery && (
					<p className={classes.results} role="status">
						{matchingPages.length}{' '}
						{matchingPages.length === 1 ? 'match' : 'matches'}
						<Button
							variant="subtle"
							size="compact-sm"
							onClick={() => setQuery('')}
						>
							Clear search
						</Button>
					</p>
				)}
				{matchingPages.length === 0 && (
					<p className={classes.empty}>
						No matches for “{query}”. Try a broader term, such as serif,
						Japanese, or geometric.
					</p>
				)}
				<section
					id="categories"
					className={classes.section}
					hidden={!categories.length && !variable}
				>
					<div className={classes.sectionHeading}>
						<h2>Categories</h2>
						<p>Start with the shape of the letters.</p>
					</div>
					<div>
						<Directory pages={categories} large />
						{variable && (
							<Link to={variable.path} className={classes.variable}>
								<span>
									<strong>Variable fonts</strong>
									<span className={classes.variableDescription}>
										Explore adjustable weight, width, and more.
									</span>
								</span>
								<span className={classes.count}>
									{variable.count.toLocaleString('en-US')} families
								</span>
								<IconArrowRight size={20} aria-hidden />
							</Link>
						)}
					</div>
				</section>
				<section
					id="languages"
					className={classes.section}
					hidden={!languages.length}
				>
					<div className={classes.sectionHeading}>
						<h2>Languages</h2>
						<p>Find the character support you need.</p>
					</div>
					<Directory pages={languages} />
				</section>
				<section id="tags" className={classes.section} hidden={!groups.length}>
					<div className={classes.sectionHeading}>
						<h2>Style & character</h2>
						<p>Explore a mood, a detail, or a specific use.</p>
					</div>
					<div className={classes.tagGroups}>
						{groups.map((group) => (
							<section key={group.id} aria-labelledby={`tag-group-${group.id}`}>
								<h3 id={`tag-group-${group.id}`}>{group.label}</h3>
								<Directory pages={group.pages} />
							</section>
						))}
					</div>
				</section>
			</div>
		</>
	);
}
