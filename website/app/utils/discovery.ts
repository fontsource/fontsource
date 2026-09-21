import type { GetRegistryTaxonomyResponse } from '@/generated/api';
import {
	categoryDiscoveryContent,
	languageDiscoveryContent,
	variableDiscoveryContent,
} from './discovery-content';
import { subsetToLanguage } from './language/subsets';

const MIN_DISCOVERY_FAMILIES = 10;

interface DiscoveryRouteState {
	category?: string;
	classifications?: string;
	tags?: string;
	subsets?: string;
	variable?: boolean;
}

export interface DiscoveryPage {
	count: number;
	description: string;
	heading: string;
	intro: string;
	kind: 'category' | 'tag' | 'language' | 'variable';
	label: string;
	path: string;
	routeState: DiscoveryRouteState;
}

type DiscoveryCounts = {
	categories: Record<string, number>;
	classifications: Record<string, number>;
	tags: Record<string, number>;
	subsets: Record<string, number>;
	variable: number;
};

export const getDiscoveryPages = (
	counts: DiscoveryCounts,
	taxonomy: GetRegistryTaxonomyResponse,
): DiscoveryPage[] => {
	const pages: DiscoveryPage[] = [
		...Object.entries(languageDiscoveryContent).map(([subset, content]) => {
			const label = subsetToLanguage(subset);
			return {
				count: counts.subsets[subset] ?? 0,
				description: content.description,
				heading: `${label} Fonts`,
				intro: content.intro,
				kind: 'language' as const,
				label,
				path: `/languages/${subset}`,
				routeState: { subsets: subset },
			};
		}),
		...Object.entries(taxonomy.classifications).map(([id, { label }]) => {
			const content = categoryDiscoveryContent[id];
			return {
				count: counts.classifications[id] ?? 0,
				description:
					content?.description ??
					`Browse open-source ${label.toLowerCase()} fonts. Preview, compare, and self-host font families with Fontsource.`,
				heading: `${label} Fonts`,
				intro:
					content?.intro ??
					`Explore ${label.toLowerCase()} typefaces and preview your own text before choosing a family to self-host.`,
				kind: 'category' as const,
				label,
				path: `/categories/${id}`,
				routeState: { classifications: id },
			};
		}),
		// Icons is a shipped legacy category, not an alias for all symbol fonts.
		{
			count: counts.categories.icons ?? 0,
			...categoryDiscoveryContent.icons,
			heading: 'Icon Fonts',
			kind: 'category',
			path: '/categories/icons',
			routeState: { category: 'icons' },
		},
		...Object.entries(taxonomy.tags).map(([id, tag]) => {
			const group = taxonomy.tagGroups[id.split('/')[0]];
			const duplicateLabel = Object.entries(taxonomy.tags).some(
				([otherId, other]) => otherId !== id && other.label === tag.label,
			);
			const label =
				duplicateLabel && group ? `${tag.label} ${group.label}` : tag.label;
			return {
				count: counts.tags[id] ?? 0,
				description: `Browse open-source ${label.toLowerCase()} fonts. Preview your text, compare families, and self-host with Fontsource.`,
				heading: `${label} Fonts`,
				intro: `Explore font families tagged ${label.toLowerCase()}. Compare their styles with your own text and find a typeface for your next project.`,
				kind: 'tag' as const,
				label,
				path: `/tags/${id}`,
				routeState: { tags: id },
			};
		}),
		{
			count: counts.variable,
			description: variableDiscoveryContent.description,
			heading: 'Variable Fonts',
			intro: variableDiscoveryContent.intro,
			kind: 'variable' as const,
			label: 'Variable',
			path: '/variable-fonts',
			routeState: { variable: true },
		},
	];

	return pages
		.filter(
			(page) =>
				page.count >=
				(page.kind === 'category' || page.kind === 'tag'
					? 1
					: MIN_DISCOVERY_FAMILIES),
		)
		.sort((a, b) => a.heading.localeCompare(b.heading));
};
