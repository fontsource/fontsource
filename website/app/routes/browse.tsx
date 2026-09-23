import { Button, TextInput } from '@mantine/core';
import { useIntersection, useMediaQuery } from '@mantine/hooks';
import { IconArrowRight, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { data, Link, useLoaderData } from 'react-router';
import { CarbonAd } from '@/components/CarbonAd';
import { useIsFontReady } from '@/hooks/useIsFontLoaded';
import { usePreviewStylesheet } from '@/hooks/usePreviewStylesheet';
import classes from '@/styles/browse.module.css';
import { cacheHeaders } from '@/utils/cache';
import type { DiscoveryPage } from '@/utils/discovery';
import { loadDiscoveryData } from '@/utils/discovery.server';
import { getRecommendedPreviewText } from '@/utils/language/language';
import { ogMeta } from '@/utils/meta';

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { pages, registry, catalogFamilies, catalogSubsets } =
		await loadDiscoveryData(request.signal);
	const tagSpecimens: Record<
		string,
		{ id: string; family: string; text: string; direction?: 'ltr' | 'rtl' }
	> = {};
	const usedFamilies = new Set<string>();
	for (const page of pages) {
		const tag = page.routeState.tags;
		if (!tag) continue;
		const candidates = catalogFamilies.filter((family) =>
			family.tags.includes(tag),
		);
		const latinCandidates = candidates.filter((family) => {
			const subsets = catalogSubsets[family.id];
			return (
				Array.isArray(subsets) &&
				subsets.some((subset) => subset === 'latin') &&
				!family.classifications.includes('symbols')
			);
		});
		const family =
			latinCandidates.find((family) => !usedFamilies.has(family.id)) ??
			latinCandidates[0] ??
			candidates.find((family) => !usedFamilies.has(family.id)) ??
			candidates[0];
		if (!family) continue;
		usedFamilies.add(family.id);
		tagSpecimens[page.path] = {
			id: family.id,
			family: family.family,
			text: latinCandidates.includes(family)
				? page.label
				: getRecommendedPreviewText({
						...family,
						defSubset: family.previewSubset ?? 'latin',
					}),
			direction: latinCandidates.includes(family)
				? 'ltr'
				: family.primaryDirection,
		};
	}
	return data(
		{ pages, tagGroups: registry.taxonomy.tagGroups, tagSpecimens },
		{ headers: cacheHeaders.short },
	);
};

export const meta: MetaFunction = () =>
	ogMeta({
		title: 'Browse Open-Source Fonts | Fontsource',
		description:
			'Browse open-source fonts by category, style, language, and variable-font support, then preview and self-host your selection with Fontsource.',
	});

const specimens: Record<string, { id: string; family: string; text: string }> =
	{
		'/categories/display': {
			id: 'bebas-neue',
			family: 'Bebas Neue',
			text: 'Make an impression',
		},
		'/categories/handwriting': {
			id: 'caveat',
			family: 'Caveat',
			text: 'A personal touch',
		},
		'/categories/icons': {
			id: 'material-icons',
			family: 'Material Icons',
			text: 'home favorite search',
		},
		'/categories/monospace': {
			id: 'space-mono',
			family: 'Space Mono',
			text: 'Type with rhythm.',
		},
		'/categories/sans-serif': {
			id: 'dm-sans',
			family: 'DM Sans',
			text: 'Simply speaking.',
		},
		'/categories/serif': {
			id: 'lora',
			family: 'Lora',
			text: 'The finer details.',
		},
		'/categories/slab-serif': {
			id: 'roboto-slab',
			family: 'Roboto Slab',
			text: 'A solid foundation.',
		},
		'/categories/symbols': {
			id: 'noto-sans-symbols-2',
			family: 'Noto Sans Symbols 2',
			text: '♜ ♞ ♝ ♛ ♚',
		},
	};

const groupDescriptions: Record<string, string> = {
	expressive:
		'Mood and personality: these tags describe an impression, rather than a letterform.',
	purpose: 'Typefaces grouped by tasks such as reading or learning to write.',
	sans: 'Details of sans-serif construction, from geometric shapes to humanist forms.',
	serif: 'Different traditions and forms of serif lettering.',
	slab: 'Variations on prominent, block-like serifs.',
	script:
		'Connected and handwritten forms, from formal scripts to casual lettering.',
	seasonal: 'Themes associated with holidays and celebrations.',
	'special-use':
		'Fonts for symbols, notation, icons, and other specialist uses.',
	theme: 'Visual treatments and references to periods, materials, and styles.',
};

