import { Axes, Metadata, UnicodeRange } from '../types';
import { findClosest, sassVar } from '../utils';

const subsetValue = (metadata: Metadata, unicodeRange: UnicodeRange) => {
	// Merge metadata subsets and unicode range
	const subsets: Record<string, string[]> = {};
	for (const subset of metadata.subsets) {
		subsets[subset] = [];
	}
	for (const range of Object.keys(unicodeRange)) {
		const rangeNumMatch = range.match(/\[d+]/);
		if (rangeNumMatch && rangeNumMatch.length > 0) {
			// Cover numeric unicode ranges
			subsets[metadata.defSubset] ??= [];
			subsets[metadata.defSubset][Number.parseInt(rangeNumMatch[0], 10)] =
				unicodeRange[range];
		} else {
			subsets[range] = [unicodeRange[range]];
		}
	}

	// Generate sass map from subsets
	let subsetsValue = '(\n';
	for (const subset of Object.keys(subsets)) {
		subsetsValue += `  ${subset}: `;

		if (subsets[subset].length > 0) {
			subsetsValue += '(\n';
			for (const range of subsets[subset]) {
				subsetsValue += `    (${range}),\n`;
			}
			subsetsValue += '  ),\n';
		} else {
			subsetsValue += 'null';
		}

		subsetsValue += ',\n';
	}
	subsetsValue += ')';

	return subsetsValue;
};

const axesValue = (metadata: Metadata) => {
	if (metadata.variable && Object.keys(metadata.variable).length > 0) {
		let subsetsValue = '(\n';
		for (const variable of Object.keys(metadata.variable)) {
			const axis = (metadata.variable as Axes)[variable];
			subsetsValue += `  ${variable}: (
    default: ${axis.default},
    min: ${axis.min},
    max: ${axis.max},
    step: ${axis.step},
  ),
`;
		}
		subsetsValue += ')';

		return subsetsValue;
	}

	return '()';
};

export const sassMetadata = (
	metadata: Metadata,
	unicodeRange: UnicodeRange
) => {
	let out = '';
	out += sassVar('id', `'${metadata.id}'`);
	out += sassVar('family', `'${metadata.family}'`);
	out += sassVar('category', `${metadata.category}`);
	out += sassVar('weights', `(${metadata.weights.join(', ')})`);
	out += sassVar('styles', `(${metadata.styles.join(', ')})`);
	out += sassVar(
		'defaults',
		`(
  subset: ${metadata.defSubset},
  weight: ${findClosest(metadata.weights, 400)},
  style: normal,
)`
	);
	out += sassVar('subsets', subsetValue(metadata, unicodeRange));
	out += sassVar('axes', axesValue(metadata));

	return out;
};
