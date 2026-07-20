type DiscoveryContent = {
	description: string;
	intro: string;
};

export const languageDiscoveryContent = {
	arabic: {
		description:
			'Browse open-source Arabic fonts with native right-to-left previews. Compare connected letterforms, styles, and families ready to self-host.',
		intro:
			'Find Arabic typefaces for connected, right-to-left text, from long-form reading to display.',
	},
	bengali: {
		description:
			'Explore open-source Bengali fonts with native previews for conjuncts and vowel marks, then self-host the family that suits your project.',
		intro:
			'Compare Bengali typefaces through conjuncts, vowel marks, and flowing native text.',
	},
	'chinese-hongkong': {
		description:
			'Browse open-source Hong Kong Chinese fonts with native Traditional Chinese previews, compare regional forms, and self-host your choice.',
		intro:
			'Explore Hong Kong Chinese typefaces with native text and region-specific character forms.',
	},
	'chinese-simplified': {
		description:
			'Explore open-source Simplified Chinese fonts in native headlines and body text. Compare families and self-host your selected typeface.',
		intro:
			'Compare Simplified Chinese typefaces across interfaces, headlines, and longer passages.',
	},
	'chinese-traditional': {
		description:
			'Browse open-source Traditional Chinese fonts with native text previews. Inspect character detail, compare styles, and self-host your choice.',
		intro:
			'Explore Traditional Chinese typefaces with detailed characters and balanced text texture.',
	},
	cyrillic: {
		description:
			'Browse open-source Cyrillic fonts across serif, sans serif, display, and handwriting styles, with live previews and easy self-hosting.',
		intro:
			'Find Cyrillic typefaces for clear interface text, distinctive headlines, and lettering.',
	},
	devanagari: {
		description:
			'Explore open-source Devanagari fonts with native previews for conjuncts and vowel marks, then self-host the right family for your project.',
		intro:
			'Compare Devanagari typefaces through conjuncts, headline forms, and vowel marks.',
	},
	greek: {
		description:
			'Browse open-source Greek fonts for body text, interfaces, and display typography. Preview your words and self-host with Fontsource.',
		intro:
			'Find Greek typefaces for readable text and expressive display work.',
	},
	gujarati: {
		description:
			'Explore open-source Gujarati fonts with native previews for vowel marks and conjunct forms, then self-host your selected family.',
		intro:
			'Compare Gujarati typefaces through native vowel marks, conjuncts, and overall rhythm.',
	},
	gurmukhi: {
		description:
			'Browse open-source Gurmukhi fonts, preview native letterforms and vowel signs, and self-host your chosen family with Fontsource.',
		intro:
			'Explore Gurmukhi typefaces through native letterforms, vowel signs, and spacing.',
	},
	hebrew: {
		description:
			'Explore open-source Hebrew fonts with right-to-left previews. Compare readable and expressive styles, then self-host your choice.',
		intro:
			'Compare Hebrew typefaces in right-to-left text, from reading faces to display styles.',
	},
	japanese: {
		description:
			'Browse open-source Japanese fonts with native kana and kanji previews. Compare families for text and display, then self-host your choice.',
		intro:
			'Explore Japanese typefaces with kana and kanji together in native text.',
	},
	kannada: {
		description:
			'Explore open-source Kannada fonts with native previews for rounded forms and conjuncts, then self-host your chosen family.',
		intro:
			'Compare Kannada typefaces through rounded forms, conjuncts, and native spacing.',
	},
	khmer: {
		description:
			'Browse open-source Khmer fonts with native text previews. Inspect stacked forms, compare styles, and self-host your selected family.',
		intro:
			'Explore Khmer typefaces through stacked forms, proportions, and native text.',
	},
	korean: {
		description:
			'Explore open-source Korean fonts with native Hangul previews. Compare text and display styles, then self-host your chosen family.',
		intro:
			'Compare Korean typefaces in Hangul, from quiet reading faces to display styles.',
	},
	tamil: {
		description:
			'Browse open-source Tamil fonts with native text previews. Compare traditional and contemporary styles, then self-host your choice.',
		intro:
			'Find Tamil typefaces with the right rhythm for reading, interfaces, and display.',
	},
	telugu: {
		description:
			'Explore open-source Telugu fonts with native previews. Compare rounded letterforms and styles, then self-host your selected family.',
		intro:
			'Compare Telugu typefaces through rounded forms, native spacing, and character.',
	},
	thai: {
		description:
			'Browse open-source Thai fonts with native previews for marks and diacritics. Compare styles and self-host your chosen family.',
		intro:
			'Explore Thai typefaces through tone marks, diacritics, spacing, and native text.',
	},
	vietnamese: {
		description:
			'Explore open-source Vietnamese fonts with native diacritic previews. Compare readable styles and self-host your chosen family.',
		intro:
			'Compare Vietnamese typefaces through dense diacritics and everyday reading.',
	},
} satisfies Record<string, DiscoveryContent>;

export const categoryDiscoveryContent = {
	display: {
		description:
			'Browse open-source display fonts for headlines, posters, and branding. Preview your text, compare styles, and self-host with Fontsource.',
		intro:
			'Find expressive typefaces for headlines, posters, branding, and bold visual moments.',
		label: 'Display',
	},
	handwriting: {
		description:
			'Explore open-source handwriting fonts in script, brush, and informal styles. Preview your text and self-host your chosen family.',
		intro:
			'Explore script, brush, and informal typefaces when your words need a more personal voice.',
		label: 'Handwriting',
	},
	icons: {
		description:
			'Browse open-source icon fonts for interface symbols and pictograms, preview each family, and self-host the assets your project needs.',
		intro:
			'Browse symbol and pictogram typefaces for interfaces, controls, and reusable visual systems.',
		label: 'Icon',
	},
	monospace: {
		description:
			'Explore open-source monospace fonts for code, terminals, data, and technical interfaces. Preview and self-host with Fontsource.',
		intro:
			'Compare fixed-width typefaces for code, data, interfaces, and precise editorial details.',
		label: 'Monospace',
	},
	'sans-serif': {
		description:
			'Browse open-source sans serif fonts for interfaces, branding, and readable text. Compare families and self-host with Fontsource.',
		intro:
			'Explore versatile typefaces for interfaces, branding, and clear everyday reading.',
		label: 'Sans Serif',
	},
	serif: {
		description:
			'Explore open-source serif fonts for editorial design, branding, and long-form text. Preview, compare, and self-host with Fontsource.',
		intro:
			'Browse distinctive typefaces for editorial design, branding, and comfortable long-form reading.',
		label: 'Serif',
	},
} satisfies Record<string, DiscoveryContent & { label: string }>;

export const variableDiscoveryContent: DiscoveryContent = {
	description:
		'Browse open-source variable fonts with adjustable weight, width, and other axes. Preview variations and self-host with Fontsource.',
	intro:
		'Explore flexible typefaces with adjustable weight, width, and other design axes.',
};
