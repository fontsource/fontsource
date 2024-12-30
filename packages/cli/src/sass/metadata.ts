import type { Axes, Metadata, UnicodeRange } from '../types';
import { findClosest } from '../utils';

const axesValue = (metadata: Metadata) => {
	let out = '(\n';
	for (const variable of Object.keys(metadata.variable)) {
		const axis = (metadata.variable as Axes)[variable];
		out += `  ${variable}: (
    default: ${axis.default},
    min: ${axis.min},
    max: ${axis.max},
    step: ${axis.step},
  ),
`;
	}
	out += ')';
	return out;
};

const unicodeValue = (unicode: UnicodeRange) => {
	if (Object.keys(unicode).length > 0) {
		let out = '(\n';

		for (const unicodeKey of Object.keys(unicode)) {
			const unicodeVal = unicode[unicodeKey];

			out += `  ${unicodeKey
				.replace('[', '')
				.replace(']', '')}: (${unicodeVal}),\n`;
		}

		out += ')';

		return out;
	}

	return 'null';
};

const defaultAxis = (metadata: Metadata) => {
	const axes = Object.keys(metadata.variable);
	if (axes.includes('wght')) return 'wght';
	if (axes.includes('full')) return 'full';
	return axes[0];
};

export const sassMetadata = (
	metadata: Metadata,
	unicode: UnicodeRange,
	isVariable: boolean,
) => {
	return `$metadata: (
  id: '${metadata.id}',
  family: '${metadata.family}',
  category: ${metadata.category},
  subsets: (${metadata.subsets.join(', ')}),
  weights: (${metadata.weights.join(', ')}),
  styles: (${metadata.styles.join(', ')}),
  axes: ${isVariable ? axesValue(metadata) : 'null'},
  defaults: (
    subset: ${metadata.defSubset},
    weight: ${findClosest(metadata.weights, 400)},
    style: normal,
    axis: ${isVariable ? defaultAxis(metadata) : 'null'},
  ),
  unicode: ${unicodeValue(unicode)}
) !default;`;
};
