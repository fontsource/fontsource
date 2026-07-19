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

const categoryLabels: Record<string, string> = {
	display: 'Display',
	handwriting: 'Handwriting',
	icons: 'Icon',
	monospace: 'Monospace',
	'sans-serif': 'Sans Serif',
	serif: 'Serif',
};

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
			return {
				count,
				description: `Browse open-source font families that publish Fontsource's ${label} subset. Preview and compare fonts, then self-host with npm, a download, or CDN.`,
				heading: `${label} Fonts`,
				intro: `Explore ${count} open-source font families that publish Fontsource's ${label} subset. Subset availability describes the packaged character range, so verify the exact characters and shaping your project requires.`,
				kind: target.kind,
				path: `/languages/${target.value}`,
				routeState: { subsets: target.value },
			};
		}
		case 'category': {
			const label = categoryLabels[target.value];
			return {
				count,
				description: `Browse and preview ${label.toLowerCase()} font families from Fontsource, then self-host your selection with npm, a download, or CDN.`,
				heading: `${label} Fonts`,
				intro: `Explore ${count} open-source ${label.toLowerCase()} font families, then use the full catalog controls to refine and compare the results.`,
				kind: target.kind,
				path: `/categories/${target.value}`,
				routeState: { category: target.value },
			};
		}
		case 'variable': {
			return {
				count,
				description:
					'Browse and preview open-source variable font families from Fontsource, then self-host your selection with npm, a download, or CDN.',
				heading: 'Variable Fonts',
				intro: `Explore ${count} open-source variable font families with configurable axes, then refine and compare them with the full catalog controls.`,
				kind: target.kind,
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
			categoryLabels[category]
				? buildDiscoveryPage(
						{ kind: 'category', value: category },
						counts.categories[category],
					)
				: undefined,
		),
		buildDiscoveryPage({ kind: 'variable' }, counts.variable),
	];

	return pages
		.filter((page): page is DiscoveryPage => page !== undefined)
		.sort((a, b) => a.heading.localeCompare(b.heading));
};