const Directory = ({ pages }: { pages: DiscoveryPage[] }) => (
	<ul className={classes.directory}>
		{pages.map((page) => (
			<li key={page.path}>
				<Link to={page.path} prefetch="intent" className={classes.link}>
					<span>{page.label}</span>
					<span className={classes.count}>
						{page.count.toLocaleString('en-US')}
						<span className={classes.srOnly}> families</span>
					</span>
				</Link>
			</li>
		))}
	</ul>
);

const Categories = ({ pages }: { pages: DiscoveryPage[] }) => (
	<ul className={classes.categories}>
		{pages.map((page) => {
			const specimen = specimens[page.path];
			return (
				<li key={page.path}>
					<Link
						to={page.path}
						prefetch="intent"
						className={classes.categoryLink}
					>
						<span className={classes.categoryLabel}>
							<span>{page.label}</span>
							<span className={classes.count}>
								{page.count.toLocaleString('en-US')} families
							</span>
							<IconArrowRight size={18} aria-hidden />
						</span>
						{specimen && (
							<>
								<span
									className={classes.specimen}
									style={{ fontFamily: `"${specimen.family}"` }}
									aria-hidden
								>
									{specimen.text}
								</span>
								<span className={classes.specimenCredit}>
									{specimen.family}
								</span>
							</>
						)}
					</Link>
				</li>
			);
		})}
	</ul>
);

const TagPreview = ({
	page,
	specimen,
}: {
	page: DiscoveryPage;
	specimen?: {
		id: string;
		family: string;
		text: string;
		direction?: 'ltr' | 'rtl';
	};
}) => {
	const { ref, entry } = useIntersection<HTMLLIElement>({
		rootMargin: '200px',
	});
	const stylesheetStatus = usePreviewStylesheet(
		`https://cdn.jsdelivr.net/fontsource/css/${specimen?.id}@latest/index.css`,
		Boolean(specimen && entry?.isIntersecting),
	);
	const ready = useIsFontReady(
		specimen?.family ?? '',
		Boolean(specimen && stylesheetStatus !== 'loading'),
	);
	return (
		<li ref={ref}>
			<Link to={page.path} prefetch="intent" className={classes.tagLink}>
				<span className={classes.categoryLabel}>
					<span>{page.label}</span>
					<span className={classes.count}>
						{page.count.toLocaleString('en-US')}
						<span className={classes.srOnly}> families</span>
					</span>
				</span>
				{specimen && (
					<>
						<span
							className={classes.tagSpecimen}
							data-ready={ready || undefined}
							style={{ fontFamily: `"${specimen.family}"` }}
							dir={specimen.direction}
							aria-hidden
						>
							{specimen.text}
						</span>
						<span className={classes.specimenCredit}>{specimen.family}</span>
					</>
				)}
			</Link>
		</li>
	);
};

export default function Browse() {
	const showSponsor = useMediaQuery('(min-width: 1201px)');
	const { pages, tagGroups, tagSpecimens } = useLoaderData<typeof loader>();
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
			{Object.values(specimens).map((specimen) => (
				<link
					key={specimen.id}
					rel="stylesheet"
					href={`https://cdn.jsdelivr.net/fontsource/css/${specimen.id}@latest/index.css`}
				/>
			))}
			<header className={classes.header}>
				<h1>Browse fonts</h1>
				<p>Find your type. Explore letterforms, languages, and character.</p>
			</header>
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
						<p>Different forms. Different voices.</p>
						{showSponsor && (
							<aside
								className={classes.categorySponsor}
								aria-label="Advertisement"
							>
								<CarbonAd className={classes.categoryAd} />
							</aside>
						)}
					</div>
					<div>
						<Categories pages={categories} />
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
						<h2>Languages &amp; scripts</h2>
						<p>Find the writing systems your project needs.</p>
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
								{groupDescriptions[group.id] && (
									<p className={classes.groupDescription}>
										{groupDescriptions[group.id]}
									</p>
								)}
								<ul className={classes.tagDirectory}>
									{group.pages.map((page) => (
										<TagPreview
											key={page.path}
											page={page}
											specimen={tagSpecimens[page.path]}
										/>
									))}
								</ul>
							</section>
						))}
					</div>
				</section>
			</div>
		</>
	);
}
