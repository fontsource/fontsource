import type {
	FontStyle,
	ProcessedVariant,
	StaticProcessedVariant,
	SubsetDefinition,
	VariableProcessedVariant,
} from './types';
import { codepointsToRangeString, normalizeKebabCase } from './utils';

/**
 * Generates the `src` property for a @font-face rule.
 */
const generateFontSrc = (variants: ProcessedVariant[]): string => {
	if (variants.length === 0) return '';

	const isVariable = variants[0]?.type === 'variable';

	return variants
		.map((variant) => {
			const url = `./files/${variant.filename}`;
			const format = variant.filename.endsWith('woff2')
				? isVariable
					? 'woff2-variations'
					: 'woff2'
				: 'woff';

			return `url(${url}) format('${format}')`;
		})
		.join(', ');
};

/**
 * Generates a single @font-face rule.
 */
const generateFontFace = (
	family: string,
	variants: ProcessedVariant[],
	subset: SubsetDefinition,
): string => {
	if (variants.length === 0) return '';

	// All variants in a group share the same subset and slice index.
	const firstVariant = variants[0];
	const sliceIndex = firstVariant.sliceIndex;

	// Get unicode range from subset definition.
	const unicodeRange =
		subset.type === 'range'
			? subset.unicodeRange
			: subset.slices.find((s) => s.index === sliceIndex)
				? codepointsToRangeString(
						subset.slices.find((s) => s.index === sliceIndex)?.codepoints,
					)
				: '';

	if (!unicodeRange) return '';

	let style: FontStyle | string;
	let weight: number | string;
	let stretch: string | null = null;
	let comment: string;

	if (firstVariant.type === 'variable') {
		const { wght, slnt, wdth } = firstVariant.variable;

		// Default to wght axis if no axes are configured.
		weight = wght
			? wght.min === wght.max
				? `${wght.min}`
				: `${wght.min} ${wght.max}`
			: Object.keys(firstVariant.variable).length === 0
				? '100 900'
				: '400';

		style =
			slnt && (slnt.min !== 0 || slnt.max !== 0)
				? slnt.min === slnt.max
					? `oblique ${Math.abs(slnt.min)}deg`
					: `oblique ${Math.abs(slnt.max)}deg ${Math.abs(slnt.min)}deg`
				: 'normal';

		if (wdth) {
			stretch = `\n  font-stretch: ${wdth.min === wdth.max ? `${wdth.min}%` : `${wdth.min}% ${wdth.max}%`};`;
		}

		const normalizedStyle = style.startsWith('oblique ') ? 'italic' : style;
		comment = `${normalizeKebabCase(family)}-${firstVariant.subset}-${firstVariant.axisKey}-${normalizedStyle}`;
	} else {
		style = firstVariant.style;
		weight = firstVariant.weight;
		const normalizedStyle = style.startsWith('oblique ') ? 'italic' : style;
		comment = `${normalizeKebabCase(family)}-${firstVariant.subset}-${weight}-${normalizedStyle}`;
	}

	if (sliceIndex > 0) {
		comment += `-${sliceIndex}`;
	}

	const src = generateFontSrc(variants);

	const fontFamily =
		firstVariant.type === 'variable' ? `${family} Variable` : family;

	return `/* ${comment} */
@font-face {
  font-family: '${fontFamily}';
  font-style: ${style};
  font-display: swap;
  font-weight: ${weight};${stretch ?? ''}
  src: ${src};
  unicode-range: ${unicodeRange};
}
`;
};

/**
 * A CSS generator that groups variants by subset and slice index to create @font-face rules.
 */
const generateCSS = (
	family: string,
	variants: ProcessedVariant[],
	subsets: Map<string, SubsetDefinition>,
): string => {
	// Group variants by a composite key of subset and slice index.
	const groupedVariants = new Map<string, ProcessedVariant[]>();

	for (const variant of variants) {
		const key = `${variant.subset}-${variant.sliceIndex}`;
		const group = groupedVariants.get(key) ?? [];

		group.push(variant);
		groupedVariants.set(key, group);
	}

	// Generate the CSS string from the grouped variants.
	let css = '';
	for (const group of groupedVariants.values()) {
		const subset = subsets.get(group[0].subset);

		if (subset) {
			css += generateFontFace(family, group, subset);
		}
	}

	return css;
};

export const generateStaticCSS = (
	family: string,
	weight: number,
	style: FontStyle,
	variants: ProcessedVariant[],
	subsets: Map<string, SubsetDefinition>,
): string => {
	const staticVariants = variants.filter(
		(variant): variant is StaticProcessedVariant =>
			variant.type === 'static' &&
			variant.weight === weight &&
			variant.style === style,
	);

	return generateCSS(family, staticVariants, subsets);
};

export const generateVariableCSS = (
	family: string,
	variants: ProcessedVariant[],
	subsets: Map<string, SubsetDefinition>,
): string => {
	const variableVariants = variants.filter(
		(variant): variant is VariableProcessedVariant =>
			variant.type === 'variable',
	);

	return generateCSS(family, variableVariants, subsets);
};
