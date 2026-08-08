import { getJsDelivrPackageUrl } from '../../utils/cdn';
import type { ProjectItem } from './model';

const fallbacks: Record<ProjectItem['category'], string> = {
	'sans-serif': 'sans-serif',
	serif: 'serif',
	display: 'serif',
	handwriting: 'cursive',
	monospace: 'monospace',
	icons: 'sans-serif',
	other: 'sans-serif',
};

const getProjectCssFiles = (item: ProjectItem) =>
	item.cssFiles?.length ? item.cssFiles : [item.cssFile];

const getProjectCdnUrls = (item: ProjectItem) =>
	getProjectCssFiles(item).map((file) =>
		getJsDelivrPackageUrl(item.packageName, item.packageVersion, file),
	);

const getCdnUrl = (item: ProjectItem) => getProjectCdnUrls(item)[0];

const getProjectEditUrl = (item: ProjectItem) => {
	const params = new URLSearchParams({
		from: 'selected-fonts',
		format: item.format,
		styles: (item.styles ?? [item.style]).join(','),
		weights: (item.weights ?? [item.weight]).join(','),
	});
	if (item.subsets?.length) params.set('subsets', item.subsets.join(','));
	if (item.activeAxes?.length)
		params.set('activeAxes', item.activeAxes.join(','));
	if (item.formats?.length) params.set('formats', item.formats.join(','));
	if (item.fontDisplay) params.set('display', item.fontDisplay);
	const axes = Object.entries(item.axes)
		.map(([axis, value]) => `${axis}:${value}`)
		.join(',');
	if (axes) params.set('axes', axes);
	return `/fonts/${encodeURIComponent(item.familyId)}/use?${params}`;
};

const getSelectedCssFiles = (
	item: Pick<ProjectItem, 'cssFile' | 'format' | 'subset'>,
	styles: ProjectItem['style'][],
	weights: number[],
) => {
	if (item.cssFile === 'full.css') return ['full.css'];
	if (item.format === 'variable') {
		const axisKey = item.cssFile
			.replace(`${item.subset}-`, '')
			.replace('-italic.css', '')
			.replace('.css', '');
		return styles.map(
			(style) =>
				`${item.subset}-${axisKey}${style === 'italic' ? '-italic' : ''}.css`,
		);
	}
	return styles.flatMap((style) =>
		weights.map(
			(weight) =>
				`${item.subset}-${weight}${style === 'italic' ? '-italic' : ''}.css`,
		),
	);
};

const hasTag = (item: ProjectItem, tag: string) => item.tags.includes(tag);
const hasSymbolCatalog = (item: ProjectItem) =>
	item.symbolInputModes.length > 0;
const usesNameLigatures = (item: ProjectItem) =>
	item.symbolInputModes.includes('name-ligature');
const isPunctuationFamily = (item: ProjectItem) =>
	hasTag(item, 'special-use/punctuation');
const isDigitalFamily = (item: ProjectItem) =>
	hasTag(item, 'special-use/digital-display');

const getFontStack = (item: ProjectItem) => {
	const family = item.fontFamily.replaceAll("'", "\\'");
	if (isPunctuationFamily(item)) {
		return `'${family}', 'Noto Sans JP', sans-serif`;
	}
	if (isDigitalFamily(item)) {
		return `'${family}', monospace`;
	}
	return `'${family}', ${fallbacks[item.category]}`;
};

const getUsageNote = (item: ProjectItem) => {
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

const getUsageBlock = (item: ProjectItem) => {
	const declarations = [
		`font-family: ${getFontStack(item)};`,
		`font-weight: ${item.weight};`,
		`font-style: ${item.style};`,
	];

	if (Object.keys(item.axes).length > 0) {
		const settings = Object.entries(item.axes)
			.map(([axis, value]) => `'${axis}' ${value}`)
			.join(', ');
		declarations.push(`font-variation-settings: ${settings};`);
	}
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

const escapeHtml = (value: string) =>
	value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;');

const getUsageMarkup = (item: ProjectItem) => {
	const sample = escapeHtml(item.sampleText);
	const className = `font-${item.familyId}`;
	if (usesNameLigatures(item)) {
		return `<span class="${className}" aria-hidden="true">${sample}</span>`;
	}
	if (isPunctuationFamily(item)) {
		return `<p class="${className}">${sample}</p>`;
	}
	if (isDigitalFamily(item)) {
		return `<span class="${className}">${sample}</span>`;
	}
};

const getProjectCss = (items: ProjectItem[]) => {
	const licenses = items
		.map(
			(item) =>
				`/* ${item.displayName}: ${
					item.license.verified && item.license.id
						? `${item.license.id} (registry verified)`
						: 'license not verified'
				} */`,
		)
		.join('\n');
	const imports = items
		.flatMap((item) =>
			item.cdnFontFaceCSS
				? [item.cdnFontFaceCSS]
				: getProjectCdnUrls(item).map((url) => `@import url('${url}');`),
		)
		.join('\n');
	const usage = items.map(getUsageBlock).join('\n\n');
	return `/* Generated by Fontsource Font Set */\n${licenses}\n${imports}\n\n${usage}\n`;
};

export {
	getCdnUrl,
	getFontStack,
	getProjectCdnUrls,
	getProjectCss,
	getProjectCssFiles,
	getProjectEditUrl,
	getSelectedCssFiles,
	getUsageBlock,
	getUsageMarkup,
	getUsageNote,
	hasSymbolCatalog,
	isDigitalFamily,
	usesNameLigatures,
};
