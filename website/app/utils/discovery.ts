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

const languageIntros: Record<string, string> = {
	arabic:
		'Compare open-source Arabic fonts using native text and right-to-left shaping.',
	bengali:
		'Preview open-source Bengali fonts with native text, conjuncts, and vowel marks.',
	'chinese-hongkong':
		'Browse open-source Hong Kong Chinese fonts and preview native Traditional Chinese text.',
	'chinese-simplified':
		'Compare open-source Simplified Chinese fonts with native text for headlines and body copy.',
	'chinese-traditional':
		'Browse open-source Traditional Chinese fonts and inspect detailed characters with native text.',
	cyrillic:
		'Explore open-source Cyrillic fonts across serif, sans serif, display, and handwriting styles.',
	devanagari:
		'Preview open-source Devanagari fonts with native text, conjuncts, and vowel marks.',
	greek:
		'Compare open-source Greek fonts for readable text and distinctive display typography.',
	gujarati:
		'Preview open-source Gujarati fonts with native text, vowel marks, and conjunct forms.',
	gurmukhi:
		'Browse open-source Gurmukhi fonts and compare native letterforms, vowel signs, and styles.',
	hebrew:
		'Compare open-source Hebrew fonts with native right-to-left text across contemporary styles.',
	japanese:
		'Explore open-source Japanese fonts with native kana and kanji previews.',
	kannada:
		'Preview open-source Kannada fonts with native text, conjuncts, and rounded letterforms.',
	khmer:
		'Compare open-source Khmer fonts with native text and complex stacked letterforms.',
	korean:
		'Browse open-source Korean fonts and preview Hangul across readable and expressive styles.',
	tamil:
		'Preview open-source Tamil fonts with native text across traditional and contemporary styles.',
	telugu:
		'Compare open-source Telugu fonts with native text and rounded letterforms.',
	thai: 'Browse open-source Thai fonts and preview native text with marks and diacritics.',
	vietnamese:
		'Compare open-source Vietnamese fonts with native text and Vietnamese diacritics.',
};

const categories: Record<string, { intro: string; label: string }> = {
	display: {
		intro:
			'Find open-source display fonts for expressive headlines, posters, branding, and bold visual moments.',
		label: 'Display',
	},
	handwriting: {
		intro:
			'Explore open-source handwriting fonts with script, brush, and informal styles for personal typography.',
		label: 'Handwriting',
	},
	icons: {
		intro:
			'Browse open-source icon fonts for interface symbols, pictograms, and self-hosted visual assets.',
		label: 'Icon',
	},
	monospace: {
		intro:
			'Compare open-source monospace fonts for code, data, technical interfaces, and editorial details.',
		label: 'Monospace',
	},
	'sans-serif': {
		intro:
			'Explore versatile open-source sans serif fonts for interfaces, branding, and everyday reading.',
		label: 'Sans Serif',
	},
	serif: {
		intro:
			'Browse distinctive open-source serif fonts for editorial design, branding, and long-form reading.',
		label: 'Serif',
	},
};

const variableIntro =
	'Explore open-source variable fonts with flexible weight, width, and other axes within each family.';

const getDescription = (intro: string) =>
	`${intro} Self-host your chosen family with Fontsource.`;

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
			const intro =
				languageIntros[target.value] ??
				`Browse open-source ${label} fonts and preview native text before choosing a family.`;
			return {
				count,
				description: getDescription(intro),
				heading: `${label} Fonts`,
				intro,
				kind: target.kind,
				path: `/languages/${target.value}`,
				routeState: { subsets: target.value },
			};
		}
		case 'category': {
			const { intro, label } = categories[target.value];
			return {
				count,
				description: getDescription(intro),
				heading: `${label} Fonts`,
				intro,
				kind: target.kind,
				path: `/categories/${target.value}`,
				routeState: { category: target.value },
			};
		}
		case 'variable': {
			return {
				count,
				description: getDescription(variableIntro),
				heading: 'Variable Fonts',
				intro: variableIntro,
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
			categories[category]
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
