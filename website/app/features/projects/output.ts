import type { ResolvedFontSetFamily } from './model';

const fallbacks: Record<ResolvedFontSetFamily['category'], string> = {
	'sans-serif': 'sans-serif',
	serif: 'serif',
	display: 'serif',
	handwriting: 'cursive',
	monospace: 'monospace',
	icons: 'sans-serif',
	other: 'sans-serif',
};

const getCdnStylesheetUrl = (
	item: ResolvedFontSetFamily,
	file = item.cssFile,
) => {
	const packageId = `${item.familyId}${item.format === 'variable' ? ':vf' : ''}@${item.packageVersion}`;
	return `https://cdn.jsdelivr.net/fontsource/css/${packageId}/${file}`;
};

const getPreviewCdnUrl = (item: ResolvedFontSetFamily) =>
	`https://cdn.jsdelivr.net/npm/${item.packageName}@${item.packageVersion}/index.css`;

const hasTag = (item: ResolvedFontSetFamily, tag: string) =>
	item.tags.includes(tag);
const hasSymbolCatalog = (item: ResolvedFontSetFamily) =>
	item.symbolInputModes.length > 0;
const usesNameLigatures = (item: ResolvedFontSetFamily) =>
	item.symbolInputModes.includes('name-ligature');
const isPunctuationFamily = (item: ResolvedFontSetFamily) =>
	hasTag(item, 'special-use/punctuation');
const isDigitalFamily = (item: ResolvedFontSetFamily) =>
	hasTag(item, 'special-use/digital-display');

const getFontStack = (item: ResolvedFontSetFamily) => {
	const family = item.fontFamily.replaceAll("'", "\\'");
	if (isPunctuationFamily(item)) {
		return `'${family}', 'Noto Sans JP', sans-serif`;
	}
	if (isDigitalFamily(item)) {
		return `'${family}', monospace`;
	}
	return `'${family}', ${fallbacks[item.category]}`;
};

const getUsageNote = (item: ResolvedFontSetFamily) => {
	if (usesNameLigatures(item)) {
		const examples = item.sampleText
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.join(' or ');
		return examples
			? `Use verified symbol names as ligatures, such as ${examples}.`
			: 'Use verified symbol names from the registry catalog as ligatures.';
	}
	if (isPunctuationFamily(item)) {
		return 'Punctuation only. Keep your Japanese text font immediately after it in the fallback stack.';
	}
	if (isDigitalFamily(item)) {
		return 'Tabular numerals and a single line keep changing readout values stable.';
	}
};

const getUsageBlock = (item: ResolvedFontSetFamily) => {
	const declarations = [
		`font-family: ${getFontStack(item)};`,
		`font-weight: ${item.weight};`,
		`font-style: ${item.style};`,
	];

	if (usesNameLigatures(item)) {
		declarations.push(
			'line-height: 1;',
			'text-transform: none;',
			'white-space: nowrap;',
			"font-feature-settings: 'liga';",
		);
	}
	if (isDigitalFamily(item)) {
		declarations.push(
			'font-variant-numeric: tabular-nums;',
			"font-feature-settings: 'tnum';",
			'white-space: nowrap;',
		);
	}

	return `.font-${item.familyId} {\n${declarations.map((line) => `  ${line}`).join('\n')}\n}`;
};

export {
	getCdnStylesheetUrl,
	getFontStack,
	getPreviewCdnUrl,
	getUsageBlock,
	getUsageNote,
	hasSymbolCatalog,
	isDigitalFamily,
	usesNameLigatures,
};
