import {
	categoryDiscoveryContent,
	languageDiscoveryContent,
	variableDiscoveryContent,
} from './discovery-content';
import { subsetToLanguage } from './language/subsets';

const MIN_DISCOVERY_FAMILIES = 10;

interface DiscoveryRouteState {
	category?: string;
	subsets?: string;
	variable?: boolean;
}

export interface DiscoveryPage {
	count: number;
	description: string;
	heading: string;
	intro: string;
	kind: 'category' | 'language' | 'variable';
	label: string;
	path: string;
	routeState: DiscoveryRouteState;
}

type DiscoveryCounts = {
	categories: Record<string, number>;
	subsets: Record<string, number>;
	variable: number;
};

export const getDiscoveryPages = (counts: DiscoveryCounts): DiscoveryPage[] => {
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
		...Object.entries(categoryDiscoveryContent).map(([category, content]) => ({
			count: counts.categories[category] ?? 0,
			description: content.description,
			heading: `${content.label} Fonts`,
			intro: content.intro,
			kind: 'category' as const,
			label: content.label,
			path: `/categories/${category}`,
			routeState: { category },
		})),
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
		.filter((page) => page.count >= MIN_DISCOVERY_FAMILIES)
		.sort((a, b) => a.heading.localeCompare(b.heading));
};
