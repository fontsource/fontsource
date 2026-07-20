import {
	categoryDiscoveryContent,
	languageDiscoveryContent,
	variableDiscoveryContent,
} from './discovery-content';
import { subsetToLanguage } from './language/subsets';

const MIN_DISCOVERY_FAMILIES = 10;

const excludedLanguageSubsets = new Set([
	'emoji',
	'greek-ext',
	'latin',
	'latin-ext',
	'math',
	'symbols',
	'symbols2',
	'cyrillic-ext',
]);

export interface DiscoveryRouteState {
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

export type DiscoveryCounts = {
	categories: Record<string, number>;
	subsets: Record<string, number>;
	variable: number;
};

type DiscoveryTarget =
	| { kind: 'category'; value: string }
	| { kind: 'language'; value: string }
	| { kind: 'variable' };

const buildDiscoveryPage = (
	target: DiscoveryTarget,
	count: number,
): DiscoveryPage | undefined => {
	if (count < MIN_DISCOVERY_FAMILIES) return undefined;

	switch (target.kind) {
		case 'language': {
			const label = subsetToLanguage(target.value);
			const content = languageDiscoveryContent[target.value] ?? {
				description: `Browse open-source ${label} fonts with native text previews. Compare available families and self-host your choice with Fontsource.`,
				intro: `Explore ${label} typefaces with native text and find the right family for your project.`,
			};
			return {
				count,
				description: content.description,
				heading: `${label} Fonts`,
				intro: content.intro,
				kind: target.kind,
				label,
				path: `/languages/${target.value}`,
				routeState: { subsets: target.value },
			};
		}
		case 'category': {
			const content = categoryDiscoveryContent[target.value];
			if (!content) return undefined;
			return {
				count,
				description: content.description,
				heading: `${content.label} Fonts`,
				intro: content.intro,
				kind: target.kind,
				label: content.label,
				path: `/categories/${target.value}`,
				routeState: { category: target.value },
			};
		}
		case 'variable': {
			return {
				count,
				description: variableDiscoveryContent.description,
				heading: 'Variable Fonts',
				intro: variableDiscoveryContent.intro,
				kind: target.kind,
				label: 'Variable',
				path: '/variable-fonts',
				routeState: { variable: true },
			};
		}
	}
};

export const getDiscoveryPages = (counts: DiscoveryCounts): DiscoveryPage[] => {
	const pages = [
		...Object.keys(counts.subsets).map((subset) =>
			excludedLanguageSubsets.has(subset)
				? undefined
				: buildDiscoveryPage(
						{ kind: 'language', value: subset },
						counts.subsets[subset],
					),
		),
		...Object.keys(counts.categories).map((category) =>
			buildDiscoveryPage(
				{ kind: 'category', value: category },
				counts.categories[category],
			),
		),
		buildDiscoveryPage({ kind: 'variable' }, counts.variable),
	];

	return pages
		.filter((page): page is DiscoveryPage => page !== undefined)
		.sort((a, b) => a.heading.localeCompare(b.heading));
};
